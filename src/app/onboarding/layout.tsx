import { ReactNode } from 'react'
import { requireAuthenticatedUser } from '@/lib/auth'

/**
 * Onboarding is the registration wizard continued — /onboarding/musician and
 * /onboarding/center render the same full-bleed pages as /register/*, with
 * their own marketing header, hero and footer.
 *
 * So this layout adds no chrome of its own; it only keeps the routes behind a
 * session. It used to wrap them in either the dashboard shell or a narrow
 * max-w-3xl card, which double-headed the wizard and squeezed it into a column.
 */

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser()
  return <>{children}</>
}
