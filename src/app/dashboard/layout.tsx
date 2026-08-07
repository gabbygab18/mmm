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

  return (
    <AuthGuardShell
      role={role}
      avatarUrl={avatarUrl}
      photoTable={profileTableForRole(role)}
      unreadAlertCount={unreadAlertCount ?? 0}
    >
      {children}
    </AuthGuardShell>
  )
}
