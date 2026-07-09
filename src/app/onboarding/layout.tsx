import { ReactNode } from 'react'
import Link from 'next/link'
import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AuthGuardShell } from '@/components/auth-guard-shell'
import { OnboardingSignOut } from './onboarding-sign-out'

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (userRow?.role as string | undefined) ?? null

  let hasExistingProfile = false

  if (role === 'musician') {
    const { data: musician } = await supabase
      .from('musicians')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasExistingProfile = !!musician
  }

  if (role === 'center_coordinator') {
    const { data: center } = await supabase
      .from('centers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasExistingProfile = !!center
  }

  // Keep first-time onboarding minimal; use full app shell for profile edits.
  if ((role === 'musician' || role === 'center_coordinator') && hasExistingProfile) {
    return <AuthGuardShell role={role}>{children}</AuthGuardShell>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Minimal header: logo + sign out only */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-stone-900">Margaret's MemoryCare Music</span>
          </Link>
          <OnboardingSignOut />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>
    </div>
  )
}

