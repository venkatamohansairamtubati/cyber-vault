import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ayxiwzuyzopdnpozajwq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WhkvSflQYxwCH1bjNv0oKw_k4rd5ZW0";

async function testConnection() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const { data, error } = await supabase.auth.getSession();

  console.log({
    connected: !error,
    hasSession: !!data?.session,
    error: error?.message
  });
}

testConnection();
