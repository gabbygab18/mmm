import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Stable "Volunteer Musicians" nav target — the real discover page lives per
 * location (`/dashboard/center/locations/[id]/discover`), so this resolves
 * the signed-in center's first location and forwards there. Multi-location
 * centers still pick a specific location from the dashboard's location cards;
 * this only covers the common single-location case the sidebar link needs.
 */
export default async function CenterDiscoverRedirectPage() {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: center } = await supabase
    .from('centers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: location } = center
    ? await supabase
        .from('center_locations')
        .select('id')
        .eq('center_id', center.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
    : { data: null }

  if (!location) redirect('/dashboard/center')
  redirect(`/dashboard/center/locations/${location.id}/discover`)
}
