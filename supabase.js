/* ==========================================================================
   CYBER VAULT — Supabase Client & Authentication Layer
   Supabase Project: https://ayxiwzuyzopdnpozajwq.supabase.co
   Publishable Key: sb_publishable_WhkvSflQYxwCH1bjNv0oKw_k4rd5ZW0
   ========================================================================== */

const SUPABASE_URL = "https://ayxiwzuyzopdnpozajwq.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WhkvSflQYxwCH1bjNv0oKw_k4rd5ZW0";

// Diagnostic indicators (Safe boolean check)
console.log("Supabase URL loaded:", !!SUPABASE_URL);
console.log("Supabase publishable key loaded:", !!DEFAULT_SUPABASE_PUBLISHABLE_KEY);

// Allow local override from localStorage if user sets it in settings
const storedKey = typeof localStorage !== "undefined" ? localStorage.getItem("CYBER_VAULT_SUPABASE_KEY") : null;
const SUPABASE_PUBLISHABLE_KEY = storedKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

let supabaseClient = null;

/**
 * Initialize or get singleton Supabase Client
 */
function getSupabase() {
  if (!supabaseClient) {
    if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log("✅ Supabase Client initialized successfully!");
    } else if (typeof window !== "undefined" && window.supabaseClient) {
      supabaseClient = window.supabaseClient;
    }
  }
  return supabaseClient;
}

/**
 * Asynchronously ensure Supabase Client is ready
 */
async function ensureSupabaseClient() {
  let client = getSupabase();
  if (client) return client;

  // If not yet available on window, load dynamically
  if (typeof window !== "undefined" && (!window.supabase || !window.supabase.createClient)) {
    console.log("Waiting for Supabase SDK CDN / Dynamic loader...");
    await new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.supabase && window.supabase.createClient) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
    });
  }

  client = getSupabase();
  if (!client) {
    console.error("❌ CRITICAL: Supabase client SDK could not be initialized from CDN or module.");
  }
  return client;
}

/**
 * Update the Supabase Publishable Key at runtime and reinitialize client
 */
function setSupabaseKey(newKey) {
  if (newKey && newKey.trim()) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("CYBER_VAULT_SUPABASE_KEY", newKey.trim());
    }
    if (typeof window !== "undefined" && window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, newKey.trim());
    }
    return true;
  }
  return false;
}

/**
 * Authenticate user with Email and Password
 * Uses: supabase.auth.signInWithPassword({ email, password })
 */
async function handleLogin(email, password) {
  const client = await ensureSupabaseClient();
  if (!client) {
    throw new Error("Supabase client is not initialized.");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password
  });

  if (error) {
    console.error("SUPABASE LOGIN ERROR:", error);
    throw error;
  }

  console.log("SUPABASE LOGIN SUCCESS:", data);
  return data;
}

/**
 * Register a new Cyber Vault researcher
 * Uses: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
 */
async function handleRegister(fullName, email, password) {
  const client = await ensureSupabaseClient();
  if (!client) {
    throw new Error("Supabase client is not initialized.");
  }

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password: password,
    options: {
      data: {
        full_name: fullName.trim(),
        role: "researcher",
        project: "Cyber Vault Intelligence Lab"
      }
    }
  });

  if (error) {
    console.error("SUPABASE SIGNUP ERROR:", error);
    throw error;
  }

  console.log("SUPABASE SIGNUP SUCCESS:", data);
  return data;
}

/**
 * Sign out current user
 * Uses: supabase.auth.signOut()
 */
async function handleLogout() {
  const client = await ensureSupabaseClient();
  if (!client) return { error: null };

  const { error } = await client.auth.signOut();
  return { error };
}

/**
 * Get current authenticated user session
 * Uses: supabase.auth.getSession()
 */
async function getCurrentSession() {
  const client = await ensureSupabaseClient();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      console.warn("Session check error:", error.message);
      return null;
    }
    return session;
  } catch (err) {
    console.warn("Could not retrieve session:", err);
    return null;
  }
}

/**
 * Get current authenticated user object
 */
async function getCurrentUser() {
  const session = await getCurrentSession();
  return session ? session.user : null;
}

/**
 * Subscribe to Auth State changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
 * Uses: supabase.auth.onAuthStateChange()
 */
async function onAuthStateChange(callback) {
  const client = await ensureSupabaseClient();
  if (!client) return null;

  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Save an Analysis Result into Supabase `analysis_results` table
 */
async function saveAnalysisResult(record) {
  const client = await ensureSupabaseClient();
  if (!client) return { error: "Supabase client not available" };

  try {
    const user = await getCurrentUser();
    const payload = {
      user_id: user ? user.id : null,
      filename: record.filename || "unknown_sample",
      file_type: record.file_type || "memory",
      classification: record.classification || "malicious",
      confidence: record.confidence || 0,
      malware_family: record.malware_family || record.family || "UNKNOWN",
      file_size: record.file_size || record.size || "0 KB",
      pipeline: record.pipeline || "",
      distribution: record.distribution || {},
      created_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("analysis_results")
      .insert([payload])
      .select();

    const userId = user ? user.id : (record.userId || record.user_id || null);
    if (userId) {
      saveToLocalUserHistory(userId, payload);
    }
    return { data, error: null };
  } catch (e) {
    console.warn("Exception saving analysis result:", e);
    const userId = record.userId || record.user_id || null;
    if (userId) {
      saveToLocalUserHistory(userId, record);
    }
    return { error: e.message };
  }
}

/**
 * Fetch Analysis History for a user from Supabase (Strict User Isolation)
 */
async function fetchUserHistory(userId = null) {
  if (!userId) return []; // Never return global data if user is not authenticated

  const client = await ensureSupabaseClient();
  let onlineRecords = [];

  if (client) {
    try {
      let query = client
        .from("analysis_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        onlineRecords = data;
      }
    } catch (e) {
      console.warn("Error fetching history from Supabase:", e);
    }
  }

  const localRecords = getLocalUserHistory(userId);
  const merged = [...onlineRecords];

  for (const loc of localRecords) {
    if (!merged.some(r => (r.id && loc.id && r.id === loc.id) || (r.created_at === loc.created_at && r.filename === loc.filename))) {
      merged.push(loc);
    }
  }

  return merged;
}

/**
 * User-isolated LocalStorage Fallback for history caching
 */
function saveToLocalUserHistory(userId, record) {
  if (!userId || !record) return;
  try {
    const list = getLocalUserHistory(userId);
    list.unshift(record);
    if (list.length > 50) list.pop();
    localStorage.setItem(`cv_user_data_${userId}`, JSON.stringify(list));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

function getLocalUserHistory(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`cv_user_data_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Automatically initialize immediately
if (typeof window !== "undefined") {
  getSupabase();
}

// Expose on window for global browser usage
window.CyberVaultSupabase = {
  getSupabase,
  ensureSupabaseClient,
  setSupabaseKey,
  handleLogin,
  handleRegister,
  handleLogout,
  getCurrentSession,
  getCurrentUser,
  onAuthStateChange,
  saveAnalysisResult,
  fetchUserHistory,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
};
