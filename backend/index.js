require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const blockchainClient = require("./services/blockchainClient");
const dataStore = require("./services/dataStore");
const fraudEngine = require("./services/fraudEngine");
const ipfsService = require("./services/ipfsService");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    blockchainReady,
    timestamp: new Date().toISOString(),
  });
});

// ==================== PATIENT ROUTES ====================

/**
 * POST /api/patient/register
 * Register a new patient
 */
app.post("/api/patient/register", async (req, res) => {
  try {
    const { name, email, phone, nationalId, walletAddress } = req.body;

    if (!name || !email || !phone || !nationalId || !walletAddress) {
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
    const { name, contactEmail, walletAddress } = req.body;

    if (!name || !contactEmail || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Store provider data
    const provider = dataStore.upsertProvider({
      name,
      contactEmail,
      walletAddress,
      status: "PENDING",
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
      amount,
      claimType,
      description,
      attachments,
    } = req.body;

    if (!patientWallet || !providerWallet || !amount || !claimType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get patient and provider
    const patient = dataStore.getUserByWallet(patientWallet);
    const provider = dataStore.getProviderByWallet(providerWallet);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Prepare claim data for IPFS
    const claimPayload = {
      patientWallet,
      providerWallet,
      amount,
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
    const existingPatients = dataStore.getAllPatients();

    // Evaluate fraud
    const fraudResult = fraudEngine.evaluateClaim(
      { amount, claimType, description },
      patient,
      {
        existingPatients,
        patientClaims,
      }
    );

    // Upload fraud report to IPFS
    const fraudReport = {
      claimId: null, // Will be set after blockchain creation
      fraudScore: fraudResult.fraudScore,
      fraudLevel: fraudResult.fraudLevel,
      fraudFlags: fraudResult.fraudFlags,
      reasons: fraudResult.reasons,
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
          amount,
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
          fraudResult.fraudScore,
          fraudLevelMap[fraudResult.fraudLevel],
          fraudResult.fraudFlags.length > 0,
          ipfsHashFraudReport
        );
      } catch (error) {
        console.error("Blockchain claim creation error:", error.message);
      }
    }

    // Store claim locally
    const claim = dataStore.createClaim({
      id: claimId,
      patientAddress: patientWallet,
      providerAddress: providerWallet,
      amount,
      claimType,
      description,
      ipfsHashPayload,
      ipfsHashFraudReport,
      fraudScore: fraudResult.fraudScore,
      fraudLevel: fraudResult.fraudLevel,
      fraudFlags: fraudResult.fraudFlags,
      status: "PENDING",
    });

    res.json({
      success: true,
      claim,
      fraudScore: fraudResult.fraudScore,
      fraudLevel: fraudResult.fraudLevel,
      fraudFlags: fraudResult.fraudFlags,
      reasons: fraudResult.reasons,
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
 * Get all claims for a provider
 */
app.get("/api/claims/provider/:walletAddress", async (req, res) => {
  try {
    const claims = dataStore.getClaimsByProvider(req.params.walletAddress);

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
 * GET /api/claim/:claimId
 * Get claim details
 */
app.get("/api/claim/:claimId", async (req, res) => {
  try {
    const claim = dataStore.getClaimById(req.params.claimId);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
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
