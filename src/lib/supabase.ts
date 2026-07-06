import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-supabase-project") &&
  !supabaseAnonKey.includes("your-supabase-anon-key");

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase credentials are missing or still using placeholders. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
