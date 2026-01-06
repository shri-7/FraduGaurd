# ML Fraud Scoring Integration

This document summarizes the ML module added to the Node backend and how it integrates with the existing blockchain + Pinata/IPFS flow, without changing any blockchain, Ganache, or Pinata concepts.

## Components

- Backend Node/Express: `backend/`
- ML scoring service: `backend/ml-scorer/`
  - `index.js`: loads ONNX models with onnxruntime-node, exposes internal `/internal/ml/score-claim` endpoint.
  - `feature-extractor.js`: deterministic mapping Claim JSON → feature vector.
  - `policy.json`: threshold config for decisioning.
  - `models/metadata.json`, `rf.onnx`, `iforest.onnx` or `ae.onnx`: produced by training script.
- Training pipeline (Python): `backend/ml/train_fraud.py`
  - Trains RandomForest (supervised) and IsolationForest (unsupervised).
  - Exports to ONNX + `metadata.json` with feature spec, statistics, and SHAP importances.

## Feature List

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

No PHI is sent to the model. Only hashed IDs or derived stats are used.

## Model and Scoring

- Supervised: RandomForestClassifier (class_weight=balanced)
- Unsupervised: IsolationForest (or Autoencoder alternative)
- Combined fraud score: `fraud_score = 0.6 * RF_prob + 0.4 * IF_anomaly`
- Threshold policy (editable in `backend/ml-scorer/policy.json`):
  - score ≤ 0.30 → auto-approve
  - 0.30 < score ≤ 0.60 → manual review
  - score > 0.60 → auto-flag

Explainability: Top-3 contributing features are computed at runtime using SHAP-like importances from training metadata combined with feature z-scores.

## Runtime Flow (unchanged blockchain + Pinata concepts)

1. Patient submits claim to backend `/api/claim`.
2. Backend uploads non-PII claim payload to IPFS via Pinata (JWT if configured).
3. Backend computes features and requests ML score (internal call, no external service required).
4. Backend builds a fraud report with score (0–100), level (LOW/MEDIUM/HIGH), and top feature explanations. The raw feature vector is not stored to avoid leakage.
5. Fraud report is uploaded to IPFS via Pinata. Only the IPFS hash is used on-chain.
6. Backend calls the existing Solidity function to set fraud result and IPFS hash:

   Solidity (already present):
   - `setFraudResultForClaim(uint256 claimId, uint8 fraudScore, FraudLevel fraudLevel, bool flagged, string ipfsHashFraudReport)`

   Mapping (Node):
   - HIGH: score ≥ 61
   - MEDIUM: 31–60
   - LOW: 0–30

7. Claim is routed: HIGH → admin review, else → provider queue.

## API

- Internal scoring endpoint (for diagnostics):
  - POST `/internal/ml/score-claim`
  - Body: minimal claim JSON (amountInr, claimType, description, timestamps, billing codes, etc.)
  - Response: `{ ok, score: 0..1 | null, explanation: [{feature, contribution}], decision }`

- Primary integration is in `/api/claim` route; results are embedded in response and IPFS hashes are returned.

## Training and Artifacts

- Install Python deps (one-time):
  - `pip install scikit-learn skl2onnx shap numpy pandas`
- Train and export ONNX + metadata:
  - From `backend/`: `npm run train:fraud`
  - Outputs to `backend/ml-scorer/models/`:
    - `rf.onnx` (RandomForest)
    - `iforest.onnx` (IsolationForest)
    - `metadata.json` (feature spec, stats, SHAP importances, calibration)
    - `metrics.json`, `sample_data.csv`

Runtime does not require Python.

## Dev: Persisting Chain State

- Recommended: Run Ganache with a persistent database directory (Windows examples):
  - `npx ganache --chain.chainId 1337 --wallet.deterministic --database .ganache-db`
  - Or with a specific seed: `npx ganache --wallet.seed sample-seed --database .ganache-db`
- Hardhat node is ephemeral by design; for persistence, point the app to the Ganache network using `GANACHE_RPC_URL` in `.env` and deploy there (`npm run deploy`).

## Pinata/IPFS Persistence

- Set `PINATA_JWT` in `.env` to enable real uploads; otherwise a mock hash is returned.
- Use Pinata pinning and pin policy to keep fraud reports and claim payloads available. Only IPFS hashes are written on-chain.

## Docker Compose (optional, production-like testing)

Example `docker-compose.yml` (adjust ports and env secrets):

```
version: "3.8"
services:
  ganache:
    image: trufflesuite/ganache:latest
    command: ["--chain.chainId","1337","--wallet.deterministic","--database","/data"]
    ports: ["8545:8545"]
    volumes:
      - ./ganache-data:/data

  backend:
    build: ./backend
    environment:
      - GANACHE_RPC_URL=http://ganache:8545
      - DEPLOYER_PRIVATE_KEY=${DEPLOYER_PRIVATE_KEY}
      - PINATA_JWT=${PINATA_JWT}
      - PINATA_GATEWAY_BASE=https://gateway.pinata.cloud/ipfs
    ports: ["4000:4000"]
    depends_on: [ganache]
```

## Operational Notes

- Concept drift: retrain periodically (e.g., weekly/monthly). Use recent clean labels; track metrics (`metrics.json`). Update `models/` atomically.
- Label noise: prefer robust metrics (PR@k), use class_weight=balanced, and consider downweighting ambiguous labels.
- Imbalanced classes: keep fraud_rate realistic in simulation; in real data, monitor precision at high scores for review capacity.
- Fallback safety: If ML model not available or errors occur, backend falls back to rule-based `fraudEngine` and still uploads a report + routes to manual review as needed.
- Privacy: No identifiers on-chain; only hashed tokens and IPFS references. Avoid logging claim content.

## Scripts

- Backend start: `npm run dev:backend` (from repo root) or `cd backend && npm start`
- Train models: `cd backend && npm run train:fraud`
- Tests: `cd backend && npm test` (runs Hardhat tests and ML scorer tests)
