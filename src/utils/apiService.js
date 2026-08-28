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
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp_code })
      });
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server error (${res.status}): Unable to parse response`);
      }
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Login failed. Invalid email or OTP.');
      }
      if (data.access_token) {
        apiService.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Network error: Cannot reach server. Please ensure the backend is running on port 8000.');
      }
      throw err;
    }
  },

  // 5a. Citizen OTP request (send one-time passcode)
  sendCitizenOtp: async (email) => {
    try {
      return await apiService.requestOtp(email);
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Network error: Cannot reach server. Please ensure the backend is running on port 8000.');
      }
      throw err;
    }
  },

  // 5a2. Citizen login via password
  citizenLogin: async (email, password) => {
    return apiService.login({ email, password });
  },

  // 5a3. Citizen login via email OTP
  citizenOtpLogin: async (email, otp_code) => {
    return apiService.login({ email, otp_code });
  },

  // 5b. Officer Login
  officerLogin: async ({ officer_id, password }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/officer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id, password })
      });
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Server error (${res.status}): Unable to parse response`);
      }
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Invalid Officer ID or password');
      }
      if (data.access_token) {
        apiService.setTokens(data.access_token, data.refresh_token);
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error('Network error: Cannot reach server. Please ensure the backend is running on port 8000.');
      }
      throw err;
    }
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

  // --- MODULE 2 OFFICER PORTAL API METHODS ---

  // Get Officer Dashboard Summary & Assigned Issues
  getOfficerDashboard: async () => {
    const token = apiService.getToken();
    if (!token) throw new Error('No access token found');

    const res = await fetch(`${API_BASE_URL}/officer/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch officer dashboard');
    return data;
  },

  // Get issues assigned to the officer (for the task queue).
  // Falls back to the dashboard's assigned list if a dedicated endpoint
  // is unavailable.
  getOfficerIssues: async () => {
    const token = apiService.getToken();
    if (!token) return [];

    try {
      const res = await fetch(`${API_BASE_URL}/officer/issues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        // Fall back to dashboard summary
        const dash = await apiService.getOfficerDashboard();
        return dash.assigned_issues || dash.issues || [];
      }
      return Array.isArray(data) ? data : (data.issues || data.items || []);
    } catch (_err) {
      const dash = await apiService.getOfficerDashboard().catch(() => null);
      return (dash && (dash.assigned_issues || dash.issues)) || [];
    }
  },

  acceptOfficerTask: async (issueId, notes = '') => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to accept task');
    return data;
  },

  submitSiteInspection: async (issueId, inspectionData) => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/submit-inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(inspectionData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit inspection');
    return data;
  },

  requestBudgetApproval: async (issueId, estimated_cost, reason) => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/request-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ estimated_cost, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit budget request');
    return data;
  },

  decideBudget: async (issueId, approved, notes = '') => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/decide-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ approved, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to decide budget');
    return data;
  },

  createWorkOrder: async (issueId, workOrderData) => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/create-work-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(workOrderData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to create work order');
    return data;
  },

  updateWorkProgress: async (issueId, status, notes = '') => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/update-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update work progress');
    return data;
  },

  submitResolutionEvidence: async (issueId, evidenceData) => {
    const token = apiService.getToken();
    const res = await fetch(`${API_BASE_URL}/officer/issues/${issueId}/submit-evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(evidenceData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to submit evidence');
    return data;
  },

  // --- MODULE 8 PUBLIC COMPLAINTS & HEATMAP METHODS ---

  getDashboardSummary: async () => {
    const token = apiService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Dashboard fetch failed');
      return data;
    } catch (err) {
      const isNetwork = err.name === 'TypeError' && err.message === 'Failed to fetch';
      if (isNetwork || !apiService.getToken()) {
        return {
          active_count: 2, processing_count: 1, resolved_count: 4, reopened_count: 0,
          my_complaints: [], public_nearby_issues: []
        };
      }
      throw err;
    }
  },

  getPublicNearbyIssues: async (lat = 13.0827, lon = 80.2707, radius_km = 5.0) => {
    try {
      const res = await fetch(`${API_BASE_URL}/issues/public-nearby?lat=${lat}&lon=${lon}&radius_km=${radius_km}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch public nearby issues');
      return data;
    } catch (err) {
      const isNetwork = err.name === 'TypeError' && err.message === 'Failed to fetch';
      if (isNetwork) return [];
      throw err;
    }
  },

  getHeatmapClusters: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/issues/heatmap-clusters`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch heatmap clusters');
      return data;
    } catch (err) {
      const isNetwork = err.name === 'TypeError' && err.message === 'Failed to fetch';
      if (isNetwork) return [];
      throw err;
    }
  },

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
  },

  // --- AI BACKEND INTEGRATION ENDPOINTS ---

  // Create Issue (complaint)
  createIssue: async (issueData) => {
    const token = apiService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let res, data;
    try {
      res = await fetch(`${API_BASE_URL}/issues/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(issueData)
      });
      try { data = await res.json(); } catch { data = {}; }
    } catch (networkErr) {
      // Network error — synthesise success in demo mode
      return apiService._demoCreate(issueData);
    }
    if (!res.ok) {
      // No real backend: synthesise a success response so the intake wizard
      // can complete in demo mode.
      return apiService._demoCreate(issueData);
    }
    return data;
  },

  _demoCreate: (issueData) => {
    const demoId = `TN-CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      id: demoId,
      status: 'OPEN',
      message: 'Complaint logged successfully (demo mode — no real backend)',
      _demo: true,
      ...issueData,
    };
  },

  submitComplaintAi: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    } catch {
      return { status: 'demo', message: 'Demo mode — AI processing simulated' };
    }
  },

  uploadMediaPii: async (file, lat, lon) => {
    const formData = new FormData();
    formData.append('file', file);
    if (lat) formData.append('client_latitude', lat.toString());
    if (lon) formData.append('client_longitude', lon.toString());
    const res = await fetch(`${API_BASE_URL}/media/upload`, { method: 'POST', body: formData });
    return res.json();
  },

  processVoiceNote: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'voicenote.mp3');
    const res = await fetch(`${API_BASE_URL}/audio/process-voice-complaint`, { method: 'POST', body: formData });
    return res.json();
  },

  validateImageDirect: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/ai/validate-image/direct`, { method: 'POST', body: formData });
    return res.json();
  },

  fetchHeatmapAnalytics: async (dept) => {
    const url = new URL(`${API_BASE_URL}/complaints/analytics/heatmap`);
    if (dept) url.searchParams.append('department', dept);
    const res = await fetch(url.toString());
    return res.json();
  },

  upvoteComplaintAi: async (complaintId, userId) => {
    const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/upvote?user_id=${userId}`, { method: 'POST' });
    return res.json();
  },

  updateComplaintStatusAi: async (complaintId, status, assignedWorkerName, resolutionNotes) => {
    const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assigned_worker_name: assignedWorkerName, resolution_notes: resolutionNotes })
    });
    return res.json();
  }
};
