import { MusicianWizard } from '@/components/mmm/musician-wizard'
import { getSiteOptionLists } from '@/lib/mmm/site-options'

/**
 * Musician Registration — 5-step wizard (approved design):
 * 1 Create Account · 2 Create Profile · 3 Musical Background · 4 Availability ·
 * 5 Agreement → Welcome screen.
 *
 * Someone who already made an account through Get Started / Sign In continues
 * the same wizard from step 2 at /onboarding/musician — see MusicianWizard.
 *
 * The instrument and genre lists are read here, on the server, so an admin's
 * edits under Categories reach the form. The wizard stays a client component
 * and falls back to the built-in lists when nothing is stored.
 */

export default async function MusicianRegistrationPage() {
  const optionLists = await getSiteOptionLists()
  return <MusicianWizard mode="register" optionLists={optionLists} />
}
