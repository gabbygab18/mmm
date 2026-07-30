'use client'

import { MusicianWizard } from '@/components/mmm/musician-wizard'

/**
 * Musician Registration — 5-step wizard (approved design):
 * 1 Create Account · 2 Create Profile · 3 Musical Background · 4 Availability ·
 * 5 Agreement → Welcome screen.
 *
 * Someone who already made an account through Get Started / Sign In continues
 * the same wizard from step 2 at /onboarding/musician — see MusicianWizard.
 */

export default function MusicianRegistrationPage() {
  return <MusicianWizard mode="register" />
}
