import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patient APIs
export const registerPatient = (data) =>
  apiClient.post('/api/patient/register', data);

export const getPatient = (walletAddress) =>
  apiClient.get(`/api/patient/${walletAddress}`);

// Provider APIs
export const registerProvider = (data) =>
  apiClient.post('/api/provider/register', data);

export const getProvider = (walletAddress) =>
  apiClient.get(`/api/provider/${walletAddress}`);

export const approveProvider = (walletAddress) =>
  apiClient.post(`/api/provider/${walletAddress}/approve`);

export const rejectProvider = (walletAddress) =>
  apiClient.post(`/api/provider/${walletAddress}/reject`);

export const getAllProviders = () =>
  apiClient.get('/api/providers');

// Claim APIs
export const createClaim = (data) =>
  apiClient.post('/api/claim', data);

export const getPatientClaims = (walletAddress) =>
  apiClient.get(`/api/claims/patient/${walletAddress}?walletAddress=${walletAddress}`);

export const getProviderClaims = (walletAddress) =>
  apiClient.get(`/api/claims/provider/${walletAddress}?walletAddress=${walletAddress}`);

export const getClaimDetails = (claimId, walletAddress) =>
  apiClient.get(`/api/claim/${claimId}${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);

export const getClaimById = (claimId, walletAddress) =>
  apiClient.get(`/api/claim/${claimId}${walletAddress ? `?walletAddress=${walletAddress}` : ''}`);

export const approveClaim = (claimId) =>
  apiClient.post(`/api/claim/${claimId}/approve`);

export const rejectClaim = (claimId) =>
  apiClient.post(`/api/claim/${claimId}/reject`);

export const getAllClaims = () =>
  apiClient.get('/api/claims');

// Admin APIs
export const getAdminStats = () =>
  apiClient.get('/api/admin/stats');

export const getAllUsers = () =>
  apiClient.get('/api/admin/users');

// Auth APIs
export const validateAuth = (walletAddress) =>
  apiClient.get(`/api/auth/validate?walletAddress=${walletAddress}`);

// Health check
export const healthCheck = () =>
  apiClient.get('/api/health');

// ML Scoring (internal diagnostic endpoint)
export const scoreClaim = (payload) =>
  apiClient.post('/internal/ml/score-claim', payload);

export default apiClient;
