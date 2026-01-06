# Project Data Flow and ML Design

## Level-1 Data Flow Diagram (DFD)

- Actors
  - Patient (web UI)
  - Insurance Provider (web UI)
  - System Admin (web UI)
  - Backend (Node/Express)
  - Blockchain (InsuranceFraudSystem.sol)
  - IPFS/Pinata (off-chain storage)
  - ML Scorer (onnxruntime-node)

- Flow
  1. Patient submits Claim JSON via frontend → Backend `/api/claim`.
  2. Backend stores non-PII Claim Payload to IPFS (Pinata) → returns IPFS hash.
  3. Backend extracts features → calls ML Scorer (local, in-process) → returns score (0–1) and top features.
  4. Backend composes Fraud Report (no PHI) → uploads to IPFS → returns IPFS hash.
  5. Backend calls contract: `createClaim(...)` then `setFraudResultForClaim(claimId, score0_100, level, flagged, ipfsFraudHash)`.
  6. Frontend fetches claims by role.
     - Patient: only their own claims (server-enforced via requester wallet).
     - Provider: only legitimate claims (fraud → admin review only).

## ML Algorithm (engineering context)

- Feature Vector (15 dims)
  - claim_amount
  - amount_over_expected_ratio
  - num_claims_last_6mo_by_patient
  - num_claims_last_6mo_by_provider
  - avg_claim_amount_by_provider
  - billing_code_variability_score
  - distinct_billing_codes_count
  - time_between_service_and_claim
  - token_age_seconds
  - service_token_reuse_flag
  - patient_hash_reuse_flag
  - provider_risk_score
  - semantic_text_diff
  - is_new_provider_flag
  - claim_weekday_hour

- Models
  - Supervised: RandomForestClassifier (class_weight=balanced)
  - Unsupervised: IsolationForest (or Autoencoder). IsolationForest exported to ONNX.

- Score Fusion
  - fraud_score = 0.6 * RF_prob + 0.4 * Unsupervised_Anomaly
  - Thresholds (policy.json):
    - ≤0.30: auto-approve
    - 0.30–0.60: manual review
    - >0.60: auto-flag

- Explainability
  - Training computes SHAP importances (TreeExplainer) for RF.
  - Runtime uses SHAP importances × z-scored feature values to derive top-3 contributors.

## ML Data Flow Diagram

1. Input: Canonical Claim JSON (no PHI)
2. Feature extraction (deterministic mapper)
3. Vector normalization (z-score using metadata means/stds)
4. Inference
   - RF ONNX → probability of fraud (if model present)
   - IsolationForest ONNX → anomaly score (calibrated to 0–1)
5. Fusion → fraud_score ∈ [0,1]
6. Decision policy → action bucket
7. Report assembly (score, level, explanation, rule-based backup, score hash)
8. Pinata/IPFS upload → IPFS hash persisted on-chain

## Persistence Strategy

- Current: JSON file persistence at `backend/data/data.json` to keep user/provider/claims between restarts.
- Production: replace with DB (Postgres/Mongo). Requirements:
  - Connection string (env)
  - Schema: users, providers, claims, and derived stats (indexes on walletAddress, claim status)
  - Migrations and seed scripts
  - Robust transactions for claim lifecycle and provider approvals

## Privacy and Access Control

- Patient can only access their own claims (server enforces via requester wallet filter).
- Provider sees only legitimate claims for action; fraud-flagged claims go to admin review.
- No PHI on-chain; only hashes and scores. Logs avoid sensitive data.
