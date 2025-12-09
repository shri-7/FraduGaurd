/**
 * Fraud Detection Engine
 * Implements rule-based fraud detection algorithms
 */

const THRESHOLDS = {
  HIGH_AMOUNT_THRESHOLD: 100000, // in smallest unit (wei equivalent)
  MIN_POLICY_AGE_DAYS: 30,
  FREQUENT_CLAIMS_THRESHOLD: 5,
  FREQUENT_CLAIMS_WINDOW_DAYS: 30,
  IDENTITY_FRAUD_SCORE_WEIGHT: 40,
  CLAIM_RISK_SCORE_WEIGHT: 60,
};

/**
 * Simple Levenshtein distance for string similarity
 * Returns a similarity score between 0 and 1
 */
function levenshteinSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Check for identity fraud by comparing with existing patients
 * @param {Object} newPatient - New patient data
 * @param {Array} existingPatients - Array of existing patient records
 * @returns {Object} - { score: 0-100, flags: [], reasons: [] }
 */
function checkIdentityFraud(newPatient, existingPatients = []) {
  let score = 0;
  const flags = [];
  const reasons = [];

  if (!existingPatients || existingPatients.length === 0) {
    return { score: 0, flags: [], reasons: ["No existing patients to compare"] };
  }

  for (const existing of existingPatients) {
    // Exact match checks
    if (
      existing.nationalId &&
      existing.nationalId === newPatient.nationalId
    ) {
      score = 50; // Reduced from 100
      flags.push("DUPLICATE_NATIONAL_ID");
      reasons.push(
        `Exact match found with patient: ${existing.name} (${existing.email})`
      );
      return { score, flags, reasons };
    }

    if (existing.email && existing.email === newPatient.email) {
      score = Math.max(score, 42); // Reduced from 85
      flags.push("DUPLICATE_EMAIL");
      reasons.push(`Email already registered: ${existing.email}`);
    }

    if (existing.phone && existing.phone === newPatient.phone) {
      score = Math.max(score, 40); // Reduced from 80
      flags.push("DUPLICATE_PHONE");
      reasons.push(`Phone already registered: ${existing.phone}`);
    }

    // Name similarity check
    if (existing.name && newPatient.name) {
      const similarity = levenshteinSimilarity(existing.name, newPatient.name);
      if (similarity > 0.85) {
        score = Math.max(score, 35); // Reduced from 70
        flags.push("SIMILAR_NAME");
        reasons.push(
          `Similar name found: ${existing.name} (similarity: ${(similarity * 100).toFixed(1)}%)`
        );
      }
    }
  }

  return { score, flags, reasons };
}

/**
 * NEW SIMPLIFIED FRAUD SCORING ALGORITHM (INR-based)
 * Score range: 0-100
 * 0-30: LOW RISK
 * 31-60: MEDIUM RISK
 * 61-100: HIGH RISK (Fraud)
 */
function scoreClaimRisk(claim, patient = {}, patientHistory = [], providerData = {}) {
  let score = 0;
  const flags = [];
  const reasons = [];

  // Rule 1: Amount in INR
  const amountInr = claim.amountInr || claim.amount || 0;
  if (amountInr > 100000) {
    score += 25; // Reduced from 50
    flags.push("HIGH_AMOUNT_100K");
    reasons.push(`Amount ₹${amountInr} exceeds ₹100,000`);
  } else if (amountInr > 50000) {
    score += 15; // Reduced from 30
    flags.push("HIGH_AMOUNT_50K");
    reasons.push(`Amount ₹${amountInr} exceeds ₹50,000`);
  }

  // Rule 2: Claim Type
  if (claim.claimType === "SURGERY") {
    score += 10; // Reduced from 20
    flags.push("SURGERY_CLAIM");
    reasons.push("Surgery claims have higher fraud risk");
  } else if (claim.claimType === "HOSPITALIZATION" || claim.claimType === "ACCIDENT") {
    score += 5; // Reduced from 10
    flags.push("HIGH_RISK_CLAIM_TYPE");
    reasons.push(`${claim.claimType} claims require verification`);
  }

  // Rule 3: Missing or invalid attachments
  const attachments = claim.attachments || [];
  if (!attachments || attachments.length === 0) {
    score += 10; // Reduced from 20
    flags.push("NO_ATTACHMENTS");
    reasons.push("No supporting documents uploaded");
  } else {
    // Check for valid file types
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    const invalidAttachments = attachments.filter(
      (a) => !validTypes.includes(a.mimeType)
    );
    if (invalidAttachments.length > 0) {
      score += 15; // Reduced from 30
      flags.push("INVALID_ATTACHMENT_TYPE");
      reasons.push("Invalid document type uploaded");
    }
  }

  // Rule 4: Frequent claims (>3 in 6 months)
  if (patientHistory && patientHistory.length > 0) {
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const recentClaims = patientHistory.filter((c) => {
      const claimDate = new Date(c.createdAt).getTime();
      return claimDate > sixMonthsAgo;
    });

    if (recentClaims.length > 3) {
      score += 10; // Reduced from 20
      flags.push("FREQUENT_CLAIMS");
      reasons.push(`${recentClaims.length} claims in last 6 months`);
    }
  }

  // Rule 5: Provider patterns
  if (providerData && providerData.approvalRate !== undefined) {
    if (providerData.approvalRate < 0.4) {
      score += 5; // Reduced from 10
      flags.push("LOW_PROVIDER_APPROVAL_RATE");
      reasons.push(`Provider approval rate: ${(providerData.approvalRate * 100).toFixed(1)}%`);
    }
  }

  if (providerData && providerData.flaggedClaims > 0) {
    score += 15; // Reduced from 30
    flags.push("PROVIDER_FLAGGED_HISTORY");
    reasons.push("Provider has history of flagged claims");
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine fraud level based on new thresholds
  let fraudLevel = "LOW";
  if (score >= 61) {
    fraudLevel = "HIGH";
  } else if (score >= 31) {
    fraudLevel = "MEDIUM";
  }

  return { score, level: fraudLevel, flags, reasons };
}

/**
 * Evaluate complete claim for fraud (SIMPLIFIED - uses only claim risk scoring)
 * @param {Object} claim - Claim data
 * @param {Object} patient - Patient data
 * @param {Object} history - { existingPatients: [], patientClaims: [], providerData: {} }
 * @returns {Object} - { fraudScore, fraudLevel, fraudFlags, reasons }
 */
function evaluateClaim(claim, patient = {}, history = {}) {
  const patientClaims = history.patientClaims || [];
  const providerData = history.providerData || {};

  // Use simplified claim risk scoring
  const claimRiskResult = scoreClaimRisk(claim, patient, patientClaims, providerData);

  return {
    fraudScore: claimRiskResult.score,
    fraudLevel: claimRiskResult.level,
    fraudFlags: claimRiskResult.flags,
    reasons: claimRiskResult.reasons,
  };
}

module.exports = {
  checkIdentityFraud,
  scoreClaimRisk,
  evaluateClaim,
  THRESHOLDS,
};
