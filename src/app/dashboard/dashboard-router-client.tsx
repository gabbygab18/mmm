'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AppRole } from '@/lib/auth'

export function DashboardRouterClient({ role }: { role: AppRole }) {
  const router = useRouter()

  useEffect(() => {
    if (role === 'musician') {
      router.replace('/dashboard/musician')
      return
    }

    if (role === 'center_coordinator') {
      router.replace('/dashboard/center')
      return
    }

    router.replace('/dashboard/admin')
  }, [role, router])

  return null
}
