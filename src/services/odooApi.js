// src/services/odooApi.js (or equivalent API handler)

const BASE_URL = 'https://odoo-api.airiv.id';

export async function callOdooRpc(endpoint, params = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors', // Crucial for cross-subdomain calls
    credentials: 'include', // Crucial: passes and saves Odoo session_id cookies across requests
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Sesi tidak valid atau server mengembalikan respon non-JSON.');
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'RPC Error');
  }

  return data.result;
}