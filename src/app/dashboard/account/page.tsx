import Link from 'next/link'
import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOwnProfilePhotoUrl, profileTableForRole } from '@/lib/mmm/profile-photo-server'
import { AccountSettingsForm } from './account-settings-form'
import { ProfilePhotoSection } from './profile-photo-section'

// Edit-profile wizard per role — same 5-step flow as registration, opened at
// step 2 and prefilled from what's already saved (see /onboarding/*).
const EDIT_PROFILE_HREF: Record<string, string> = {
  musician: '/onboarding/musician',
  center_coordinator: '/onboarding/center',
}

export default async function AccountSettingsPage() {
  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: userRow } = await supabase
    .from('users')
    .select('role, email_notifications_enabled')
    .eq('id', user.id)
    .maybeSingle()


  const emailNotificationsEnabled = userRow?.email_notifications_enabled ?? true

  // Admins have no profile row of their own, so they get no photo section.
  const photoTable = profileTableForRole(userRow?.role ?? null)
  const photoUrl = photoTable ? await getOwnProfilePhotoUrl(userRow?.role ?? null) : null
  const editProfileHref = userRow?.role ? EDIT_PROFILE_HREF[userRow.role] : undefined

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Account Settings</h1>
      <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">{user.email}</p>

      {photoTable && (
        <div className="mt-8">
          <ProfilePhotoSection table={photoTable} initialUrl={photoUrl} />
        </div>
      )}

      {editProfileHref && (
        <div className="mt-8 rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6">
          <h2 className="font-garamond text-lg font-bold text-ocean-900">Profile Details</h2>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            Update your phone number, address, and everything else you filled in during registration.
          </p>
          <Link
            href={editProfileHref}
            className="mt-4 inline-block rounded-lg bg-ocean-800 px-5 py-2.5 font-poppins text-[12.5px] font-semibold text-white transition hover:bg-ocean-700"
          >
            Edit Profile Details
          </Link>
        </div>
      )}

      <AccountSettingsForm
        userId={user.id}
        emailNotificationsEnabled={emailNotificationsEnabled}
      />
    </div>
  )
}
