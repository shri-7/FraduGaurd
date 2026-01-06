const crypto = require("crypto");

function cosineSim(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1e-8;
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1e-8;
  return dot / (na * nb);
}

function charNGramVector(text, n = 3, vocabLimit = 512) {
  const vec = new Array(vocabLimit).fill(0);
  if (!text) return vec;
  const s = `__${String(text).toLowerCase()}__`;
  for (let i = 0; i <= s.length - n; i++) {
    const gram = s.slice(i, i + n);
    const h = crypto.createHash("md5").update(gram).digest();
    const idx = (h[0] ^ h[1] ^ h[2] ^ h[3]) % vocabLimit;
    vec[idx] += 1;
  }
  return vec;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function secondsBetween(a, b) {
  if (!a || !b) return 0;
  const ta = typeof a === "number" ? a : Math.floor(new Date(a).getTime() / 1000);
  const tb = typeof b === "number" ? b : Math.floor(new Date(b).getTime() / 1000);
  return Math.max(0, tb - ta);
}

function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr) {
  if (!arr || arr.length === 0) return 1;
  const m = mean(arr);
  const v = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(v) || 1;
}

function safeNum(x) {
  if (x === null || x === undefined || Number.isNaN(x)) return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function extractFeatures(claim, context = {}) {
  const {
    patientClaims = [],
    providerClaims = [],
    providerStats = {},
    patient = {},
  } = context;

  const amount = safeNum(claim.amountInr || claim.amount || 0);

  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const numClaimsByPatient = patientClaims.filter((c) => new Date(c.createdAt).getTime() > sixMonthsAgo).length;
  const numClaimsByProvider = providerClaims.filter((c) => new Date(c.createdAt).getTime() > sixMonthsAgo).length;

  const providerAmounts = providerClaims.map((c) => safeNum(c.amountInr || c.amount || 0));
  const avgByProvider = providerAmounts.length > 0 ? mean(providerAmounts) : 40000;
  const amountOverExpectedRatio = avgByProvider > 0 ? amount / avgByProvider : 1;

  const billingCodes = Array.isArray(claim.billingCodes) ? claim.billingCodes.map(String) : [];
  const distinctBillingCodesCount = new Set(billingCodes).size;
  const billing_code_variability_score = billingCodes.length > 1 ? (distinctBillingCodesCount / billingCodes.length) : 0;

  const serviceDate = claim.serviceDate || claim.service_date || claim.serviceAt;
  const time_between_service_and_claim = serviceDate ? secondsBetween(serviceDate, Date.now()) : 0;

  const tokenIssuedAt = claim.serviceTokenIssuedAt || claim.tokenIssuedAt;
  const token_age_seconds = tokenIssuedAt ? secondsBetween(tokenIssuedAt, Date.now()) : 0;

  const serviceTokenId = claim.serviceTokenId || claim.service_token_id;
  let service_token_reuse_flag = 0;
  if (serviceTokenId) {
    const reused = patientClaims.concat(providerClaims).some((c) => {
      return c.serviceTokenId && String(c.serviceTokenId) === String(serviceTokenId);
    });
    service_token_reuse_flag = reused ? 1 : 0;
  }

  const patientCredentialHash = patient.nationalIdHash || patient.patientHash || null;
  let patient_hash_reuse_flag = 0;
  if (patientCredentialHash) {
    const repeats = patientClaims.filter((c) => c.patientCredentialHash === patientCredentialHash);
    patient_hash_reuse_flag = repeats.length > 0 ? 1 : 0;
  }

  const providerApproved = providerStats.approvalRate ?? (providerClaims.length > 0 ? providerClaims.filter((c) => c.status === "APPROVED").length / providerClaims.length : 1);
  const providerFlagged = providerStats.flaggedCount ?? providerClaims.filter((c) => (c.fraudFlags || []).length > 0).length;
  const provider_risk_score = 1 - providerApproved + Math.min(1, providerFlagged / Math.max(1, providerClaims.length));

  const prevTexts = patientClaims.map((c) => c.description || "").filter(Boolean);
  const currentText = String(claim.description || claim.claimedDiagnosis || "");
  const curVec = charNGramVector(currentText);
  const sims = prevTexts.map((t) => cosineSim(curVec, charNGramVector(t)));
  const semantic_text_sim_to_history = sims.length > 0 ? mean(sims) : 0.0;
  const semantic_text_diff = 1 - Math.max(0, Math.min(1, semantic_text_sim_to_history));

  const is_new_provider_flag = providerClaims.length < 3 ? 1 : 0;

  const createdAt = claim.createdAt ? new Date(claim.createdAt) : new Date();
  const weekday = createdAt.getUTCDay();
  const hour = createdAt.getUTCHours();
  const claim_weekday_hour = weekday * 24 + hour;

  const features = {
    claim_amount: amount,
    amount_over_expected_ratio: amountOverExpectedRatio,
    num_claims_last_6mo_by_patient: numClaimsByPatient,
    num_claims_last_6mo_by_provider: numClaimsByProvider,
    avg_claim_amount_by_provider: avgByProvider,
    billing_code_variability_score,
    distinct_billing_codes_count: distinctBillingCodesCount,
    time_between_service_and_claim,
    token_age_seconds,
    service_token_reuse_flag,
    patient_hash_reuse_flag,
    provider_risk_score,
    semantic_text_diff,
    is_new_provider_flag,
    claim_weekday_hour,
  };

  return features;
}

function orderFeatures(featureSpec, features) {
  return featureSpec.map((k) => safeNum(features[k]));
}

module.exports = {
  extractFeatures,
  orderFeatures,
};
