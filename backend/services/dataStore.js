const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * In-memory data store for demo purposes
 * In production, this would be replaced with a real database
 */

let users = [];
let providers = [];
let claims = [];

const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "data.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (_) {}
}

function loadData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(raw);
      users = Array.isArray(parsed.users) ? parsed.users : [];
      providers = Array.isArray(parsed.providers) ? parsed.providers : [];
      claims = Array.isArray(parsed.claims) ? parsed.claims : [];
    }
  } catch (e) {
    // Fallback to empty on any error
    users = users || [];
    providers = providers || [];
    claims = claims || [];
  }
}

function saveData() {
  try {
    ensureDataDir();
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ users, providers, claims }, null, 2),
      "utf8"
    );
  } catch (e) {
    // Best-effort persistence; ignore errors
  }
}

// Load on module import
loadData();

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
    dateOfBirth: userData.dateOfBirth || null,
    nationalId: userData.nationalId,
    nationalIdHash: hashString(userData.nationalId),
    walletAddress: userData.walletAddress,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user };
    saveData();
    return users[existingIndex];
  } else {
    users.push(user);
    saveData();
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
    gstin: providerData.gstin || null,
    walletAddress: providerData.walletAddress,
    approvalStatus: providerData.approvalStatus || "PENDING",
    inactivityStatus: providerData.inactivityStatus || "ACTIVE",
    approvedCount: providerData.approvedCount || 0,
    rejectedCount: providerData.rejectedCount || 0,
    lastClaimDate: providerData.lastClaimDate || null,
    createdAt: providerData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    providers[existingIndex] = { ...providers[existingIndex], ...provider };
    saveData();
    return providers[existingIndex];
  } else {
    providers.push(provider);
    saveData();
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
 * Update provider approval status
 */
function updateProviderStatus(walletAddress, approvalStatus) {
  const provider = getProviderByWallet(walletAddress);
  if (provider) {
    provider.approvalStatus = approvalStatus;
    provider.updatedAt = new Date().toISOString();
    saveData();
  }
  return provider;
}

/**
 * Delete provider by wallet
 */
function deleteProvider(walletAddress) {
  const index = providers.findIndex(
    (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
  if (index >= 0) {
    providers.splice(index, 1);
    saveData();
    return true;
  }
  return false;
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
    amountInr: claimData.amountInr || claimData.amount,
    claimType: claimData.claimType,
    description: claimData.description,
    attachments: claimData.attachments || [],
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
  saveData();
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
    saveData();
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
 * Auto-reject fraud claims after 1 hour of admin review timeout
 */
function autoRejectFraudClaims() {
  const ONE_HOUR_MS = 3600000;
  const now = Date.now();

  claims.forEach((claim) => {
    if (claim.status === "ADMIN_REVIEW_REQUIRED" && claim.fraudDetectedAt) {
      const timeSinceFraudDetection = now - claim.fraudDetectedAt;
      
      if (timeSinceFraudDetection >= ONE_HOUR_MS) {
        claim.status = "REJECTED_FRAUD";
        claim.rejectionReason = "Automatically rejected due to prolonged fraud verification timeout.";
        claim.rejectedAt = now;
      }
    }
  });
  saveData();
}

/**
 * Clear all data (for testing)
 */
function clearAllData() {
  users = [];
  providers = [];
  claims = [];
  saveData();
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
  deleteProvider,
  createClaim,
  getClaimById,
  getClaimsByPatient,
  getClaimsByProvider,
  updateClaim,
  getAllClaims,
  getClaimsStats,
  autoRejectFraudClaims,
  clearAllData,
  hashString,
};
