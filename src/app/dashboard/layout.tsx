import { ReactNode } from 'react'
import { AuthGuardShell } from '@/components/auth-guard-shell'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { getOwnProfilePhotoUrl, profileTableForRole } from '@/lib/mmm/profile-photo-server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentUserRole()
  const user = await requireAuthenticatedUser()
  const avatarUrl = await getOwnProfilePhotoUrl(role)

  const supabase = await createSupabaseServerClient()
  const { count: unreadAlertCount } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)
    .eq('dismissed', false)

  // Active (still-negotiating) request count, for the badge on the Requests
  // nav item — same "initiated" filter the Requests page itself uses to
  // decide what counts as active vs. archived.
  let pendingRequestCount = 0
  if (role === 'musician') {
    const { data: musician } = await supabase.from('musicians').select('id').eq('user_id', user.id).maybeSingle()
    if (musician) {
      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('musician_id', musician.id)
        .eq('status', 'initiated')
      pendingRequestCount = count ?? 0
    }
  } else if (role === 'center_coordinator') {
    const { data: center } = await supabase.from('centers').select('id').eq('user_id', user.id).maybeSingle()
    if (center) {
      const { data: ownLocations } = await supabase.from('center_locations').select('id').eq('center_id', center.id)
      const ownLocationIds = (ownLocations ?? []).map((row) => row.id)
      if (ownLocationIds.length > 0) {
        const { count } = await supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .in('center_location_id', ownLocationIds)
          .eq('status', 'initiated')
        pendingRequestCount = count ?? 0
      }
    }
  }

  return (
    <AuthGuardShell
      role={role}
      avatarUrl={avatarUrl}
      photoTable={profileTableForRole(role)}
      unreadAlertCount={unreadAlertCount ?? 0}
      pendingRequestCount={pendingRequestCount}
    >
      {children}
    </AuthGuardShell>
  )
}
