import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AppRole = 'musician' | 'center_coordinator' | 'admin'

const getAuthenticatedUserMaybe = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[getAuthenticatedUserMaybe] Auth error:', error.message)
    return null
  }

  return user
})

const getRoleLookupByUserId = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[getCurrentUserRole] DB error:', error.message)
    return { role: null, hadError: true }
  }

  return { role: data?.role ?? null, hadError: false }
})

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUserMaybe()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getCurrentUserRole() {
  const user = await requireAuthenticatedUser()
  const { role, hadError } = await getRoleLookupByUserId(user.id)

  if (hadError) {
    notFound()
  }

  if (!role) {
    // Row missing — redirect to onboarding selector (not /signup which middleware bounces back to /dashboard)
    redirect('/onboarding')
  }

  return role as AppRole
}
