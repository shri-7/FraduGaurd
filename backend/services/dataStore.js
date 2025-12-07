const crypto = require("crypto");

/**
 * In-memory data store for demo purposes
 * In production, this would be replaced with a real database
 */

let users = [];
let providers = [];
let claims = [];

/**
 * Hash a string (for national ID)
 */
function hashString(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Create or update a user
 */
function upsertUser(userData) {
  const existingIndex = users.findIndex(
    (u) => u.walletAddress === userData.walletAddress
  );

  const user = {
    id: userData.id || crypto.randomUUID(),
    role: userData.role || "PATIENT",
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    nationalId: userData.nationalId,
    nationalIdHash: hashString(userData.nationalId),
    walletAddress: userData.walletAddress,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user };
    return users[existingIndex];
  } else {
    users.push(user);
    return user;
  }
}

/**
 * Get user by wallet address
 */
function getUserByWallet(walletAddress) {
  return users.find((u) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
}

/**
 * Get all users
 */
function getAllUsers() {
  return users;
}

/**
 * Get all patients
 */
function getAllPatients() {
  return users.filter((u) => u.role === "PATIENT");
}

/**
 * Create or update a provider
 */
function upsertProvider(providerData) {
  const existingIndex = providers.findIndex(
    (p) => p.walletAddress === providerData.walletAddress
  );

  const provider = {
    id: providerData.id || crypto.randomUUID(),
    name: providerData.name,
    contactEmail: providerData.contactEmail,
    walletAddress: providerData.walletAddress,
    status: providerData.status || "PENDING",
    createdAt: providerData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    providers[existingIndex] = { ...providers[existingIndex], ...provider };
    return providers[existingIndex];
  } else {
    providers.push(provider);
    return provider;
  }
}

/**
 * Get provider by wallet address
 */
function getProviderByWallet(walletAddress) {
  return providers.find(
    (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}

/**
 * Get all providers
 */
function getAllProviders() {
  return providers;
}

/**
 * Get providers by status
 */
function getProvidersByStatus(status) {
  return providers.filter((p) => p.status === status);
}

/**
 * Update provider status
 */
function updateProviderStatus(walletAddress, status) {
  const provider = getProviderByWallet(walletAddress);
  if (provider) {
    provider.status = status;
    provider.updatedAt = new Date().toISOString();
  }
  return provider;
}

/**
 * Create a claim
 */
function createClaim(claimData) {
  const claim = {
    id: claimData.id || crypto.randomUUID(),
    patientAddress: claimData.patientAddress,
    providerAddress: claimData.providerAddress,
    amount: claimData.amount,
    claimType: claimData.claimType,
    description: claimData.description,
    ipfsHashPayload: claimData.ipfsHashPayload,
    ipfsHashFraudReport: claimData.ipfsHashFraudReport || null,
    fraudScore: claimData.fraudScore || 0,
    fraudLevel: claimData.fraudLevel || "LOW",
    fraudFlags: claimData.fraudFlags || [],
    status: claimData.status || "PENDING",
    createdAt: claimData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  claims.push(claim);
  return claim;
}

/**
 * Get claim by ID
 */
function getClaimById(claimId) {
  return claims.find((c) => c.id === claimId);
}

/**
 * Get claims by patient address
 */
function getClaimsByPatient(patientAddress) {
  return claims.filter(
    (c) => c.patientAddress.toLowerCase() === patientAddress.toLowerCase()
  );
}

/**
 * Get claims by provider address
 */
function getClaimsByProvider(providerAddress) {
  return claims.filter(
    (c) => c.providerAddress.toLowerCase() === providerAddress.toLowerCase()
  );
}

/**
 * Update claim
 */
function updateClaim(claimId, updates) {
  const claim = getClaimById(claimId);
  if (claim) {
    Object.assign(claim, updates, { updatedAt: new Date().toISOString() });
  }
  return claim;
}

/**
 * Get all claims
 */
function getAllClaims() {
  return claims;
}

/**
 * Get claims statistics
 */
function getClaimsStats() {
  const total = claims.length;
  const flagged = claims.filter((c) => c.fraudFlags.length > 0).length;
  const approved = claims.filter((c) => c.status === "APPROVED").length;
  const rejected = claims.filter((c) => c.status === "REJECTED").length;
  const pending = claims.filter((c) => c.status === "PENDING").length;

  const highRisk = claims.filter((c) => c.fraudLevel === "HIGH").length;
  const mediumRisk = claims.filter((c) => c.fraudLevel === "MEDIUM").length;
  const lowRisk = claims.filter((c) => c.fraudLevel === "LOW").length;

  return {
    total,
    flagged,
    approved,
    rejected,
    pending,
    highRisk,
    mediumRisk,
    lowRisk,
  };
}

/**
 * Clear all data (for testing)
 */
function clearAllData() {
  users = [];
  providers = [];
  claims = [];
}

module.exports = {
  upsertUser,
  getUserByWallet,
  getAllUsers,
  getAllPatients,
  upsertProvider,
  getProviderByWallet,
  getAllProviders,
  getProvidersByStatus,
  updateProviderStatus,
  createClaim,
  getClaimById,
  getClaimsByPatient,
  getClaimsByProvider,
  updateClaim,
  getAllClaims,
  getClaimsStats,
  clearAllData,
  hashString,
};
