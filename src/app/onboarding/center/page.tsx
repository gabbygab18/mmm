import { FacilityWizard } from '@/components/mmm/facility-wizard'
import { getSiteOptionLists } from '@/lib/mmm/site-options'

/**
 * Finish setting up a community after the account already exists — someone who
 * signed up through Get Started / Sign In rather than the registration wizard.
 *
 * It is the same 5-step flow as /register/facility, opened at step 2 with step 1
 * already ticked, prefilled from the account and from anything already saved.
 * Step 5 writes straight to centers / center_locations (no signup to do).
 */

export default async function CenterOnboardingPage() {
  const optionLists = await getSiteOptionLists()
  return <FacilityWizard mode="onboarding" optionLists={optionLists} />
}
