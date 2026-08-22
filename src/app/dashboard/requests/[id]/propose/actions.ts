'use server'

import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyUser, getRecipientEmail, buildRequestJourneyEmailHtml } from '@/lib/notifications'
import type { AlertType } from '@/lib/notifications'
import { checkBookingConflicts, describeConflict } from '@/lib/booking-conflicts'

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(year, month - 1, day),
  )
}

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

/**
 * Pre-flight conflict check for a suggested alternate time. Proposing a slot
 * the musician is already booked for (or has blocked out) just wastes a round
 * trip — the accept action would refuse it anyway — so it is caught here,
 * while the person can still pick a different time.
 *
 * Returns a message to show, or null when the slot is free.
 */
export async function checkProposalConflictAction(
  requestId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<string | null> {
  await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: request } = await supabase
    .from('requests')
    .select('musician_id')
    .eq('id', requestId)
    .maybeSingle()

  if (!request?.musician_id) return null

  const result = await checkBookingConflicts({
    musicianId: request.musician_id,
    date,
    startTime,
    endTime,
    excludeRequestId: requestId,
  })

  return describeConflict(result)
}

/**
 * "An alternate time was proposed" — the reschedule step had no notification
 * at all before this, so the other party only found out by happening to
 * check the dashboard.
 */
export async function notifyProposalSuggestedAction(requestId: string) {
  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: request } = await supabase
    .from('requests')
    .select('id, musician_id, center_location_id, requested_date, requested_start_time, requested_end_time')
    .eq('id', requestId)
    .maybeSingle()

  if (!request) return

  const [musicianResult, locationResult] = await Promise.all([
    request.musician_id
      ? supabase.from('musicians').select('user_id, name').eq('id', request.musician_id).maybeSingle()
      : Promise.resolve({ data: null }),
    request.center_location_id
      ? supabase.from('center_locations').select('name, center_id').eq('id', request.center_location_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const musician = musicianResult.data
  const location = locationResult.data
  const { data: center } = location
    ? await supabase.from('centers').select('user_id, name').eq('id', location.center_id).maybeSingle()
    : { data: null }

  const proposerIsMusician = musician?.user_id === user.id
  const otherUserId = proposerIsMusician ? center?.user_id : musician?.user_id
  if (!otherUserId || otherUserId === user.id) return

  const proposerName = proposerIsMusician ? musician?.name : center?.name
  const dateStr = request.requested_date ? formatDateLabel(request.requested_date) : 'TBD'
  const timeStr =
    request.requested_start_time && request.requested_end_time
      ? `${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)}`
      : 'TBD'

  const otherUserEmail = await getRecipientEmail(otherUserId)
  const body = `Hi,\n\n${proposerName ?? 'The other side'} proposed a new time for your performance request: ${dateStr} at ${timeStr}.\n\nReview and respond from your dashboard.\n\n— Margaret's MemoryCare Music`

  await notifyUser({
    userId: otherUserId,
    alertType: 'proposal_suggested' as AlertType,
    title: 'Alternate Time Proposed',
    message: `${proposerName ?? 'The other side'} proposed a new time: ${dateStr} at ${timeStr}.`,
    recipientEmail: otherUserEmail,
    subject: 'Alternate Time Proposed — Margaret\'s MemoryCare Music',
    body,
    html: buildRequestJourneyEmailHtml(body, 'sent'),
    relatedRequestId: requestId,
    // The proposal_suggested_trigger DB trigger already inserts the in-app
    // alert for this event — this call only needs to handle the email.
    skipInAppAlert: true,
  })
}
