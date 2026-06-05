import { createClient } from '@supabase/supabase-js';

const urlEnv = import.meta.env.VITE_SUPABASE_URL;
const keyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(urlEnv && urlEnv !== 'undefined') && Boolean(keyEnv && keyEnv !== 'undefined');

const supabaseUrl = urlEnv || 'https://placeholder.supabase.co';
const supabaseAnonKey = keyEnv || 'placeholder';

if (!isSupabaseConfigured) {
  console.warn("⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing!");
  console.warn("If hosting on Netlify/Vercel, please ensure you have added these in Site Settings > Environment Variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
