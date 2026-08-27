const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiService = {
  // Token management
  getToken: () => localStorage.getItem('civicpulse_access_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('civicpulse_access_token', accessToken);
    localStorage.setItem('civicpulse_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('civicpulse_access_token');
    localStorage.removeItem('civicpulse_refresh_token');
  },

  // 1. Request Email OTP
  requestOtp: async (email) => {
    const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to request OTP');
    return data;
  },

  // 2. Verify Email OTP
  verifyOtp: async (email, otp_code) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp_code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to verify OTP');
    return data;
  },

  // 3. Check Demo Aadhaar Identity
  checkDemoIdentity: async (demo_aadhaar_number) => {
    const res = await fetch(`${API_BASE_URL}/auth/check-demo-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demo_aadhaar_number })
    });
    const data = await res.json();
    return data;
  },

  // 4. Register Citizen
  registerCitizen: async ({ email, demo_aadhaar_number, preferred_language, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register-citizen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, demo_aadhaar_number, preferred_language, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    if (data.access_token) {
      apiService.setTokens(data.access_token, data.refresh_token);
    }
    return data;
  },

  // 5. Citizen Login
  login: async ({ email, password, otp_code }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, otp_code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    if (data.access_token) {
      apiService.setTokens(data.access_token, data.refresh_token);
    }
    return data;
  },

  // 5b. Officer Login
  officerLogin: async ({ officer_id, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/officer-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ officer_id, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Officer login failed');
    if (data.access_token) {
      apiService.setTokens(data.access_token, data.refresh_token);
    }
    return data;
  },

  // 6. Get Protected User Profile
  getUserProfile: async () => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch profile');
    return data;
  },

  // --- MODULE 2 DASHBOARD METHODS ---

  // 7. Get Citizen Dashboard Summary
  getDashboardSummary: async () => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/citizen/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch dashboard summary');
    return data;
  },

  // --- MODULE 3 & 4 INTAKE METHODS ---

  // 8. Create Issue (Intake API)
  createIssue: async (issuePayload) => {
    const token = apiService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/issues/intake`, {
      method: 'POST',
      headers,
      body: JSON.stringify(issuePayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit issue');
    return data;
  },

  // 9. Sync Offline Queue Batch
  syncBatchOfflineIssues: async (issuesArray) => {
    const token = apiService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/issues/sync-batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(issuesArray)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to sync offline issues');
    return data;
  },

  // --- MODULE 8 PUBLIC COMPLAINTS & HEATMAP METHODS ---

  // 10. Get Public Nearby Issues
  getPublicNearbyIssues: async (lat = 13.0827, lon = 80.2707, radius_km = 5.0) => {
    const res = await fetch(`${API_BASE_URL}/issues/public-nearby?lat=${lat}&lon=${lon}&radius_km=${radius_km}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch public nearby issues');
    return data;
  },

  // 11. Get Heatmap Clusters
  getHeatmapClusters: async () => {
    const res = await fetch(`${API_BASE_URL}/issues/heatmap-clusters`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch heatmap clusters');
    return data;
  },

  // --- MODULE 9 RESOLUTION VERIFICATION METHODS ---

  // 12. Submit Citizen Resolution Verification
  verifyResolution: async (issueId, { confirmed, reopen_reason, reopen_proof_photo }) => {
    const token = apiService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/verify-resolution`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ confirmed, reopen_reason, reopen_proof_photo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit resolution verification');
    return data;
  }
};
