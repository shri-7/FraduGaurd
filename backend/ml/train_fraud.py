import os
import json
import argparse
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Optional heavy deps imported lazily
try:
    from sklearn.ensemble import RandomForestClassifier, IsolationForest
    from sklearn.metrics import roc_auc_score, f1_score, precision_recall_fscore_support, confusion_matrix
except Exception as e:
    raise RuntimeError("scikit-learn is required to run training: pip install scikit-learn")

# ONNX export (optional but recommended)
try:
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType
    SKL2ONNX_AVAILABLE = True
except Exception:
    SKL2ONNX_AVAILABLE = False

# SHAP for explainability (optional)
try:
    import shap
    SHAP_AVAILABLE = True
except Exception:
    SHAP_AVAILABLE = False

FEATURE_SPEC = [
    "claim_amount",
    "amount_over_expected_ratio",
    "num_claims_last_6mo_by_patient",
    "num_claims_last_6mo_by_provider",
    "avg_claim_amount_by_provider",
    "billing_code_variability_score",
    "distinct_billing_codes_count",
    "time_between_service_and_claim",
    "token_age_seconds",
    "service_token_reuse_flag",
    "patient_hash_reuse_flag",
    "provider_risk_score",
    "semantic_text_diff",
    "is_new_provider_flag",
    "claim_weekday_hour",
]

RNG = np.random.default_rng(42)


def simulate_claims(n=5000, fraud_rate=0.15, seed=42):
    rng = np.random.default_rng(seed)

    # Base distributions
    base_amount = rng.normal(40000, 15000, size=n).clip(1000, 250000)
    provider_avg = base_amount + rng.normal(0, 5000, size=n)
    amount_over_expected_ratio = base_amount / np.maximum(1000, provider_avg)

    num_claims_patient = rng.poisson(1.5, size=n)
    num_claims_provider = rng.poisson(8, size=n)

    billing_total = rng.integers(1, 10, size=n)
    dist_codes = np.array([rng.integers(1, min(10, x + 1)) for x in billing_total])
    billing_var = dist_codes / np.maximum(1, billing_total)

    time_between = rng.integers(0, 90*24*3600, size=n)  # up to 90 days
    token_age = rng.integers(0, 7*24*3600, size=n)

    service_reuse = rng.binomial(1, 0.05, size=n)
    hash_reuse = rng.binomial(1, 0.03, size=n)

    provider_risk = rng.uniform(0, 1, size=n)
    semantic_diff = rng.uniform(0, 1, size=n)

    is_new_provider = (num_claims_provider < 3).astype(int)

    weekday_hour = rng.integers(0, 7*24, size=n)

    # Fraud label generation with multiple patterns
    y = np.zeros(n, dtype=int)

    # Pattern 1: inflated billing
    mask_inflated = (amount_over_expected_ratio > 1.5) | (base_amount > 100000)
    y[mask_inflated & (rng.random(n) < 0.6)] = 1

    # Pattern 2: duplicates / token reuse
    y[(service_reuse == 1) & (rng.random(n) < 0.7)] = 1

    # Pattern 3: provider-level fraud
    y[(provider_risk > 0.8) & (rng.random(n) < 0.4)] = 1

    # Pattern 4: temporal bursts
    y[(num_claims_patient > 5) & (rng.random(n) < 0.3)] = 1

    # Adjust overall rate toward fraud_rate
    current_rate = y.mean()
    if current_rate < fraud_rate:
        add_idx = rng.choice(np.where(y == 0)[0], size=int((fraud_rate - current_rate) * n), replace=False)
        y[add_idx] = 1
    elif current_rate > fraud_rate:
        rm_idx = rng.choice(np.where(y == 1)[0], size=int((current_rate - fraud_rate) * n), replace=False)
        y[rm_idx] = 0

    df = pd.DataFrame({
        "claim_amount": base_amount,
        "amount_over_expected_ratio": amount_over_expected_ratio,
        "num_claims_last_6mo_by_patient": num_claims_patient,
        "num_claims_last_6mo_by_provider": num_claims_provider,
        "avg_claim_amount_by_provider": provider_avg,
        "billing_code_variability_score": billing_var,
        "distinct_billing_codes_count": dist_codes,
        "time_between_service_and_claim": time_between,
        "token_age_seconds": token_age,
        "service_token_reuse_flag": service_reuse,
        "patient_hash_reuse_flag": hash_reuse,
        "provider_risk_score": provider_risk,
        "semantic_text_diff": semantic_diff,
        "is_new_provider_flag": is_new_provider,
        "claim_weekday_hour": weekday_hour,
        "label": y,
    })

    return df


def precision_recall_at_k(y_true, scores, k=0.1):
    n = len(y_true)
    m = max(1, int(n * k))
    idx = np.argsort(scores)[::-1][:m]
    selected = y_true[idx]
    precision = selected.mean() if m > 0 else 0
    recall = selected.sum() / max(1, y_true.sum())
    return precision, recall


def train(output_dir, n=5000, fraud_rate=0.15):
    os.makedirs(output_dir, exist_ok=True)

    df = simulate_claims(n=n, fraud_rate=fraud_rate)

    X = df[FEATURE_SPEC].values.astype(np.float32)
    y = df["label"].values.astype(np.int64)

    # Train/test split
    idx = np.arange(len(df))
    RNG.shuffle(idx)
    split = int(0.8 * len(df))
    train_idx, test_idx = idx[:split], idx[split:]
    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    # Supervised RF
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
    proba_test = rf.predict_proba(X_test)[:, 1]

    # Metrics
    roc = roc_auc_score(y_test, proba_test)
    y_pred = (proba_test >= 0.5).astype(int)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    cm = confusion_matrix(y_test, y_pred).tolist()
    p_at_10, r_at_10 = precision_recall_at_k(y_test, proba_test, k=0.1)

    print("RF ROC-AUC:", roc)
    print("RF P/R/F1:", prec, rec, f1)
    print("RF Confusion Matrix:", cm)
    print("Precision@10%:", p_at_10, "Recall@10%:", r_at_10)

    # SHAP importance
    shap_importance = None
    if SHAP_AVAILABLE:
        try:
            explainer = shap.TreeExplainer(rf)
            shap_values = explainer.shap_values(X_train)
            if isinstance(shap_values, list):  # for classifiers, shap_values per class
                shap_vals = shap_values[1]
            else:
                shap_vals = shap_values
            shap_importance = np.mean(np.abs(shap_vals), axis=0)
            shap_importance = (shap_importance / (shap_importance.sum() + 1e-8)).tolist()
        except Exception as e:
            print("Warning: SHAP failed:", e)
            shap_importance = [1.0 / len(FEATURE_SPEC)] * len(FEATURE_SPEC)
    else:
        shap_importance = [1.0 / len(FEATURE_SPEC)] * len(FEATURE_SPEC)

    # Unsupervised: IsolationForest on normal-ish training
    iforest = IsolationForest(n_estimators=200, contamination=0.1, random_state=42)
    iforest.fit(X_train[y_train == 0] if (y_train == 0).any() else X_train)
    # Higher scores = more normal in sklearn; convert to anomaly-z later in Node
    if_scores = iforest.score_samples(X_train)
    if_mean, if_std = float(np.mean(if_scores)), float(np.std(if_scores) + 1e-9)

    # Export models
    rf_path = os.path.join(output_dir, "rf.onnx")
    unsup_path = os.path.join(output_dir, "iforest.onnx")
    metadata_path = os.path.join(output_dir, "metadata.json")

    if SKL2ONNX_AVAILABLE:
        try:
            rf_onnx = convert_sklearn(rf, initial_types=[("input", FloatTensorType([None, X.shape[1]]))])
            with open(rf_path, "wb") as f:
                f.write(rf_onnx.SerializeToString())
            print("Saved:", rf_path)
        except Exception as e:
            print("Warning: RF ONNX export failed:", e)

        try:
            if_onnx = convert_sklearn(iforest, initial_types=[("input", FloatTensorType([None, X.shape[1]]))])
            with open(unsup_path, "wb") as f:
                f.write(if_onnx.SerializeToString())
            print("Saved:", unsup_path)
        except Exception as e:
            print("Warning: IF ONNX export failed:", e)
            unsup_path = None
    else:
        print("Warning: skl2onnx not installed; skipping ONNX export. pip install skl2onnx")
        unsup_path = None

    # Metadata
    meta = {
        "model_version": datetime.utcnow().strftime("v%Y%m%d%H%M%S"),
        "rf_model_path": os.path.basename(rf_path) if os.path.exists(rf_path) else None,
        "unsup_model_path": os.path.basename(unsup_path) if (unsup_path and os.path.exists(unsup_path)) else None,
        "unsupervised_type": "iforest",
        "feature_spec": FEATURE_SPEC,
        "feature_means": df[FEATURE_SPEC].mean().astype(float).tolist(),
        "feature_stds": (df[FEATURE_SPEC].std().replace(0, 1)).astype(float).tolist(),
        "shap_importance": shap_importance,
        "if_mean": if_mean,
        "if_std": if_std,
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print("Saved:", metadata_path)

    # Also store small sample dataset
    sample_path = os.path.join(output_dir, "sample_data.csv")
    df.head(100).to_csv(sample_path, index=False)
    print("Saved sample:", sample_path)

    # Metrics report
    report = {
        "rf": {
            "roc_auc": float(roc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1),
            "confusion_matrix": cm,
            "precision_at_10pct": float(p_at_10),
            "recall_at_10pct": float(r_at_10),
        }
    }
    with open(os.path.join(output_dir, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default=os.path.join(os.path.dirname(__file__), "..", "ml-scorer", "models"))
    parser.add_argument("--n", type=int, default=5000)
    parser.add_argument("--fraud-rate", type=float, default=0.15)
    args = parser.parse_args()

    out_dir = os.path.abspath(args.output_dir)
    os.makedirs(out_dir, exist_ok=True)
    train(out_dir, n=args.n, fraud_rate=args.fraud_rate)
