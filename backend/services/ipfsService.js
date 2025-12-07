const axios = require("axios");

const PINATA_API_URL = "https://api.pinata.cloud";
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY_BASE = process.env.PINATA_GATEWAY_BASE || "https://gateway.pinata.cloud/ipfs";

/**
 * Upload JSON data to IPFS via Pinata
 * @param {Object} data - Data to upload
 * @param {string} filename - Name for the file
 * @returns {Promise<string>} - IPFS hash
 */
async function uploadToIPFS(data, filename = "data.json") {
  if (!PINATA_JWT) {
    console.warn("PINATA_JWT not set, using mock IPFS hash");
    return `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    formData.append("file", blob, filename);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error.message);
    // Return mock hash for demo purposes
    return `QmMock${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Retrieve data from IPFS via Pinata Gateway
 * @param {string} ipfsHash - IPFS hash
 * @returns {Promise<Object>} - Retrieved data
 */
async function retrieveFromIPFS(ipfsHash) {
  if (!ipfsHash || ipfsHash.startsWith("QmMock")) {
    console.warn("Using mock IPFS data for hash:", ipfsHash);
    return { mock: true, hash: ipfsHash };
  }

  try {
    const url = `${PINATA_GATEWAY_BASE}/${ipfsHash}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error("Error retrieving from IPFS:", error.message);
    return null;
  }
}

/**
 * Get full IPFS URL
 * @param {string} ipfsHash - IPFS hash
 * @returns {string} - Full URL
 */
function getIPFSUrl(ipfsHash) {
  return `${PINATA_GATEWAY_BASE}/${ipfsHash}`;
}

module.exports = {
  uploadToIPFS,
  retrieveFromIPFS,
  getIPFSUrl,
};
