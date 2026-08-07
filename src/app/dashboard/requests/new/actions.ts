'use server'

import { requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyUser, getRecipientEmail } from '@/lib/notifications'
import type { AlertType } from '@/lib/notifications'

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
 * "A new request is waiting on you" — fired right after a request is
 * created. Previously nothing notified the other party at all: they'd only
 * find out a request existed by happening to check the dashboard, which is
 * exactly the "not obvious" gap flagged in feedback.
 */
export async function notifyRequestInitiatedAction(requestId: string) {
  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: request } = await supabase
    .from('requests')
    .select('id, initiator_role, musician_id, center_location_id, requested_date, requested_start_time, requested_end_time')
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

  const initiatedByMusician = request.initiator_role === 'musician'
  const otherUserId = initiatedByMusician ? center?.user_id : musician?.user_id
  if (!otherUserId || otherUserId === user.id) return

  const participantName = initiatedByMusician ? musician?.name : center?.name
  const dateStr = request.requested_date ? formatDateLabel(request.requested_date) : 'TBD'
  const timeStr =
    request.requested_start_time && request.requested_end_time
      ? `${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)}`
      : 'TBD'

  const otherUserEmail = await getRecipientEmail(otherUserId)

  await notifyUser({
    userId: otherUserId,
    alertType: 'request_initiated' as AlertType,
    title: 'New Performance Request',
    message: `${participantName ?? 'Someone'} sent a performance request for ${dateStr} at ${timeStr}.`,
    recipientEmail: otherUserEmail,
    subject: 'New Performance Request — Margaret\'s MemoryCare Music',
    body: `Hi,\n\n${participantName ?? 'Someone'} sent you a performance request for ${dateStr} at ${timeStr}.\n\nReview and respond from your dashboard.\n\n— Margaret's MemoryCare Music`,
    relatedRequestId: requestId,
  })
}
