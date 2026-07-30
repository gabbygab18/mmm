import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOwnProfilePhotoUrl, profileTableForRole } from '@/lib/mmm/profile-photo-server'
import { AccountSettingsForm } from './account-settings-form'
import { ProfilePhotoSection } from './profile-photo-section'

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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900">Account Settings</h1>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>

      {photoTable && (
        <div className="mt-8">
          <ProfilePhotoSection table={photoTable} initialUrl={photoUrl} />
        </div>
      )}

      <AccountSettingsForm
        userId={user.id}
        emailNotificationsEnabled={emailNotificationsEnabled}
      />
    </div>
  )
}
