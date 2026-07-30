'use client'

import { MusicianWizard } from '@/components/mmm/musician-wizard'

/**
 * Finish setting up a musician profile after the account already exists —
 * someone who signed up through Get Started / Sign In rather than the
 * registration wizard.
 *
 * Same 5-step flow as /register/musician, opened at step 2 with step 1 already
 * ticked and prefilled from the account and any saved profile. Step 5 writes
 * straight to the musicians row (no signup to do).
 */

export default function MusicianOnboardingPage() {
  return <MusicianWizard mode="onboarding" />
}
