import { ReactNode } from 'react'
import { AuthGuardShell } from '@/components/auth-guard-shell'
import { getCurrentUserRole } from '@/lib/auth'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const role = await getCurrentUserRole()
  return <AuthGuardShell role={role}>{children}</AuthGuardShell>
}
