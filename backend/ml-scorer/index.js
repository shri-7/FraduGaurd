const express = require("express");
let ort; // lazy require onnxruntime-node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { extractFeatures, orderFeatures } = require("./feature-extractor");
const dataStore = require("../services/dataStore");

const MODELS_DIR = path.join(__dirname, "models");
const META_PATH = path.join(MODELS_DIR, "metadata.json");
const POLICY_PATH = path.join(__dirname, "policy.json");

let rfSession = null;
let aeSession = null;
let meta = null;
let policy = {
  thresholds: {
    auto_approve_max: 0.3,
    manual_review_max: 0.6
  },
  combine: {
    rf_weight: 0.6,
    ae_weight: 0.4
  }
};

function safeReadJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (_) {}
  return fallback;
}

async function init() {
  meta = safeReadJSON(META_PATH, {
    model_version: "v0",
    rf_input_name: "input",
    ae_input_name: "input",
    ae_output_name: "recon",
    unsupervised_type: "iforest",
    if_mean: 0.0,
    if_std: 1.0,
    feature_spec: [
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
      "claim_weekday_hour"
    ],
    feature_means: [],
    feature_stds: [],
    shap_importance: []
  });

  policy = safeReadJSON(POLICY_PATH, policy);

  try {
    ort = require("onnxruntime-node");
  } catch (_) {
    ort = null;
  }

  if (ort) {
    const rfPath = (meta && meta.rf_model_path)
      ? path.isAbsolute(meta.rf_model_path) ? meta.rf_model_path : path.join(MODELS_DIR, meta.rf_model_path)
      : path.join(MODELS_DIR, "rf.onnx");
    if (fs.existsSync(rfPath)) {
      rfSession = await ort.InferenceSession.create(rfPath);
    }

    const unsupPath = (meta && meta.unsup_model_path)
      ? (path.isAbsolute(meta.unsup_model_path) ? meta.unsup_model_path : path.join(MODELS_DIR, meta.unsup_model_path))
      : path.join(MODELS_DIR, "ae.onnx");
    if (fs.existsSync(unsupPath)) {
      aeSession = await ort.InferenceSession.create(unsupPath);
    }
  }
}

function zscore(value, mean, std) {
  const m = Number.isFinite(mean) ? mean : 0;
  const s = (Number.isFinite(std) && std > 1e-12) ? std : 1;
  return (value - m) / s;
}

function explain(features) {
  const spec = meta.feature_spec;
  const means = Array.isArray(meta.feature_means) && meta.feature_means.length === spec.length
    ? meta.feature_means
    : new Array(spec.length).fill(0);
  const stds = Array.isArray(meta.feature_stds) && meta.feature_stds.length === spec.length
    ? meta.feature_stds
    : new Array(spec.length).fill(1);
  let shapImp = Array.isArray(meta.shap_importance) && meta.shap_importance.length === spec.length
    ? meta.shap_importance
    : null;
  if (!shapImp) {
    shapImp = new Array(spec.length).fill(1 / Math.max(1, spec.length));
  }
  const contribs = spec.map((k, i) => ({
    feature: k,
    contribution: shapImp[i] * zscore(Number.isFinite(features[i]) ? features[i] : 0, means[i], stds[i])
  }));
  contribs.sort((a,b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return contribs.slice(0,3);
}

async function scoreFeatures(featVector) {
  let rfProb = null;
  let aeAnom = null;

  if (rfSession && ort) {
    const input = new ort.Tensor("float32", Float32Array.from(featVector), [1, featVector.length]);
    const out = await rfSession.run({ [meta.rf_input_name || "input"]: input });
    const probTensor = out[Object.keys(out).find(k => k.includes("prob") || k.includes("output") || k.includes("probabilities"))];
    if (probTensor && probTensor.data) {
      const arr = Array.from(probTensor.data);
      rfProb = arr.length === 2 ? arr[1] : arr[0];
      if (!Number.isFinite(rfProb)) rfProb = null;
    }
  }

  if (aeSession && ort) {
    const input = new ort.Tensor("float32", Float32Array.from(featVector), [1, featVector.length]);
    const out = await aeSession.run({ [meta.ae_input_name || "input"]: input });
    if ((meta.unsupervised_type || "iforest") === "autoencoder") {
      const recon = out[meta.ae_output_name] || out[Object.keys(out)[0]];
      if (recon && recon.data) {
        const r = Array.from(recon.data);
        let err = 0;
        for (let i=0;i<featVector.length;i++) {
          const d = (featVector[i] - (r[i] || 0));
          err += d*d;
        }
        err = Math.sqrt(err / featVector.length);
        const base = meta.ae_recon_mean || 0.0;
        const sd = meta.ae_recon_std || 1.0;
        const z = zscore(err, base, sd);
        aeAnom = 1 / (1 + Math.exp(-z));
      }
    } else { // IsolationForest style: first output is score_samples-like (higher is more normal)
      const anyOut = out[Object.keys(out)[0]];
      if (anyOut && anyOut.data && anyOut.data.length > 0) {
        const s = anyOut.data[0];
        const z = zscore(s, meta.if_mean || 0, meta.if_std || 1);
        aeAnom = 1 / (1 + Math.exp(z)); // invert: lower-than-mean => higher anomaly
      }
    }
  }

  let combined = null;
  if (rfProb !== null && aeAnom !== null) {
    combined = policy.combine.rf_weight * rfProb + policy.combine.ae_weight * aeAnom;
  } else if (rfProb !== null) {
    combined = rfProb;
  } else if (aeAnom !== null) {
    combined = aeAnom;
  }

  return { rfProb, aeAnom, combined };
}

async function scoreClaim(claim, context = {}) {
  const patientClaims = context.patientClaims || dataStore.getClaimsByPatient(claim.patientWallet || claim.patientAddress || "");
  const providerClaims = context.providerClaims || dataStore.getClaimsByProvider(claim.providerWallet || claim.providerAddress || "");
  const providerStats = context.providerStats || {
    approvalRate: providerClaims.length ? providerClaims.filter(c => c.status === "APPROVED").length / providerClaims.length : 1,
    flaggedCount: providerClaims.filter(c => (c.fraudFlags||[]).length>0).length,
  };

  const featuresObj = extractFeatures(claim, { patientClaims, providerClaims, providerStats, patient: context.patient || {} });
  const featVector = orderFeatures(meta.feature_spec, featuresObj);

  let score01 = null;
  let details = { top_features: explain(featVector), model_version: meta.model_version };
  if (rfSession || aeSession) {
    try {
      const { rfProb, aeAnom, combined } = await scoreFeatures(featVector);
      score01 = combined;
      details = { rfProb, aeAnom, combined, top_features: explain(featVector), model_version: meta.model_version };
    } catch (e) {
      // Degrade gracefully when inference fails
      score01 = null;
      details = { error: e.message, top_features: explain(featVector), model_version: meta.model_version };
    }
  }

  return { features: featuresObj, featureVector: featVector, score01, details };
}

const router = express.Router();
router.post("/score-claim", async (req, res) => {
  try {
    const claim = req.body || {};
    const result = await scoreClaim(claim, {});
    const s = result.score01;
    let decision = "manual_review";
    if (s !== null) {
      if (s <= policy.thresholds.auto_approve_max) decision = "auto_approve";
      else if (s <= policy.thresholds.manual_review_max) decision = "manual_review";
      else decision = "auto_flag";
    } else {
      decision = "fallback_rule_based";
    }

    res.json({
      ok: true,
      score: s,
      explanation: result.details.top_features,
      features: result.features,
      decision,
      model_version: result.details.model_version || meta.model_version,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = {
  init,
  router,
  scoreClaim,
  policy: () => policy,
  meta: () => meta,
};
