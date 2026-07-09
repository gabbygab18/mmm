import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/auth'

export default async function OnboardingRouterPage() {
  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: existingUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Row exists — route to the right onboarding form
  if (existingUser?.role === 'musician') {
    redirect('/onboarding/musician')
  }
  if (existingUser?.role === 'center_coordinator') {
    redirect('/onboarding/center')
  }
  if (existingUser?.role === 'admin') {
    redirect('/dashboard/admin')
  }

  // Row is missing — seed it now from auth user metadata then redirect
  const metaRole = user.user_metadata?.role as string | undefined
  const role =
    metaRole === 'musician' || metaRole === 'center_coordinator' ? metaRole : 'musician'

  await supabase.from('users').upsert(
    { id: user.id, role, email: user.email ?? '' },
    { onConflict: 'id' }
  )

  redirect(role === 'musician' ? '/onboarding/musician' : '/onboarding/center')
}
