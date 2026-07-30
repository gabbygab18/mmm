'use server'

import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export async function updateEmailNotificationsAction(
  userId: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAuthenticatedUser()
  if (user.id !== userId) return { ok: false, error: 'Unauthorized' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('users')
    .update({ email_notifications_enabled: enabled })
    .eq('id', userId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteAccountAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAuthenticatedUser()
  if (user.id !== userId) return { ok: false, error: 'Unauthorized' }

  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const activeStatuses = ['initiated', 'matched', 'accepted']

  // ── Musician cleanup ───────────────────────────────────────────────────
  const { data: musician } = await supabase
    .from('musicians')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (musician) {
    // Cancel active requests and record history
    const { data: activeRequests } = await supabase
      .from('requests')
      .select('id, status')
      .eq('musician_id', musician.id)
      .in('status', activeStatuses)

    if (activeRequests && activeRequests.length > 0) {
      await supabase
        .from('requests')
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('musician_id', musician.id)
        .in('status', activeStatuses)

      await supabase.from('request_status_history').insert(
        activeRequests.map((req) => ({
          request_id: req.id,
          old_status: req.status,
          new_status: 'cancelled',
          changed_by_user_id: userId,
          reason: 'Account deleted',
        }))
      )
    }

    // Remove availability slots
    await supabase
      .from('musician_availability_dates')
      .delete()
      .eq('musician_id', musician.id)

    // Anonymize profile (name + zip_code are NOT NULL — use placeholders)
    await supabase
      .from('musicians')
      .update({
        name: 'Deleted Account',
        zip_code: '00000',
        phone: null,
        bio: null,
        profile_image_url: null,
        youtube_channel_url: null,
        profile_complete: false,
        approved: false,
        deleted_at: now,
      })
      .eq('id', musician.id)
  }

  // ── Center cleanup ─────────────────────────────────────────────────────
  const { data: center } = await supabase
    .from('centers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (center) {
    // Find all location IDs owned by this center
    const { data: locations } = await supabase
      .from('center_locations')
      .select('id')
      .eq('center_id', center.id)

    const locationIds = (locations ?? []).map((l) => l.id)

    if (locationIds.length > 0) {
      // Cancel active requests across all locations
      const { data: activeRequests } = await supabase
        .from('requests')
        .select('id, status')
        .in('center_location_id', locationIds)
        .in('status', activeStatuses)

      if (activeRequests && activeRequests.length > 0) {
        await supabase
          .from('requests')
          .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
          .in('center_location_id', locationIds)
          .in('status', activeStatuses)

        await supabase.from('request_status_history').insert(
          activeRequests.map((req) => ({
            request_id: req.id,
            old_status: req.status,
            new_status: 'cancelled',
            changed_by_user_id: userId,
            reason: 'Account deleted',
          }))
        )
      }
    }

    // Anonymize center profile
    await supabase
      .from('centers')
      .update({
        name: 'Deleted Account',
        phone: null,
        profile_image_url: null,
        profile_complete: false,
        approved: false,
        deleted_at: now,
      })
      .eq('id', center.id)
  }

  // ── Remove in-app alerts ───────────────────────────────────────────────
  await supabase.from('alerts').delete().eq('user_id', userId)

  // ── Retire the sign-in account ─────────────────────────────────────────
  // The profile rows stay (anonymised) because completed events reference them
  // — a hard delete cascades through musicians/centers into `requests` and
  // takes the event history with it.
  //
  // So the auth account is retired instead: the address is released so the
  // person can register again, and the account is banned so the old password
  // can never sign in. Without this the session stayed valid and the redirect
  // below simply bounced back to the dashboard.
  try {
    const admin = createSupabaseAdminClient()
    const { error: retireError } = await admin.auth.admin.updateUserById(userId, {
      email: `deleted-${userId}@deleted.invalid`,
      ban_duration: '876000h', // ~100 years
      user_metadata: { deleted_at: now },
    })
    if (retireError) {
      console.error('[deleteAccountAction] could not retire auth account:', retireError.message)
      return { ok: false, error: 'Your data was removed, but the sign-in account could not be closed. Please contact support.' }
    }
  } catch (e) {
    console.error('[deleteAccountAction] admin client unavailable:', e)
    return { ok: false, error: 'Your data was removed, but the sign-in account could not be closed. Please contact support.' }
  }

  // The caller signs out and navigates — a redirect from here would keep the
  // stale session cookie, and the middleware would send them back to /dashboard.
  return { ok: true }
}
