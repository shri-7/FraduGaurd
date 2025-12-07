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
      score = 100;
      flags.push("DUPLICATE_NATIONAL_ID");
      reasons.push(
        `Exact match found with patient: ${existing.name} (${existing.email})`
      );
      return { score, flags, reasons };
    }

    if (existing.email && existing.email === newPatient.email) {
      score = Math.max(score, 85);
      flags.push("DUPLICATE_EMAIL");
      reasons.push(`Email already registered: ${existing.email}`);
    }

    if (existing.phone && existing.phone === newPatient.phone) {
      score = Math.max(score, 80);
      flags.push("DUPLICATE_PHONE");
      reasons.push(`Phone already registered: ${existing.phone}`);
    }

    // Name similarity check
    if (existing.name && newPatient.name) {
      const similarity = levenshteinSimilarity(existing.name, newPatient.name);
      if (similarity > 0.85) {
        score = Math.max(score, 70);
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
 * Score claim risk based on various factors
 * @param {Object} claim - Claim data
 * @param {Object} patient - Patient data
 * @param {Array} patientHistory - Array of patient's previous claims
 * @returns {Object} - { score: 0-100, level: "LOW"|"MEDIUM"|"HIGH", flags: [], reasons: [] }
 */
function scoreClaimRisk(claim, patient = {}, patientHistory = []) {
  let score = 0;
  const flags = [];
  const reasons = [];

  // Rule 1: High amount check
  if (claim.amount > THRESHOLDS.HIGH_AMOUNT_THRESHOLD) {
    const excessAmount = claim.amount - THRESHOLDS.HIGH_AMOUNT_THRESHOLD;
    const percentageOver = (excessAmount / THRESHOLDS.HIGH_AMOUNT_THRESHOLD) * 100;
    const amountScore = Math.min(40, percentageOver / 2.5);
    score += amountScore;
    flags.push("HIGH_AMOUNT");
    reasons.push(
      `Claim amount (${claim.amount}) exceeds threshold (${THRESHOLDS.HIGH_AMOUNT_THRESHOLD})`
    );
  }

  // Rule 2: Frequent claims check
  if (patientHistory && patientHistory.length > 0) {
    const thirtyDaysAgo = Date.now() - THRESHOLDS.FREQUENT_CLAIMS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const recentClaims = patientHistory.filter((c) => {
      const claimDate = new Date(c.createdAt).getTime();
      return claimDate > thirtyDaysAgo;
    });

    if (recentClaims.length >= THRESHOLDS.FREQUENT_CLAIMS_THRESHOLD) {
      score += 30;
      flags.push("FREQUENT_CLAIMS");
      reasons.push(
        `${recentClaims.length} claims in last ${THRESHOLDS.FREQUENT_CLAIMS_WINDOW_DAYS} days`
      );
    }
  }

  // Rule 3: Early claim check (policy age)
  if (patient.registeredAt) {
    const policyAgeMs = Date.now() - new Date(patient.registeredAt).getTime();
    const policyAgeDays = policyAgeMs / (24 * 60 * 60 * 1000);

    if (policyAgeDays < THRESHOLDS.MIN_POLICY_AGE_DAYS) {
      score += 25;
      flags.push("EARLY_CLAIM");
      reasons.push(
        `Policy age (${policyAgeDays.toFixed(1)} days) is less than minimum (${THRESHOLDS.MIN_POLICY_AGE_DAYS} days)`
      );
    }
  }

  // Determine fraud level
  let fraudLevel = "LOW";
  if (score >= 70) {
    fraudLevel = "HIGH";
  } else if (score >= 40) {
    fraudLevel = "MEDIUM";
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return { score, level: fraudLevel, flags, reasons };
}

/**
 * Evaluate complete claim for fraud
 * @param {Object} claim - Claim data
 * @param {Object} patient - Patient data
 * @param {Object} history - { existingPatients: [], patientClaims: [] }
 * @returns {Object} - { fraudScore, fraudLevel, fraudFlags, reasons }
 */
function evaluateClaim(claim, patient = {}, history = {}) {
  const existingPatients = history.existingPatients || [];
  const patientClaims = history.patientClaims || [];

  // Check identity fraud
  const identityResult = checkIdentityFraud(patient, existingPatients);

  // If identity fraud is detected, return high score immediately
  if (identityResult.score >= 85) {
    return {
      fraudScore: identityResult.score,
      fraudLevel: "HIGH",
      fraudFlags: identityResult.flags,
      reasons: identityResult.reasons,
    };
  }

  // Score claim risk
  const claimRiskResult = scoreClaimRisk(claim, patient, patientClaims);

  // Combine scores
  let combinedScore = 0;
  const combinedFlags = [...identityResult.flags, ...claimRiskResult.flags];
  const combinedReasons = [...identityResult.reasons, ...claimRiskResult.reasons];

  if (identityResult.score > 0) {
    combinedScore +=
      (identityResult.score * THRESHOLDS.IDENTITY_FRAUD_SCORE_WEIGHT) / 100;
  }

  combinedScore +=
    (claimRiskResult.score * THRESHOLDS.CLAIM_RISK_SCORE_WEIGHT) / 100;
  combinedScore = Math.min(combinedScore, 100);

  // Determine final fraud level
  let fraudLevel = "LOW";
  if (combinedScore >= 70) {
    fraudLevel = "HIGH";
  } else if (combinedScore >= 40) {
    fraudLevel = "MEDIUM";
  }

  return {
    fraudScore: Math.round(combinedScore),
    fraudLevel,
    fraudFlags: [...new Set(combinedFlags)], // Remove duplicates
    reasons: combinedReasons,
  };
}

module.exports = {
  checkIdentityFraud,
  scoreClaimRisk,
  evaluateClaim,
  THRESHOLDS,
};
