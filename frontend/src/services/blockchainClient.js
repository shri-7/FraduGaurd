import { ethers } from 'ethers';
import { INSURANCE_FRAUD_SYSTEM_ABI, INSURANCE_FRAUD_SYSTEM_ADDRESS } from '../contracts/index.js';

const RPC_URL = import.meta.env.VITE_GANACHE_RPC_URL;
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);

let provider;
let signer;
let contract;

/**
 * Connect to Metamask and initialize blockchain client
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('Metamask not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    provider = new ethers.BrowserProvider(window.ethereum, CHAIN_ID);
    signer = await provider.getSigner();

    if (INSURANCE_FRAUD_SYSTEM_ADDRESS) {
      contract = new ethers.Contract(
        INSURANCE_FRAUD_SYSTEM_ADDRESS,
        INSURANCE_FRAUD_SYSTEM_ABI,
        signer
      );
    }

    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

/**
 * Get current connected account
 */
export async function getCurrentAccount() {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

/**
 * Get patient claims from contract
 */
export async function getPatientClaims(patientAddress) {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    const count = await contract.getPatientClaimsCount(patientAddress);
    const claims = [];

    for (let i = 0; i < count; i++) {
      const claimId = await contract.getPatientClaim(patientAddress, i);
      const claim = await contract.getClaimDetails(claimId);
      claims.push({
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
      });
    }

    return claims;
  } catch (error) {
    console.error('Error getting patient claims:', error);
    throw error;
  }
}

/**
 * Get provider claims from contract
 */
export async function getProviderClaims(providerAddress) {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    const count = await contract.getProviderClaimsCount(providerAddress);
    const claims = [];

    for (let i = 0; i < count; i++) {
      const claimId = await contract.getProviderClaim(providerAddress, i);
      const claim = await contract.getClaimDetails(claimId);
      claims.push({
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
      });
    }

    return claims;
  } catch (error) {
    console.error('Error getting provider claims:', error);
    throw error;
  }
}

/**
 * Get claim details from contract
 */
export async function getClaimDetails(claimId) {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

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
    console.error('Error getting claim details:', error);
    throw error;
  }
}

/**
 * Check if patient is registered
 */
export async function isPatientRegistered(patientAddress) {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    return await contract.isPatientRegistered(patientAddress);
  } catch (error) {
    console.error('Error checking patient registration:', error);
    throw error;
  }
}

/**
 * Check if provider is approved
 */
export async function isProviderApproved(providerAddress) {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    return await contract.isProviderApproved(providerAddress);
  } catch (error) {
    console.error('Error checking provider approval:', error);
    throw error;
  }
}

/**
 * Get total claims count
 */
export async function getTotalClaimsCount() {
  if (!contract) {
    throw new Error('Contract not initialized');
  }

  try {
    const count = await contract.getTotalClaimsCount();
    return count.toString();
  } catch (error) {
    console.error('Error getting total claims count:', error);
    throw error;
  }
}

export { provider, signer, contract };
