import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyUser, getRecipientEmail } from '@/lib/notifications'
import type { AlertType } from '@/lib/notifications'
import { ScheduleCalendar } from './schedule-calendar'

type WorkflowRole = 'musician' | 'center_coordinator'
type WorkflowStatus = 'initiated' | 'matched' | 'accepted' | 'completed' | 'cancelled'

type RequestRow = {
  id: string
  status: WorkflowStatus
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  created_at: string
  musician_id: string | null
  center_location_id: string | null
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

async function updateScheduledStatusAction(formData: FormData) {
  'use server'

  const requestId = String(formData.get('requestId') ?? '')
  const nextStatus = String(formData.get('nextStatus') ?? '') as WorkflowStatus

  if (!requestId || !nextStatus) return

  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator') return

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: requestRow } = await supabase
    .from('requests')
    .select('id, status, musician_id, center_location_id, requested_date, requested_start_time, requested_end_time')
    .eq('id', requestId)
    .maybeSingle()

  if (!requestRow || requestRow.status !== 'accepted') {
    return
  }

  if (nextStatus !== 'completed' && nextStatus !== 'cancelled') {
    return
  }

  const timestamp = new Date().toISOString()
  const updatePayload: Record<string, string> = {
    status: nextStatus,
    updated_at: timestamp,
  }

  if (nextStatus === 'completed') {
    updatePayload.completed_at = timestamp
  }

  if (nextStatus === 'cancelled') {
    updatePayload.cancelled_at = timestamp
  }

  const { error: updateError } = await supabase
    .from('requests')
    .update(updatePayload)
    .eq('id', requestId)

  if (updateError) return

  await supabase.from('request_status_history').insert({
    request_id: requestId,
    old_status: 'accepted',
    new_status: nextStatus,
    changed_by_user_id: user.id,
    reason: null,
  })

  // Sprint 4: Send notifications
  const musicianId = requestRow.musician_id
  const locationId = requestRow.center_location_id

  const { data: musician } = musicianId
    ? await supabase.from('musicians').select('id, user_id, name').eq('id', musicianId).maybeSingle()
    : { data: null }

  const { data: location } = locationId
    ? await supabase.from('center_locations').select('id, name, center_id').eq('id', locationId).maybeSingle()
    : { data: null }

  const { data: center } = location
    ? await supabase.from('centers').select('id, user_id, name').eq('id', location.center_id).maybeSingle()
    : { data: null }

  const otherUserId = role === 'musician' ? center?.user_id : musician?.user_id
  const otherUserEmail = otherUserId ? await getRecipientEmail(otherUserId) : null

  if (otherUserId) {
    const dateStr = requestRow.requested_date ? formatDateLabel(requestRow.requested_date) : 'TBD'
    const timeStr =
      requestRow.requested_start_time && requestRow.requested_end_time
        ? `${formatTimeLabel(requestRow.requested_start_time)} - ${formatTimeLabel(requestRow.requested_end_time)}`
        : 'TBD'
    const participantName = role === 'musician' ? location?.name : musician?.name

    if (nextStatus === 'completed') {
      await notifyUser({
        userId: otherUserId,
        alertType: 'event_completed' as AlertType,
        title: 'Performance Completed ✅',
        message: `The performance with ${participantName} on ${dateStr} has been marked complete.`,
        recipientEmail: otherUserEmail,
        subject: 'Performance Completed',
        body: `The performance with ${participantName} on ${dateStr} at ${timeStr} has been marked complete. Thank you!`,
        relatedRequestId: requestId,
      })
    }

    if (nextStatus === 'cancelled') {
      await notifyUser({
        userId: otherUserId,
        alertType: 'event_cancelled' as AlertType,
        title: 'Performance Cancelled',
        message: `The performance with ${participantName} on ${dateStr} has been cancelled.`,
        recipientEmail: otherUserEmail,
        subject: 'Performance Was Cancelled',
        body: `The performance with ${participantName} on ${dateStr} at ${timeStr} has been cancelled.`,
        relatedRequestId: requestId,
      })
    }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/requests')
}

export default async function SchedulePage() {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  let requests: RequestRow[] = []

  if (role === 'musician') {
    const { data: me } = await supabase.from('musicians').select('id').eq('user_id', user.id).maybeSingle()
    if (me) {
      const { data } = await supabase
        .from('requests')
        .select('id, status, requested_date, requested_start_time, requested_end_time, created_at, musician_id, center_location_id')
        .eq('musician_id', me.id)
        .in('status', ['accepted', 'completed'])
        .order('requested_date', { ascending: true })
      requests = (data as RequestRow[] | null) ?? []
    }
  }

  if (role === 'center_coordinator') {
    const { data: center } = await supabase.from('centers').select('id').eq('user_id', user.id).maybeSingle()
    if (center) {
      const { data: ownLocations } = await supabase.from('center_locations').select('id').eq('center_id', center.id)
      const ownLocationIds = (ownLocations ?? []).map((row) => row.id)
      if (ownLocationIds.length > 0) {
        const { data } = await supabase
          .from('requests')
          .select('id, status, requested_date, requested_start_time, requested_end_time, created_at, musician_id, center_location_id')
          .in('center_location_id', ownLocationIds)
          .in('status', ['accepted', 'completed'])
          .order('requested_date', { ascending: true })
        requests = (data as RequestRow[] | null) ?? []
      }
    }
  }

  const musicianIds = Array.from(new Set(requests.map((row) => row.musician_id).filter(Boolean) as string[]))
  const locationIds = Array.from(new Set(requests.map((row) => row.center_location_id).filter(Boolean) as string[]))

  const { data: musicians } = musicianIds.length
    ? await supabase.from('musicians').select('id, name, zip_code, phone, profile_image_url').in('id', musicianIds)
    : { data: [] as { id: string; name: string; zip_code: string; phone: string | null; profile_image_url: string | null }[] }

  const { data: locations } = locationIds.length
    ? await supabase.from('center_locations').select('id, name, address, phone, center_id, location_image_url').in('id', locationIds)
    : { data: [] as { id: string; name: string; address: string; phone: string | null; center_id: string; location_image_url: string | null }[] }

  const centerIds = Array.from(new Set((locations ?? []).map((row) => row.center_id)))
  const { data: centers } = centerIds.length
    ? await supabase.from('centers').select('id, name, phone, profile_image_url').in('id', centerIds)
    : { data: [] as { id: string; name: string; phone: string | null; profile_image_url: string | null }[] }

  const musicianMap = new Map((musicians ?? []).map((row) => [row.id, row]))
  const locationMap = new Map((locations ?? []).map((row) => [row.id, row]))
  const centerMap = new Map((centers ?? []).map((row) => [row.id, row]))

  const upcoming = requests.filter((row) => row.status === 'accepted')
  const past = requests.filter((row) => row.status === 'completed')
  const calendarEvents = requests
    .filter((row) => row.status === 'accepted' || row.status === 'completed')
    .map((row: any) => {
      const musician = row.musician_id ? musicianMap.get(row.musician_id) : null
      const location = row.center_location_id ? locationMap.get(row.center_location_id) : null
      const center = location ? centerMap.get(location.center_id) : null

      return {
        id: row.id,
        status: row.status as 'accepted' | 'completed',
        requested_date: row.requested_date,
        requested_start_time: row.requested_start_time,
        requested_end_time: row.requested_end_time,
        musician_name: musician?.name ?? 'Musician',
        center_name: center?.name ?? 'Center',
        location_name: location?.name ?? 'Location',
      }
    })

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scheduled Events</h1>
          <p className="mt-1 text-sm text-stone-500">Scheduled engagements live here. Contact details unlock after scheduling.</p>
        </div>
      </div>

      <ScheduleCalendar events={calendarEvents} />

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Upcoming ({upcoming.length})</h2>
        {upcoming.length > 0 ? (
          <ul className="space-y-3">
            {upcoming.map((request) => {
              const musician = request.musician_id ? musicianMap.get(request.musician_id) : null
              const location = request.center_location_id ? locationMap.get(request.center_location_id) : null
              const center = location ? centerMap.get(location.center_id) : null

              return (
                <li key={request.id} className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex flex-shrink-0 items-center -space-x-2">
                      {location?.location_image_url || center?.profile_image_url ? (
                        <img
                          src={location?.location_image_url ?? center?.profile_image_url}
                          alt={location?.name ?? center?.name ?? 'Center location'}
                          className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-brand-100 text-sm font-semibold text-brand-700 shadow-sm">
                          {(center?.name ?? 'C').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {musician?.profile_image_url ? (
                        <img
                          src={musician.profile_image_url}
                          alt={musician.name}
                          className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-stone-100 text-sm font-semibold text-stone-600 shadow-sm">
                          {(musician?.name ?? 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                      <p className="mt-1 text-sm text-stone-700">
                        {formatDateLabel(request.requested_date)}
                        {request.requested_start_time && request.requested_end_time
                          ? ` (${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)})`
                          : ''}
                      </p>

                      <div className="mt-2 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
                        <p><span className="font-medium">Musician:</span> {musician?.name ?? 'Unknown'}{musician?.zip_code ? ` (ZIP ${musician.zip_code})` : ''}</p>
                        <p><span className="font-medium">Location:</span> {location?.address ?? 'Address unavailable'}</p>
                        <p><span className="font-medium">Musician phone:</span> {musician?.phone ?? 'Not provided'}</p>
                        <p><span className="font-medium">Center phone:</span> {location?.phone ?? center?.phone ?? 'Not provided'}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <form action={updateScheduledStatusAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="nextStatus" value="completed" />
                          <button
                            type="submit"
                            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                          >
                            Mark completed
                          </button>
                        </form>
                        <form action={updateScheduledStatusAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="nextStatus" value="cancelled" />
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Cancel event
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">No upcoming scheduled events.</div>
        )}
      </div>

      <details className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-stone-900">Completed history ({past.length})</summary>
        {past.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {past.map((request) => {
              const musician = request.musician_id ? musicianMap.get(request.musician_id) : null
              const location = request.center_location_id ? locationMap.get(request.center_location_id) : null
              const center = location ? centerMap.get(location.center_id) : null
              return (
                <li key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-shrink-0 items-center -space-x-2">
                      {location?.location_image_url || center?.profile_image_url ? (
                        <img
                          src={location?.location_image_url ?? center?.profile_image_url}
                          alt={location?.name ?? center?.name ?? 'Center location'}
                          className="h-9 w-9 rounded-lg border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-brand-100 text-[10px] font-semibold text-brand-700 shadow-sm">
                          {(center?.name ?? 'C').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {musician?.profile_image_url ? (
                        <img
                          src={musician.profile_image_url}
                          alt={musician.name}
                          className="h-9 w-9 rounded-lg border-2 border-white object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-stone-100 text-[10px] font-semibold text-stone-600 shadow-sm">
                          {(musician?.name ?? 'M').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {musician?.name ?? 'Musician'} · {formatDateLabel(request.requested_date)}
                        {request.requested_start_time && request.requested_end_time
                          ? ` (${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)})`
                          : ''}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-400">No completed events yet.</p>
        )}
      </details>
    </section>
  )
}
