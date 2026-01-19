import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side env vars (not exposed to browser)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Browser-side env vars (NEXT_PUBLIC_ prefix)
const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client with service key for admin operations
// Returns null if env vars are not set (e.g., during build)
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey)
    : null;

// Browser-side Supabase client for authentication
// Uses anon key - safe to expose to browser
export const supabase: SupabaseClient | null =
  supabasePublicUrl && supabaseAnonKey
    ? createClient(supabasePublicUrl, supabaseAnonKey)
    : null;
