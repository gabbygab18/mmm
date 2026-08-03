'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { notifyUser, getRecipientEmail } from '@/lib/notifications'

/**
 * Approve / disable an account, shared by the Musicians and Facilities screens.
 *
 * `approved` is the same column the all-in-one console has always toggled, so
 * the two screens and the oversight page stay in agreement — this is a second
 * door onto one switch, not a second switch.
 */
async function setApproved(table: 'musicians' | 'centers', id: string, approved: boolean) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return

  const supabase = await createSupabaseServerClient()

  const { data: before } = await supabase.from(table).select('user_id, name, approved').eq('id', id).maybeSingle()

  await supabase.from(table).update({ approved }).eq('id', id)

  // Only the false → true transition is a fresh approval worth an email —
  // re-saving an already-approved row, or disabling one, should stay silent.
  if (approved && before && !before.approved && before.user_id) {
    const isMusician = table === 'musicians'
    const name = before.name || 'there'
    const recipientEmail = await getRecipientEmail(before.user_id)

    await notifyUser({
      userId: before.user_id,
      alertType: 'account_approved',
      title: 'Your account has been approved!',
      message: isMusician
        ? "You're approved! Facilities near you can now find you and send performance requests."
        : "You're approved! Musicians near you can now find you and send performance offers.",
      recipientEmail,
      subject: "You're approved — welcome to Margaret's MemoryCare Music",
      body: isMusician
        ? `Hi ${name},\n\nGreat news — your musician account has been approved by our team. Facilities near you can now discover your profile and send you performance requests.\n\nSign in to your dashboard to review your availability and get ready for your first request:\nhttps://margaretsmusicmemorycare.org/dashboard\n\nThank you for volunteering your time and talent.\n\n— Margaret's MemoryCare Music`
        : `Hi ${name},\n\nGreat news — your facility account has been approved by our team. Volunteer musicians near you can now discover your community and send performance offers.\n\nSign in to your dashboard to review your details:\nhttps://margaretsmusicmemorycare.org/dashboard\n\nThank you for partnering with us to bring live music to your residents.\n\n— Margaret's MemoryCare Music`,
    })
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/musicians')
  revalidatePath('/dashboard/admin/facilities')
  revalidatePath('/dashboard/admin/oversight')
  revalidatePath('/dashboard/admin/reports')
}

export async function toggleMusicianApprovalAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  // The form carries the current state; the button flips it.
  const approved = String(formData.get('approved') ?? '') === 'true'
  if (id) await setApproved('musicians', id, !approved)
}

export async function toggleCenterApprovalAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const approved = String(formData.get('approved') ?? '') === 'true'
  if (id) await setApproved('centers', id, !approved)
}

const ACTIVE_REQUEST_STATUSES = ['initiated', 'matched', 'accepted']

/**
 * Admin-triggered removal of a musician/facility account — same anonymize +
 * retire pattern as the user's own "delete my account" flow (see
 * dashboard/account/actions.ts), just keyed by an admin instead of the owner.
 *
 * Profile rows are anonymised rather than hard-deleted because completed
 * events reference them; the auth account is banned (~100y) and its email
 * released so a hard sign-in block survives even an existing session.
 */
async function removeAccount(table: 'musicians' | 'centers', id: string, userId: string) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return

  const admin = createSupabaseAdminClient()
  const now = new Date().toISOString()

  if (table === 'musicians') {
    const { data: activeRequests } = await admin
      .from('requests')
      .select('id, status')
      .eq('musician_id', id)
      .in('status', ACTIVE_REQUEST_STATUSES)

    if (activeRequests && activeRequests.length > 0) {
      await admin
        .from('requests')
        .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
        .eq('musician_id', id)
        .in('status', ACTIVE_REQUEST_STATUSES)

      await admin.from('request_status_history').insert(
        activeRequests.map((req) => ({
          request_id: req.id,
          old_status: req.status,
          new_status: 'cancelled',
          changed_by_user_id: userId,
          reason: 'Account removed by admin',
        })),
      )
    }

    await admin.from('musician_availability_dates').delete().eq('musician_id', id)

    await admin
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
      .eq('id', id)
  } else {
    const { data: locations } = await admin.from('center_locations').select('id').eq('center_id', id)
    const locationIds = (locations ?? []).map((l) => l.id)

    if (locationIds.length > 0) {
      const { data: activeRequests } = await admin
        .from('requests')
        .select('id, status')
        .in('center_location_id', locationIds)
        .in('status', ACTIVE_REQUEST_STATUSES)

      if (activeRequests && activeRequests.length > 0) {
        await admin
          .from('requests')
          .update({ status: 'cancelled', cancelled_at: now, updated_at: now })
          .in('center_location_id', locationIds)
          .in('status', ACTIVE_REQUEST_STATUSES)

        await admin.from('request_status_history').insert(
          activeRequests.map((req) => ({
            request_id: req.id,
            old_status: req.status,
            new_status: 'cancelled',
            changed_by_user_id: userId,
            reason: 'Account removed by admin',
          })),
        )
      }
    }

    await admin
      .from('centers')
      .update({
        name: 'Deleted Account',
        phone: null,
        profile_image_url: null,
        profile_complete: false,
        approved: false,
        deleted_at: now,
      })
      .eq('id', id)
  }

  await admin.from('alerts').delete().eq('user_id', userId)

  await admin.auth.admin.updateUserById(userId, {
    email: `deleted-${userId}@deleted.invalid`,
    ban_duration: '876000h',
    user_metadata: { deleted_at: now },
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/musicians')
  revalidatePath('/dashboard/admin/facilities')
  revalidatePath('/dashboard/admin/oversight')
  revalidatePath('/dashboard/admin/reports')
  revalidatePath('/dashboard/admin/users')
}

export async function removeMusicianAccountAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const userId = String(formData.get('userId') ?? '')
  if (id && userId) await removeAccount('musicians', id, userId)
}

export async function removeCenterAccountAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const userId = String(formData.get('userId') ?? '')
  if (id && userId) await removeAccount('centers', id, userId)
}
