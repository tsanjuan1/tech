import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl = "https://vrgtgixpbjyzmuxcdmdi.supabase.co";
const fallbackSupabasePublishableKey =
  "sb_publishable_jHwX7rFekrJ2OMVJ57jLFg_FJD9fpWx";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  fallbackSupabasePublishableKey;

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}

export const supabaseProjectConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
};
