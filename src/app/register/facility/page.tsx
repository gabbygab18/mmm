import { FacilityWizard } from '@/components/mmm/facility-wizard'
import { getSiteOptionLists } from '@/lib/mmm/site-options'

/**
 * Facility Registration — 5-step wizard (approved design pack, July 2026):
 * 1 Create Account · 2 Facility Information · 3 Activities Director ·
 * 4 Scheduling Preferences · 5 Complete → Thank-you screen.
 *
 * On completion the account is created through Supabase auth with role
 * `center_coordinator`; every answer is written to user metadata under
 * `registration`, which the database trigger reads to populate the centers and
 * center_locations rows.
 *
 * Someone who already made an account through Get Started / Sign In continues
 * the same wizard from step 2 at /onboarding/center — see FacilityWizard.
 */

export default async function FacilityRegistrationPage() {
  const optionLists = await getSiteOptionLists()
  return <FacilityWizard mode="register" optionLists={optionLists} />
}
