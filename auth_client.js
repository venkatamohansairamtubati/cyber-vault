/* ==========================================================================
   CYBER VAULT — Custom Authentication Client Layer (FastAPI Enclave)
   Enterprise Authentication Client with Email OTP Registration Verification
   (Direct Login — Zero Login OTP / Zero Login 2FA)
   Target Backend: http://127.0.0.1:8000
   ========================================================================== */

// Centralized API Base URLs
const API_BASE_URL = (typeof window !== 'undefined' && (window.CYBER_VAULT_API_BASE || window.CYBER_VAULT_ENGINE_URL)) || 'http://127.0.0.1:8000';
const AUTH_API_BASE = `${API_BASE_URL}/api/auth`;

let currentAuthUser = null;

/**
 * Universal JSON Fetch Helper with Cookies, Timeout, and Multi-Strategy Fallback
 */
async function authFetch(endpoint, options = {}) {
  // Construct direct and proxy URLs
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const directUrl = `${AUTH_API_BASE}${cleanEndpoint}`;
  const proxyUrl = `/api/auth${cleanEndpoint}`;

  const timeoutMs = options.timeout || 6000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    credentials: 'include', // Transmits HTTP-only session cookies
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  let response;
  let lastNetworkError = null;

  // Strategy 1: Try Direct FastAPI URL (http://127.0.0.1:8000/api/auth/...)
  try {
    response = await fetch(directUrl, fetchOptions);
  } catch (netErr) {
    lastNetworkError = netErr;
  }

  // Strategy 2: Fallback to Vite Proxy (/api/auth/...)
  if (!response && !endpoint.startsWith('http')) {
    try {
      response = await fetch(proxyUrl, fetchOptions);
    } catch (proxyNetErr) {
      lastNetworkError = proxyNetErr;
    }
  }

  clearTimeout(timeoutId);

  // If both network attempts failed
  if (!response) {
    console.error('[CyberVaultAuth] Server unreachable:', lastNetworkError);
    const netErr = new Error('AUTHENTICATION SERVER UNAVAILABLE: Unable to reach FastAPI backend at http://127.0.0.1:8000. Please ensure the backend is running.');
    netErr.status = 503;
    netErr.original = lastNetworkError;
    throw netErr;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // FastAPI returns errors under "detail", Express under "error" or "message"
    const errorMsg = data.detail || data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = data.code;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Live Password Strength Validation Rule Checker
 */
function validatePasswordStrength(password) {
  const p = password || '';
  const length = p.length >= 8;
  const upper = /[A-Z]/.test(p);
  const lower = /[a-z]/.test(p);
  const number = /[0-9]/.test(p);
  const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p);
  const valid = length && upper && lower && number && special;

  return {
    valid,
    length,
    upper,
    lower,
    number,
    special
  };
}

/**
 * Register New Analyst Account (Initiates 6-Digit Email OTP Dispatch)
 */
async function register(fullName, email, password, confirmPassword) {
  console.log(`[CyberVaultAuth] Registering account for: ${email}`);
  const payload = {
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    confirmPassword
  };
  return await authFetch('/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Verify 6-Digit Registration OTP to Activate Account
 */
async function verifyRegistrationOtp(email, otp) {
  console.log(`[CyberVaultAuth] Verifying registration OTP for: ${email}`);
  return await authFetch('/verify-registration', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      otp: otp.trim()
    })
  });
}

/**
 * Resend 6-Digit Registration OTP (with 60s cooldown)
 */
async function resendRegistrationOtp(email) {
  console.log(`[CyberVaultAuth] Requesting OTP resend for: ${email}`);
  return await authFetch('/resend-registration-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim()
    })
  });
}

/**
 * Email & Password Login (Direct - Immediate Session Cookie)
 */
async function login(email, password) {
  console.log(`[CyberVaultAuth] Authenticating analyst: ${email}`);
  const data = await authFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password })
  });

  if (data.status === 'AUTHENTICATED' && data.user) {
    currentAuthUser = data.user;
  }
  return data;
}

/**
 * Check Active User Session on Application Startup
 */
async function checkSession() {
  try {
    const data = await authFetch('/me', { method: 'GET', timeout: 3000 });
    if (data && data.authenticated && data.user) {
      currentAuthUser = data.user;
      return {
        authenticated: true,
        user: data.user
      };
    }
    currentAuthUser = null;
    return { authenticated: false, user: null };
  } catch (err) {
    // Gracefully handle unauthenticated or offline state without throwing
    currentAuthUser = null;
    return { authenticated: false, user: null };
  }
}

/**
 * Terminate Session & Logout
 */
async function logout() {
  try {
    await authFetch('/logout', { method: 'POST', timeout: 3000 });
    console.log('[CyberVaultAuth] Session terminated successfully');
  } catch (e) {
    console.warn('[CyberVaultAuth] Logout notice:', e.message);
  } finally {
    currentAuthUser = null;
    purgeLegacySharedData();
  }
}

/**
 * User Data Isolation Layer
 * Strictly scopes all investigations, files, scans, and reports to the authenticated user ID.
 */
function getUserStorageKey(userId) {
  if (!userId) return null;
  return `cv_user_data_${userId}`;
}

function getUserInvestigations(userId) {
  if (!userId) return [];
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[CyberVaultAuth] Failed to load user investigations:', e);
    return [];
  }
}

function saveUserInvestigation(userId, record) {
  if (!userId || !record) return false;
  try {
    const key = getUserStorageKey(userId);
    const list = getUserInvestigations(userId);
    if (!record.id) record.id = 'inv_' + Math.random().toString(36).substring(2, 10);
    record.userId = userId;
    if (!record.createdAt) record.createdAt = new Date().toISOString();

    // Prevent duplicate entries
    const exists = list.some(r => r.id === record.id || (r.sha256 && record.sha256 && r.sha256 === record.sha256 && r.filename === record.filename));
    if (!exists) {
      list.unshift(record);
      if (list.length > 100) list.pop();
      localStorage.setItem(key, JSON.stringify(list));
    }
    return true;
  } catch (e) {
    console.error('[CyberVaultAuth] Error saving user investigation:', e);
    return false;
  }
}

function deleteUserInvestigation(userId, recordId) {
  if (!userId || !recordId) return false;
  try {
    const key = getUserStorageKey(userId);
    let list = getUserInvestigations(userId);
    list = list.filter(r => r.id !== recordId && r.file_id !== recordId);
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('[CyberVaultAuth] Error deleting user investigation:', e);
    return false;
  }
}

function purgeLegacySharedData() {
  try {
    localStorage.removeItem('CYBER_VAULT_HISTORY');
  } catch (e) {}
}

/**
 * Get cached user details
 */
function getCurrentUser() {
  if (currentAuthUser) {
    const fullName = currentAuthUser.fullName || currentAuthUser.full_name || 'Analyst';
    const email = currentAuthUser.email || '';
    const parts = fullName.trim().split(' ');
    const initials = (parts[0]?.[0] || 'C') + (parts[1]?.[0] || fullName[1] || 'V');

    return {
      id: currentAuthUser.id,
      fullName: fullName,
      email: email,
      initials: initials.toUpperCase()
    };
  }
  return null;
}

/**
 * Set active user manually (e.g. after login or session restore)
 */
function setCurrentUser(user) {
  currentAuthUser = user;
}

/**
 * Request Password Reset (Dispatches single-use reset link via Gmail SMTP)
 */
async function requestPasswordReset(email) {
  console.log(`[CyberVaultAuth] Requesting password reset for: ${email}`);
  return await authFetch('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() })
  });
}

/**
 * Verify Single-Use Reset Token
 */
async function verifyResetToken(token) {
  return await authFetch('/verify-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token: token.trim() })
  });
}

/**
 * Submit New Password via Reset Token
 */
async function resetPassword(token, password, confirmPassword) {
  return await authFetch('/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: token.trim(),
      password,
      confirmPassword
    })
  });
}

// Automatically purge legacy shared key on script load
purgeLegacySharedData();

// Expose globally on window
window.CyberVaultAuth = {
  apiBase: API_BASE_URL,
  register,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  login,
  checkSession,
  logout,
  getCurrentUser,
  setCurrentUser,
  validatePasswordStrength,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  getUserInvestigations,
  saveUserInvestigation,
  deleteUserInvestigation,
  purgeLegacySharedData
};

