import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
});

export function setAuthToken(token) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
}

export async function fetchClaims() {
  const response = await api.get('/claims');
  return response.data;
}

export async function submitClaim(payload) {
  const response = await api.post('/submit-claim', payload);
  return response.data;
}

export async function runSimulation(mode, action) {
  const response = await api.post(`/simulate/${mode}/${action}`);
  return response.data;
}

export async function verifyClaim(claimId) {
  const formData = new FormData();
  formData.append('claim_id', claimId);
  formData.append('selfie', new Blob(['mock-selfie-data'], { type: 'text/plain' }), 'selfie.txt');

  const response = await api.post('/verify-user', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data;
}

export async function fetchFraudGraph() {
  const response = await api.get('/fraud-graph');
  return response.data;
}
