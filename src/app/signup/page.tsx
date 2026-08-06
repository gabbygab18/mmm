import { redirect } from 'next/navigation'

/**
 * Retired — there used to be two separate registration entry points
 * (/get-started's full wizard, and this page's bare-account-then-onboard
 * flow). Consolidated to one clearly defined route per UX feedback: any
 * remaining link or bookmark to /signup lands on /get-started instead.
 */
export default function SignupRedirectPage() {
  redirect('/get-started')
}
