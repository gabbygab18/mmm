import { getCurrentUserRole } from '@/lib/auth'
import { DashboardRouterClient } from './dashboard-router-client'

export default async function DashboardRouterPage() {
  const role = await getCurrentUserRole()
  return <DashboardRouterClient role={role} />
}
