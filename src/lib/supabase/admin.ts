import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client.
 *
 * This client bypasses Row Level Security and can call the GoTrue admin API
 * (`auth.admin.listUsers`, `auth.admin.deleteUser`, …). It must NEVER be
 * imported into a client component or exposed to the browser — the
 * `server-only` import above turns any accidental client import into a build
 * error.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
