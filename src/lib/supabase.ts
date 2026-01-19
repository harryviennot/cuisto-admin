import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side env vars (not exposed to browser)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Browser-side env vars (NEXT_PUBLIC_ prefix)
const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log missing env vars for debugging
function logMissingEnvVars() {
  const missing: string[] = [];

  if (!supabasePublicUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  // Only check server-side vars if we're on the server
  if (typeof window === "undefined") {
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!supabaseSecretKey) missing.push("SUPABASE_SECRET_KEY");
  }

  if (missing.length > 0) {
    console.error(
      `[Supabase] Missing environment variables: ${missing.join(", ")}\n` +
      `For NEXT_PUBLIC_* vars, ensure they are passed as Docker build args.\n` +
      `For server-side vars, ensure they are set as runtime environment variables.`
    );
  }

  return missing;
}

logMissingEnvVars();

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

// Helper to get descriptive error for missing config
export function getSupabaseError(): string | null {
  if (!supabasePublicUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabasePublicUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return `Supabase not configured. Missing: ${missing.join(", ")}. These must be passed as Docker build args.`;
  }
  return null;
}
