import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AppRole } from '@/lib/auth'

/**
 * Server-side reads of the signed-in user's profile photo.
 *
 * Musicians keep theirs on `musicians.profile_image_url`, coordinators on
 * `centers.profile_image_url`; admins have no profile row of their own.
 * Uploading lives in src/lib/mmm/profile-photo.ts (client side).
 */

export function profileTableForRole(role: AppRole | string | null): 'musicians' | 'centers' | null {
  if (role === 'musician') return 'musicians'
  if (role === 'center_coordinator') return 'centers'
  return null
}

export const getOwnProfilePhotoUrl = cache(async (role: AppRole | string | null): Promise<string | null> => {
  const table = profileTableForRole(role)
  if (!table) return null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from(table)
    .select('profile_image_url')
    .eq('user_id', user.id)
    .maybeSingle()

  return data?.profile_image_url ?? null
})
