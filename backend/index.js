require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const blockchainClient = require("./services/blockchainClient");
const dataStore = require("./services/dataStore");
const fraudEngine = require("./services/fraudEngine");
const ipfsService = require("./services/ipfsService");
const mlScorer = require("./ml-scorer");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
// Internal ML router (for diagnostics/local scoring)
app.use("/internal/ml", mlScorer.router);

// Initialize blockchain on startup
let blockchainReady = false;

async function initializeApp() {
  try {
    await blockchainClient.initializeBlockchain();
    blockchainReady = true;
    console.log("Blockchain client initialized");
  } catch (error) {
    console.warn("Blockchain not ready yet:", error.message);
    blockchainReady = false;
  }
  try {
    await mlScorer.init();
    console.log("ML scorer initialized");
  } catch (e) {
    console.warn("ML scorer not initialized:", e.message);
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    blockchainReady,
    timestamp: new Date().toISOString(),
  });
});

// ==================== TEST DATA ROUTES ====================

/**
 * POST /api/test/init-data
 * Initialize test data for development
 */
app.post("/api/test/init-data", (req, res) => {
  try {
    const patientWallet = process.env.PATIENT_WALLET || "0x48ed6173384a54be8aC87a6d2494Cbbc95ee2cd9";
    const providerWallet = process.env.PROVIDER_WALLET || "0x69544704a202bCBBf125f55BD2aEb5fb2Cc7Ff6";

    // Create test patient
    const patient = dataStore.upsertUser({
      role: "PATIENT",
      name: "Test Patient",
      email: "patient@test.com",
      phone: "9876543210",
      nationalId: "AAAA0000A",
      dateOfBirth: "1990-01-01",
      walletAddress: patientWallet,
    });

    // Create test provider
    const provider = dataStore.upsertProvider({
      name: "Test Insurance Provider",
      contactEmail: "provider@test.com",
      phone: "9876543211",
      licenseNumber: "LIC123456",
      approvalStatus: "APPROVED",
      walletAddress: providerWallet,
    });

    // Create test claims
    const testClaims = [
      {
        patientAddress: patientWallet,
        providerAddress: providerWallet,
        amountInr: 50000,
        claimType: "Hospitalization",
        description: "Emergency surgery",
        status: "PENDING_PROVIDER",
        fraudScore: 12,
        fraudLevel: "LOW",
        fraudFlags: [],
      },
      {
        patientAddress: patientWallet,
        providerAddress: providerWallet,
        amountInr: 75000,
        claimType: "Treatment",
        description: "Cancer treatment",
        status: "PENDING_PROVIDER",
        fraudScore: 22,
        fraudLevel: "LOW",
        fraudFlags: ["high_amount"],
      },
      {
        patientAddress: patientWallet,
        providerAddress: providerWallet,
        amountInr: 120000,
        claimType: "Surgery",
        description: "Cardiac surgery",
        status: "PENDING_PROVIDER",
        fraudScore: 8,
        fraudLevel: "LOW",
        fraudFlags: [],
      },
    ];

    const createdClaims = testClaims.map((claim) => dataStore.createClaim(claim));

    res.json({
      success: true,
      message: "Test data initialized",
      patient,
      provider,
      claims: createdClaims,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUTH ROUTES ====================

/**
 * GET /api/auth/validate
 * Validate user role and authorization
 */
app.get("/api/auth/validate", (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress required" });
    }

    const sysAdminWallet = process.env.SYS_ADMIN_WALLET?.toLowerCase();
    const providerWallet = process.env.PROVIDER_WALLET?.toLowerCase();
    const patientWallet = process.env.PATIENT_WALLET?.toLowerCase();
    const normalizedWallet = walletAddress.toLowerCase();

    // Determine role based on wallet address
    if (normalizedWallet === sysAdminWallet) {
      return res.json({
        isAuthorized: true,
        role: "SYS_ADMIN",
        walletAddress,
      });
    }

    if (normalizedWallet === providerWallet) {
      return res.json({
        isAuthorized: true,
        role: "PROVIDER",
        walletAddress,
      });
    }

    if (normalizedWallet === patientWallet) {
      return res.json({
        isAuthorized: true,
        role: "PATIENT",
        walletAddress,
      });
    }

    // Default: treat as patient if wallet is registered
    const patient = dataStore.getUserByWallet(walletAddress);
    if (patient) {
      return res.json({
        isAuthorized: true,
        role: "PATIENT",
        walletAddress,
        userId: patient.id,
      });
    }

    // Default: treat as provider if wallet is registered
    const provider = dataStore.getProviderByWallet(walletAddress);
    if (provider) {
      return res.json({
        isAuthorized: true,
        role: "PROVIDER",
        walletAddress,
        providerId: provider.id,
      });
    }

    // Unknown wallet - default to patient role
    res.json({
      isAuthorized: true,
      role: "PATIENT",
      walletAddress,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/patient-login
 * Validate patient credentials (email + DoB + wallet)
 */
app.post("/api/auth/patient-login", (req, res) => {
  try {
    const { email, dateOfBirth, walletAddress } = req.body;

    if (!email || !dateOfBirth || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if this is the patient wallet
    const patientWallet = process.env.PATIENT_WALLET?.toLowerCase();
    if (walletAddress.toLowerCase() === patientWallet) {
      return res.json({
        success: true,
        patient: {
          id: "patient-1",
          name: "Test Patient",
          email: email,
          walletAddress: walletAddress,
        },
      });
    }

    // Check if patient exists in dataStore
    const patient = dataStore.getUserByWallet(walletAddress);
    if (patient) {
      return res.json({
        success: true,
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          walletAddress: patient.walletAddress,
        },
      });
    }

    // Patient not found - create default patient
    res.json({
      success: true,
      patient: {
        id: "patient-" + Date.now(),
        name: "Patient",
        email: email,
        walletAddress: walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/provider-login
 * Validate provider credentials (email + wallet)
 */
app.post("/api/auth/provider-login", (req, res) => {
  try {
    const { email, walletAddress } = req.body;

    if (!email || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if this is the provider wallet
    const providerWallet = process.env.PROVIDER_WALLET?.toLowerCase();
    if (walletAddress.toLowerCase() === providerWallet) {
      return res.json({
        success: true,
        provider: {
          id: "provider-1",
          name: "Insurance Provider",
          contactEmail: email,
          walletAddress: walletAddress,
        },
      });
    }

    // Check if provider exists in dataStore
    const provider = dataStore.getProviderByWallet(walletAddress);
    if (provider) {
      return res.json({
        success: true,
        provider: {
          id: provider.id,
          name: provider.name,
          contactEmail: provider.contactEmail,
          walletAddress: provider.walletAddress,
        },
      });
    }

    // Provider not found
    return res.status(401).json({ error: "Provider not found" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PATIENT ROUTES ====================

/**
 * POST /api/patient/register
 * Register a new patient
 */
app.post("/api/patient/register", async (req, res) => {
  try {
    const { name, email, phone, nationalId, dateOfBirth, walletAddress } = req.body;

    if (!name || !email || !phone || !nationalId || !dateOfBirth || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for identity fraud
    const existingPatients = dataStore.getAllPatients();
    const fraudResult = fraudEngine.checkIdentityFraud(
      { name, email, phone, nationalId },
      existingPatients
    );

    // Store patient data
    const patient = dataStore.upsertUser({
      role: "PATIENT",
      name,
      email,
      phone,
      nationalId,
      dateOfBirth,
      walletAddress,
    });

    let txHash = null;

    // Register on blockchain if ready
    if (blockchainReady) {
      try {
        const nationalIdHash = dataStore.hashString(nationalId);
        txHash = await blockchainClient.registerPatient(
          walletAddress,
          nationalIdHash
        );
      } catch (error) {
        console.error("Blockchain registration error:", error.message);
      }
    }

    res.json({
      success: true,
      patient,
      fraudScore: fraudResult.score,
      fraudLevel: fraudResult.score >= 70 ? "HIGH" : fraudResult.score >= 40 ? "MEDIUM" : "LOW",
      fraudFlags: fraudResult.flags,
      reasons: fraudResult.reasons,
      txHash,
    });
  } catch (error) {
    console.error("Error registering patient:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/patient/:walletAddress
 * Get patient details
 */
app.get("/api/patient/:walletAddress", (req, res) => {
  try {
    const patient = dataStore.getUserByWallet(req.params.walletAddress);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROVIDER ROUTES ====================

/**
 * POST /api/provider/register
 * Register a new provider
 */
app.post("/api/provider/register", async (req, res) => {
  try {
    const { name, contactEmail, gstin, walletAddress } = req.body;

    if (!name || !contactEmail || !gstin || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store provider data
    const provider = dataStore.upsertProvider({
      name,
      contactEmail,
      gstin,
      walletAddress,
      approvalStatus: "PENDING",
    });

    let txHash = null;

    // Register on blockchain if ready
    if (blockchainReady) {
      try {
        txHash = await blockchainClient.registerProvider(walletAddress, name);
      } catch (error) {
        console.error("Blockchain registration error:", error.message);
      }
    }

    res.json({
      success: true,
      provider,
      txHash,
    });
  } catch (error) {
    console.error("Error registering provider:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/provider/:walletAddress
 * Get provider details
 */
app.get("/api/provider/:walletAddress", (req, res) => {
  try {
    const provider = dataStore.getProviderByWallet(req.params.walletAddress);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/provider/:walletAddress/approve
 * Approve a provider (admin only)
 */
app.post("/api/provider/:walletAddress/approve", async (req, res) => {
  try {
    const provider = dataStore.updateProviderStatus(
      req.params.walletAddress,
      "APPROVED"
    );

    let txHash = null;

    if (blockchainReady) {
      try {
        txHash = await blockchainClient.approveProvider(req.params.walletAddress);
      } catch (error) {
        console.error("Blockchain approval error:", error.message);
      }
    }

    res.json({
      success: true,
      provider,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/provider/:walletAddress/reject
 * Reject a provider (admin only)
 */
app.post("/api/provider/:walletAddress/reject", async (req, res) => {
  try {
    const provider = dataStore.updateProviderStatus(
      req.params.walletAddress,
      "REJECTED"
    );

    let txHash = null;

    if (blockchainReady) {
      try {
        txHash = await blockchainClient.rejectProvider(req.params.walletAddress);
      } catch (error) {
        console.error("Blockchain rejection error:", error.message);
      }
    }

    res.json({
      success: true,
      provider,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/providers
 * Get all providers
 */
app.get("/api/providers", (req, res) => {
  try {
    const providers = dataStore.getAllProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/provider/:walletAddress
 * Delete an inactive provider
 */
app.delete("/api/provider/:walletAddress", (req, res) => {
  try {
    const provider = dataStore.getProviderByWallet(req.params.walletAddress);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Check if provider is inactive (no claims for 30 days)
    const daysSinceLastClaim = provider.lastClaimDate
      ? (Date.now() - new Date(provider.lastClaimDate)) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceLastClaim < 30) {
      return res.status(400).json({
        error: "Cannot delete active provider. Provider must be inactive for 30+ days.",
      });
    }

    // Delete provider
    dataStore.deleteProvider(req.params.walletAddress);

    res.json({
      success: true,
      message: "Provider deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== FILE UPLOAD ROUTES ====================

/**
 * POST /api/upload
 * Upload files to IPFS via Pinata
 */
app.post("/api/upload", async (req, res) => {
  try {
    // For demo purposes, we'll simulate file upload
    // In production, use multer middleware to handle file uploads
    
    const files = req.files || [];
    const attachments = [];

    // Simulate IPFS upload for each file
    for (const file of files) {
      const ipfsHash = `QmSimulated${crypto.randomBytes(16).toString('hex')}`;
      attachments.push({
        name: file.originalname || `file_${Date.now()}`,
        ipfsHash,
        mimeType: file.mimetype || 'application/octet-stream',
      });
    }

    // If no files provided, return empty array
    res.json({
      success: true,
      attachments: attachments.length > 0 ? attachments : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLAIM ROUTES ====================

/**
 * POST /api/claim
 * Create a new claim with fraud evaluation
 */
app.post("/api/claim", async (req, res) => {
  try {
    const {
      patientWallet,
      providerWallet,
      amountInr,
      claimType,
      description,
      attachments,
    } = req.body;

    if (!patientWallet || !providerWallet || !amountInr || !claimType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get patient and provider
    let patient = dataStore.getUserByWallet(patientWallet);
    const provider = dataStore.getProviderByWallet(providerWallet);

    // If patient is not found in the data store, auto-create a minimal
    // patient record so that claim submission can proceed for demo flows.
    if (!patient) {
      patient = dataStore.upsertUser({
        role: "PATIENT",
        name: "Patient",
        email: `${patientWallet.toLowerCase()}@auto.local`,
        phone: "0000000000",
        nationalId: patientWallet,
        dateOfBirth: null,
        walletAddress: patientWallet,
      });
    }
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Prepare claim data for IPFS
    const claimPayload = {
      patientWallet,
      providerWallet,
      amountInr,
      claimType,
      description,
      attachments: attachments || [],
      createdAt: new Date().toISOString(),
    };

    // Upload to IPFS
    const ipfsHashPayload = await ipfsService.uploadToIPFS(
      claimPayload,
      `claim-${Date.now()}.json`
    );

    // Get patient history for fraud evaluation
    const patientClaims = dataStore.getClaimsByPatient(patientWallet);
    const providerClaims = dataStore.getClaimsByProvider(providerWallet);
    const existingPatients = dataStore.getAllPatients();

    // Evaluate ML fraud score (0-1). Fallback to rule-based if ML unavailable.
    let mlScore01 = null;
    let mlExplanation = [];
    try {
      const mlRes = await mlScorer.scoreClaim({
        patientWallet,
        providerWallet,
        amountInr,
        claimType,
        description,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
      }, {
        patient,
        patientClaims,
        providerClaims,
      });
      mlScore01 = mlRes.score01;
      mlExplanation = (mlRes.details && mlRes.details.top_features) || [];
    } catch (e) {
      console.warn("ML scoring failed:", e.message);
    }

    // Rule-based fraud evaluation (used as fallback and for additional flags)
    const ruleFraud = fraudEngine.evaluateClaim(
      { amountInr, claimType, description, attachments },
      patient,
      {
        existingPatients,
        patientClaims,
      }
    );

    // Upload fraud report to IPFS
    // Build fraud report (non-PII). Prefer ML if available, else rule-based.
    const finalScore01 = mlScore01 !== null ? mlScore01 : (ruleFraud.fraudScore / 100);
    const finalScore0_100 = Math.round(Math.max(0, Math.min(1, finalScore01)) * 100);
    const finalLevel = finalScore0_100 >= 61 ? "HIGH" : finalScore0_100 >= 31 ? "MEDIUM" : "LOW";
    const scoreDigest = crypto
      .createHash("sha256")
      .update(JSON.stringify({ s: finalScore0_100, t: Date.now() }))
      .digest("hex");

    const fraudReport = {
      claimId: null, // set after chain creation
      modelVersion: (mlScorer.meta() && mlScorer.meta().model_version) || "v0",
      score01: mlScore01,
      fraudScore: finalScore0_100,
      fraudLevel: finalLevel,
      explanation: mlExplanation, // top-3 features
      ruleBased: {
        score: ruleFraud.fraudScore,
        level: ruleFraud.fraudLevel,
        flags: ruleFraud.fraudFlags,
        reasons: ruleFraud.reasons,
      },
      features: undefined, // not stored to reduce leakage
      scoreHash: scoreDigest,
      evaluatedAt: new Date().toISOString(),
    };

    const ipfsHashFraudReport = await ipfsService.uploadToIPFS(
      fraudReport,
      `fraud-report-${Date.now()}.json`
    );

    // Create claim on blockchain
    let claimId = null;
    let txHashCreate = null;
    let txHashFraud = null;

    if (blockchainReady) {
      try {
        const createResult = await blockchainClient.createClaim(
          patientWallet,
          providerWallet,
          amountInr,
          claimType,
          ipfsHashPayload
        );

        claimId = createResult.claimId;
        txHashCreate = createResult.txHash;

        // Set fraud result
        const fraudLevelMap = {
          LOW: 0,
          MEDIUM: 1,
          HIGH: 2,
        };

        txHashFraud = await blockchainClient.setFraudResultForClaim(
          claimId,
          finalScore0_100,
          fraudLevelMap[finalLevel],
          (ruleFraud.fraudFlags || []).length > 0 || finalScore0_100 >= 61,
          ipfsHashFraudReport
        );
      } catch (error) {
        console.error("Blockchain claim creation error:", error.message);
      }
    }

    // Determine claim routing based on fraud score
    let claimStatus = "PENDING_PROVIDER";
    let fraudDetectedAt = null;
    
    if (finalScore0_100 >= 61) {
      claimStatus = "ADMIN_REVIEW_REQUIRED";
      fraudDetectedAt = Date.now();
    }

    // Store claim locally
    const claim = dataStore.createClaim({
      id: claimId,
      patientAddress: patientWallet,
      providerAddress: providerWallet,
      amountInr,
      claimType,
      description,
      attachments: attachments || [],
      ipfsHashPayload,
      ipfsHashFraudReport,
      fraudScore: finalScore0_100,
      fraudLevel: finalLevel,
      fraudFlags: ruleFraud.fraudFlags || [],
      status: claimStatus,
      fraudDetectedAt,
    });

    res.json({
      success: true,
      claim,
      fraudScore: finalScore0_100,
      fraudLevel: finalLevel,
      fraudFlags: ruleFraud.fraudFlags,
      reasons: ruleFraud.reasons,
      ml: {
        score01: mlScore01,
        explanation: mlExplanation,
      },
      ipfsHashPayload,
      ipfsHashFraudReport,
      txHashCreate,
      txHashFraud,
    });
  } catch (error) {
    console.error("Error creating claim:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/claims/patient/:walletAddress
 * Get all claims for a patient
 */
app.get("/api/claims/patient/:walletAddress", async (req, res) => {
  try {
    // Optional privacy enforcement: if requester wallet provided, it must match the patient param
    const requester = (req.query.walletAddress || req.query.wallet || "").toLowerCase();
    if (requester) {
      if (requester !== req.params.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden: cannot access other patients' claims" });
      }
    }
    const claims = dataStore.getClaimsByPatient(req.params.walletAddress);

    // Enrich with IPFS data
    const enrichedClaims = await Promise.all(
      claims.map(async (claim) => {
        const ipfsUrl = ipfsService.getIPFSUrl(claim.ipfsHashPayload);
        const fraudReportUrl = claim.ipfsHashFraudReport
          ? ipfsService.getIPFSUrl(claim.ipfsHashFraudReport)
          : null;

        return {
          ...claim,
          ipfsUrl,
          fraudReportUrl,
        };
      })
    );

    res.json(enrichedClaims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/claims/provider/:walletAddress
 * Get all LEGITIMATE claims for a provider (fraud claims go to admin only)
 */
app.get("/api/claims/provider/:walletAddress", async (req, res) => {
  try {
    // Optional privacy enforcement: if requester wallet provided, it must match the provider param
    const requester = (req.query.walletAddress || req.query.wallet || "").toLowerCase();
    if (requester) {
      if (requester !== req.params.walletAddress.toLowerCase()) {
        return res.status(403).json({ error: "Forbidden: cannot access other providers' claims" });
      }
    }
    const allClaims = dataStore.getClaimsByProvider(req.params.walletAddress);

    // Filter to show only legitimate claims (status === "PENDING_PROVIDER")
    // Fraud claims (status === "ADMIN_REVIEW_REQUIRED") are NOT shown to providers
    const legitimateClaims = allClaims.filter(
      (claim) => claim.status === "PENDING_PROVIDER"
    );

    // Enrich with IPFS data
    const enrichedClaims = await Promise.all(
      legitimateClaims.map(async (claim) => {
        const ipfsUrl = ipfsService.getIPFSUrl(claim.ipfsHashPayload);
        const fraudReportUrl = claim.ipfsHashFraudReport
          ? ipfsService.getIPFSUrl(claim.ipfsHashFraudReport)
          : null;

        return {
          ...claim,
          ipfsUrl,
          fraudReportUrl,
        };
      })
    );

    res.json(enrichedClaims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/claims/admin/fraud-review
 * Get all fraud claims for admin review
 * Auto-rejects claims that have exceeded 1 hour timeout
 */
app.get("/api/claims/admin/fraud-review", async (req, res) => {
  try {
    // Auto-reject fraud claims that have timed out
    dataStore.autoRejectFraudClaims();

    // Get all claims and filter for admin review
    const allClaims = dataStore.getAllClaims();
    const fraudClaims = allClaims.filter(
      (claim) =>
        claim.status === "ADMIN_REVIEW_REQUIRED" ||
        claim.status === "REJECTED_FRAUD"
    );

    // Enrich with IPFS data
    const enrichedClaims = await Promise.all(
      fraudClaims.map(async (claim) => {
        const ipfsUrl = ipfsService.getIPFSUrl(claim.ipfsHashPayload);
        const fraudReportUrl = claim.ipfsHashFraudReport
          ? ipfsService.getIPFSUrl(claim.ipfsHashFraudReport)
          : null;

        return {
          ...claim,
          ipfsUrl,
          fraudReportUrl,
        };
      })
    );

    res.json(enrichedClaims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/claim/:claimId
 * Get claim details
 */
app.get("/api/claim/:claimId", async (req, res) => {
  try {
    const claim = dataStore.getClaimById(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Privacy check: if requester provides a wallet, enforce ownership (patient or provider)
    const requester = (req.query.walletAddress || req.query.wallet || "").toLowerCase();
    if (requester) {
      const isPatient = (claim.patientAddress || "").toLowerCase() === requester;
      const isProvider = (claim.providerAddress || "").toLowerCase() === requester;
      if (!isPatient && !isProvider) {
        return res.status(403).json({ error: "Forbidden: not authorized to view this claim" });
      }
    }

    const ipfsUrl = ipfsService.getIPFSUrl(claim.ipfsHashPayload);
    const fraudReportUrl = claim.ipfsHashFraudReport
      ? ipfsService.getIPFSUrl(claim.ipfsHashFraudReport)
      : null;

    res.json({
      ...claim,
      ipfsUrl,
      fraudReportUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/claim/:claimId/approve
 * Approve a claim
 */
app.post("/api/claim/:claimId/approve", async (req, res) => {
  try {
    const claim = dataStore.updateClaim(req.params.claimId, {
      status: "APPROVED",
    });

    let txHash = null;

    if (blockchainReady) {
      try {
        txHash = await blockchainClient.approveClaim(req.params.claimId);
      } catch (error) {
        console.error("Blockchain approval error:", error.message);
      }
    }

    res.json({
      success: true,
      claim,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/claim/:claimId/reject
 * Reject a claim
 */
app.post("/api/claim/:claimId/reject", async (req, res) => {
  try {
    const claim = dataStore.updateClaim(req.params.claimId, {
      status: "REJECTED",
    });

    let txHash = null;

    if (blockchainReady) {
      try {
        txHash = await blockchainClient.rejectClaim(req.params.claimId);
      } catch (error) {
        console.error("Blockchain rejection error:", error.message);
      }
    }

    res.json({
      success: true,
      claim,
      txHash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/claims
 * Get all claims
 */
app.get("/api/claims", (req, res) => {
  try {
    const claims = dataStore.getAllClaims();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/stats
 * Get system statistics
 */
app.get("/api/admin/stats", (req, res) => {
  try {
    const stats = {
      totalPatients: dataStore.getAllPatients().length,
      totalProviders: dataStore.getAllProviders().length,
      pendingProviders: dataStore.getProvidersByStatus("PENDING").length,
      approvedProviders: dataStore.getProvidersByStatus("APPROVED").length,
      rejectedProviders: dataStore.getProvidersByStatus("REJECTED").length,
      ...dataStore.getClaimsStats(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
app.get("/api/admin/users", (req, res) => {
  try {
    const users = dataStore.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await initializeApp();
});
