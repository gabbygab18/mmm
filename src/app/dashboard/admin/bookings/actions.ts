'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export type CreateManualBookingResult = { ok: boolean; error?: string }

/**
 * Admin manual matching — creates a request directly between a chosen
 * musician and facility location, bypassing the radius-based discovery
 * that normally decides who can see whom. There's no `requests` INSERT RLS
 * policy for admins (only SELECT/UPDATE), so this goes through the
 * service-role client rather than the caller's own session.
 */
export async function createManualBookingAction(formData: FormData): Promise<CreateManualBookingResult> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return { ok: false, error: 'Not authorized.' }

  const admin = await requireAuthenticatedUser()

  const musicianId = String(formData.get('musicianId') ?? '')
  const centerLocationId = String(formData.get('centerLocationId') ?? '')
  const requestedDate = String(formData.get('requestedDate') ?? '')
  const startTime = String(formData.get('startTime') ?? '')
  const endTime = String(formData.get('endTime') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()

  if (!musicianId || !centerLocationId || !requestedDate || !startTime || !endTime) {
    return { ok: false, error: 'Musician, facility location, date, and start/end time are all required.' }
  }
  if (endTime <= startTime) {
    return { ok: false, error: 'End time must be after start time.' }
  }

  const supabase = createSupabaseAdminClient()

  const { data: insertedRequest, error: insertError } = await supabase
    .from('requests')
    .insert({
      musician_id: musicianId,
      center_location_id: centerLocationId,
      requested_date: requestedDate,
      requested_start_time: startTime,
      requested_end_time: endTime,
      status: 'initiated',
      initiator_role: 'admin',
      notes: notes || null,
    })
    .select('id')
    .single()

  if (insertError || !insertedRequest) {
    return { ok: false, error: insertError?.message ?? 'Failed to create booking.' }
  }

  await supabase.from('request_time_proposals').insert({
    request_id: insertedRequest.id,
    proposed_date: requestedDate,
    proposed_start_time: startTime,
    proposed_end_time: endTime,
    notes: notes || null,
    proposed_by_user_id: admin.id,
    proposal_status: 'pending',
  })

  await supabase.from('request_status_history').insert({
    request_id: insertedRequest.id,
    old_status: null,
    new_status: 'initiated',
    changed_by_user_id: admin.id,
    reason: 'Created manually by admin',
  })

  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/admin/oversight')
  redirect('/dashboard/admin/bookings/new?created=1')
}
