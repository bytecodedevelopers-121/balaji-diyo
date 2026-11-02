// ══════════════════════════════════════════════════════════════════════════════
// Supabase config — commented out; local disk storage is now used instead.
// Kept for future reference if Supabase is re-enabled.
// ══════════════════════════════════════════════════════════════════════════════
/*
import { createClient } from "@supabase/supabase-js";
import env from "./env";

export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const STORAGE_BUCKET_PRIVATE = "hrms-files";
export const SIGNED_URL_EXPIRY = 3600; // 1 hour
*/
