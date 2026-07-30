import { ReactNode } from 'react'
import { AuthGuardShell } from '@/components/auth-guard-shell'
import { getCurrentUserRole } from '@/lib/auth'
import { getOwnProfilePhotoUrl, profileTableForRole } from '@/lib/mmm/profile-photo-server'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentUserRole()
  const avatarUrl = await getOwnProfilePhotoUrl(role)
  return (
    <AuthGuardShell role={role} avatarUrl={avatarUrl} photoTable={profileTableForRole(role)}>
      {children}
    </AuthGuardShell>
  )
}
