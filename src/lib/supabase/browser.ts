import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Singleton — every caller shares one GoTrueClient. Without this, each
 * component that called createBrowserClient() got its own independent auth
 * state with its own onAuthStateChange subscribers. A signUp()/signIn() on
 * one instance (e.g. a registration wizard) never reached another instance's
 * listeners (e.g. MarketingHeader, mounted on page load before the session
 * existed) — the header kept showing "Sign In" after a successful
 * registration until a full reload created a fresh instance that read the
 * now-current session cookies. Sharing one instance means one signIn/signUp
 * broadcasts to every subscriber in the tab, header included.
 */
let client: SupabaseClient | null = null

export function createSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
