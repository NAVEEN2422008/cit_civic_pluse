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

  // 5. Login
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

    const res = await fetch(`${API_BASE_URL}/citizen/dashboard-summary`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch dashboard summary');
    return data;
  },

  // 8. Get Public Area Issues (Privacy Sanitized)
  getPublicIssues: async () => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/citizen/public-issues`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch public issues');
    return data;
  },

  // --- MODULE 3 & 4 INTAKE METHOD ---

  // 9. Submit Complaint Issue Intake
  createIssue: async (issuePayload) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(issuePayload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit complaint');
    return data;
  },

  // --- MODULE 5 SARVAM AI METHODS ---

  // 10. Reprocess Failed Sarvam AI Pipeline
  reprocessSarvam: async (issueId) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/reprocess-sarvam`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reprocess Sarvam AI');
    return data;
  },

  // 11. Correct Transcript or Description
  updateTranscript: async (issueId, { corrected_transcript, corrected_description }) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/transcript`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ corrected_transcript, corrected_description })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update transcript');
    return data;
  },

  // --- MODULE 6 AI CATEGORIZATION METHODS ---

  // 12. Recategorize Issue with Gemini AI
  recategorizeIssue: async (issueId) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/recategorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to recategorize issue');
    return data;
  },

  // --- MODULE 8 MY CIVIC HUB & HEATMAP METHODS ---

  // 13. Get Heatmap Density Clusters
  getHeatmapClusters: async () => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/citizen/heatmap-clusters`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch heatmap clusters');
    return data;
  },

  // 14. Get Issue Detail with 9-Step Status Timeline
  getIssueDetailWithTimeline: async (issueId) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/citizen/issues/${issueId}/detail`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch issue details');
    return data;
  },

  // --- MODULE 9 RESOLUTION & VERIFICATION METHODS ---

  // 15. Confirm Resolution
  confirmResolution: async (issueId) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/confirm-resolution`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to confirm resolution');
    return data;
  },

  // 16. Reopen Issue with Mandatory Proof & Reason
  reopenIssue: async (issueId, { reason, proof_photo, additional_notes }) => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/issues/${issueId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason, proof_photo, additional_notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to reopen complaint');
    return data;
  }
};
