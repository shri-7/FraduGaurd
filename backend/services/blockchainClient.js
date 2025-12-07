const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let provider;
let signer;
let contract;
let contractAddress;
let contractABI;

/**
 * Initialize blockchain client
 */
async function initializeBlockchain() {
  try {
    const rpcUrl = process.env.GANACHE_RPC_URL || "http://127.0.0.1:8545";
    const privateKey =
      process.env.DEPLOYER_PRIVATE_KEY ||
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    provider = new ethers.JsonRpcProvider(rpcUrl);
    signer = new ethers.Wallet(privateKey, provider);

    // Load contract address and ABI
    const deploymentPath = path.join(__dirname, "../deployment.json");

    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
      contractAddress = deployment.contractAddress;
      contractABI = deployment.abi;

      contract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log("Blockchain client initialized with contract:", contractAddress);
    } else {
      console.warn("deployment.json not found. Contract not initialized.");
    }
  } catch (error) {
    console.error("Error initializing blockchain client:", error.message);
    throw error;
  }
}

/**
 * Register a patient on-chain
 */
async function registerPatient(patientAddress, nationalIdHash) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.registerPatient(patientAddress, nationalIdHash);
    const receipt = await tx.wait();
    console.log("Patient registered:", patientAddress, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error registering patient:", error.message);
    throw error;
  }
}

/**
 * Register a provider on-chain
 */
async function registerProvider(providerAddress, name) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.registerProvider(providerAddress, name);
    const receipt = await tx.wait();
    console.log("Provider registered:", providerAddress, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error registering provider:", error.message);
    throw error;
  }
}

/**
 * Approve a provider on-chain
 */
async function approveProvider(providerAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.approveProvider(providerAddress);
    const receipt = await tx.wait();
    console.log("Provider approved:", providerAddress, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error approving provider:", error.message);
    throw error;
  }
}

/**
 * Reject a provider on-chain
 */
async function rejectProvider(providerAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.rejectProvider(providerAddress);
    const receipt = await tx.wait();
    console.log("Provider rejected:", providerAddress, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error rejecting provider:", error.message);
    throw error;
  }
}

/**
 * Create a claim on-chain
 */
async function createClaim(
  patientAddress,
  providerAddress,
  amount,
  claimType,
  ipfsHashPayload
) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.createClaim(
      patientAddress,
      providerAddress,
      amount,
      claimType,
      ipfsHashPayload
    );
    const receipt = await tx.wait();

    // Extract claim ID from events
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "ClaimCreated");

    const claimId = event ? event.args[0].toString() : null;
    console.log("Claim created:", claimId, "tx:", receipt.hash);
    return { claimId, txHash: receipt.hash };
  } catch (error) {
    console.error("Error creating claim:", error.message);
    throw error;
  }
}

/**
 * Set fraud result for a claim on-chain
 */
async function setFraudResultForClaim(
  claimId,
  fraudScore,
  fraudLevel,
  flagged,
  ipfsHashFraudReport
) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    // fraudLevel: 0=LOW, 1=MEDIUM, 2=HIGH
    const tx = await contract.setFraudResultForClaim(
      claimId,
      fraudScore,
      fraudLevel,
      flagged,
      ipfsHashFraudReport
    );
    const receipt = await tx.wait();
    console.log("Fraud result set for claim:", claimId, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error setting fraud result:", error.message);
    throw error;
  }
}

/**
 * Approve a claim on-chain
 */
async function approveClaim(claimId) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.approveClaim(claimId);
    const receipt = await tx.wait();
    console.log("Claim approved:", claimId, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error approving claim:", error.message);
    throw error;
  }
}

/**
 * Reject a claim on-chain
 */
async function rejectClaim(claimId) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const tx = await contract.rejectClaim(claimId);
    const receipt = await tx.wait();
    console.log("Claim rejected:", claimId, "tx:", receipt.hash);
    return receipt.hash;
  } catch (error) {
    console.error("Error rejecting claim:", error.message);
    throw error;
  }
}

/**
 * Get claim details from chain
 */
async function getClaimDetails(claimId) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const claim = await contract.getClaimDetails(claimId);
    return {
      id: claim.id.toString(),
      patient: claim.patient,
      provider: claim.provider,
      amount: claim.amount.toString(),
      claimType: claim.claimType,
      ipfsHashPayload: claim.ipfsHashPayload,
      ipfsHashFraudReport: claim.ipfsHashFraudReport,
      fraudScore: claim.fraudScore,
      fraudLevel: claim.fraudLevel,
      flagged: claim.flagged,
      status: claim.status,
      createdAt: claim.createdAt.toString(),
      updatedAt: claim.updatedAt.toString(),
    };
  } catch (error) {
    console.error("Error getting claim details:", error.message);
    throw error;
  }
}

/**
 * Get patient claims
 */
async function getPatientClaims(patientAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const count = await contract.getPatientClaimsCount(patientAddress);
    const claims = [];

    for (let i = 0; i < count; i++) {
      const claimId = await contract.getPatientClaim(patientAddress, i);
      const claim = await getClaimDetails(claimId.toString());
      claims.push(claim);
    }

    return claims;
  } catch (error) {
    console.error("Error getting patient claims:", error.message);
    throw error;
  }
}

/**
 * Get provider claims
 */
async function getProviderClaims(providerAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const count = await contract.getProviderClaimsCount(providerAddress);
    const claims = [];

    for (let i = 0; i < count; i++) {
      const claimId = await contract.getProviderClaim(providerAddress, i);
      const claim = await getClaimDetails(claimId.toString());
      claims.push(claim);
    }

    return claims;
  } catch (error) {
    console.error("Error getting provider claims:", error.message);
    throw error;
  }
}

/**
 * Check if patient is registered
 */
async function isPatientRegistered(patientAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    return await contract.isPatientRegistered(patientAddress);
  } catch (error) {
    console.error("Error checking patient registration:", error.message);
    throw error;
  }
}

/**
 * Check if provider is approved
 */
async function isProviderApproved(providerAddress) {
  if (!contract) throw new Error("Contract not initialized");

  try {
    return await contract.isProviderApproved(providerAddress);
  } catch (error) {
    console.error("Error checking provider approval:", error.message);
    throw error;
  }
}

/**
 * Get total claims count
 */
async function getTotalClaimsCount() {
  if (!contract) throw new Error("Contract not initialized");

  try {
    const count = await contract.getTotalClaimsCount();
    return count.toString();
  } catch (error) {
    console.error("Error getting total claims count:", error.message);
    throw error;
  }
}

/**
 * Get contract address
 */
function getContractAddress() {
  return contractAddress;
}

module.exports = {
  initializeBlockchain,
  registerPatient,
  registerProvider,
  approveProvider,
  rejectProvider,
  createClaim,
  setFraudResultForClaim,
  approveClaim,
  rejectClaim,
  getClaimDetails,
  getPatientClaims,
  getProviderClaims,
  isPatientRegistered,
  isProviderApproved,
  getTotalClaimsCount,
  getContractAddress,
};
