import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Double-booking / availability guards for the request workflow.
 *
 * Nothing used to check any of this: a musician could accept two overlapping
 * requests, and a facility could request a window the musician had already
 * committed to elsewhere or explicitly blocked out. The checks live here so
 * the request form and the accept action apply exactly the same rules — the
 * accept path being the authoritative one, since that is the moment a booking
 * actually becomes a commitment.
 *
 * Deliberately free/busy: a conflict reports the clashing time window but never
 * which facility owns it, so checking availability cannot be used to enumerate
 * a musician's other engagements.
 */

export type BookingConflict = {
  startTime: string
  endTime: string
}

export type ConflictCheck =
  | { kind: 'ok' }
  | { kind: 'date_blocked' }
  | { kind: 'overlap'; conflicts: BookingConflict[] }

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

/** Human-readable reason, or null when there is no conflict. */
export function describeConflict(result: ConflictCheck): string | null {
  if (result.kind === 'ok') return null
  if (result.kind === 'date_blocked') {
    return 'The musician has marked that date as unavailable. Please choose another date.'
  }
  const windows = result.conflicts
    .map((c) => `${formatTimeLabel(c.startTime)}–${formatTimeLabel(c.endTime)}`)
    .join(', ')
  return `That time overlaps a performance the musician has already committed to (${windows}). Please choose a different time.`
}

/**
 * Service-role on purpose: the conflicting booking usually belongs to a
 * different facility, which the requesting user has no RLS access to. The
 * underlying SQL functions are security definer for the same reason and return
 * times only, so widening visibility here does not widen what the caller learns.
 */
export async function checkBookingConflicts({
  musicianId,
  date,
  startTime,
  endTime,
  excludeRequestId,
}: {
  musicianId: string
  date: string
  startTime: string
  endTime: string
  /** The request being accepted — it must not count as a conflict with itself. */
  excludeRequestId?: string
}): Promise<ConflictCheck> {
  const supabase = createSupabaseAdminClient()

  const { data: blocked, error: blockedError } = await supabase.rpc('is_musician_date_blocked', {
    p_musician_id: musicianId,
    p_date: date,
  })

  if (blockedError) {
    console.error('[checkBookingConflicts] is_musician_date_blocked failed:', blockedError)
  } else if (blocked === true) {
    return { kind: 'date_blocked' }
  }

  const { data, error } = await supabase.rpc('find_booking_conflicts', {
    p_musician_id: musicianId,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_exclude_request_id: excludeRequestId ?? null,
  })

  if (error) {
    // Fail open rather than blocking a legitimate booking on an infrastructure
    // error — the alternative is a musician unable to accept anything at all
    // because a helper function is momentarily unreachable.
    console.error('[checkBookingConflicts] find_booking_conflicts failed:', error)
    return { kind: 'ok' }
  }

  const conflicts = (data ?? []) as { conflict_start_time: string; conflict_end_time: string }[]
  if (conflicts.length === 0) return { kind: 'ok' }

  return {
    kind: 'overlap',
    conflicts: conflicts.map((row) => ({
      startTime: row.conflict_start_time,
      endTime: row.conflict_end_time,
    })),
  }
}
