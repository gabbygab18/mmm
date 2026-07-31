import { createClient } from '@supabase/supabase-js'

/**
 * Cookie-free Supabase client for reading public tables.
 *
 * The cookie-backed server client touches `cookies()`, and any page that does
 * opts out of static rendering. The marketing pages only need to read
 * `site_content` / `site_options`, both of which are public-read, so they use
 * this instead and stay prerendered — the copy is baked in at build time, and
 * the admin's revalidatePath call regenerates the page when it changes.
 *
 * Reads only. Anything that writes needs the caller's session, so it must go
 * through createSupabaseServerClient and the admin RLS policies.
 */
export function createSupabasePublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
