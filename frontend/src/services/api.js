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
  apiClient.get(`/api/claims/patient/${walletAddress}`);

export const getProviderClaims = (walletAddress) =>
  apiClient.get(`/api/claims/provider/${walletAddress}`);

export const getClaimDetails = (claimId) =>
  apiClient.get(`/api/claim/${claimId}`);

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

// Health check
export const healthCheck = () =>
  apiClient.get('/api/health');

export default apiClient;
