import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyUser, getRecipientEmail } from '@/lib/notifications'
import type { AlertType } from '@/lib/notifications'

type WorkflowRole = 'musician' | 'center_coordinator'
type WorkflowStatus = 'initiated' | 'matched' | 'accepted' | 'completed' | 'cancelled'

type RequestRow = {
  id: string
  status: WorkflowStatus
  initiator_role: WorkflowRole
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  created_at: string
  notes: string | null
  musician_id: string | null
  center_location_id: string | null
}

type ProposalRow = {
  id: string
  request_id: string
  proposed_date: string
  proposed_start_time: string
  proposed_end_time: string
  notes: string | null
  proposed_by_user_id: string
  proposal_status: string
  created_at: string
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
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

const STATUS_STYLES: Record<string, string> = {
  initiated: 'bg-stone-100 text-stone-700',
  matched: 'bg-stone-100 text-stone-700',
  accepted: 'bg-brand-100 text-brand-800',
  completed: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

function formatStatusLabel(status: WorkflowStatus) {
  if (status === 'accepted') return 'scheduled'
  if (status === 'matched') return 'initiated'
  return status
}

async function updateRequestStatusAction(formData: FormData) {
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
    .select('id, status, initiator_role, musician_id, center_location_id, requested_date, requested_start_time, requested_end_time')
    .eq('id', requestId)
    .maybeSingle()

  if (!requestRow) return

  const currentStatus = requestRow.status as WorkflowStatus

  // Helper to fetch request context for notifications
  const getRequestContext = async () => {
    const musicianId = requestRow.musician_id
    const locationId = requestRow.center_location_id

    const [musicianResult, locationResult] = await Promise.all([
      musicianId
        ? supabase.from('musicians').select('id, user_id, name').eq('id', musicianId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      locationId
        ? supabase.from('center_locations').select('id, name, center_id').eq('id', locationId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    const { data: musician } = musicianResult
    const { data: location } = locationResult

    const { data: center } = location
      ? await supabase.from('centers').select('id, user_id, name').eq('id', location.center_id).maybeSingle()
      : { data: null }

    return {
      musician,
      location,
      center,
      musicianUserId: musician?.user_id,
      centerUserId: center?.user_id,
    }
  }

  const dateStr = requestRow.requested_date ? formatDateLabel(requestRow.requested_date) : 'TBD'
  const timeStr =
    requestRow.requested_start_time && requestRow.requested_end_time
      ? `${formatTimeLabel(requestRow.requested_start_time)} - ${formatTimeLabel(requestRow.requested_end_time)}`
      : 'TBD'

  if (nextStatus === 'accepted') {
    if (currentStatus !== 'initiated') return

    const { data: latestPendingProposal } = await supabase
      .from('request_time_proposals')
      .select('id, proposed_by_user_id')
      .eq('request_id', requestId)
      .eq('proposal_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestPendingProposal && latestPendingProposal.proposed_by_user_id === user.id) {
      return
    }

    const timestamp = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'accepted', accepted_at: timestamp, updated_at: timestamp })
      .eq('id', requestId)

    if (updateError) return

    const { data: latestProposalForAdoption } = await supabase
      .from('request_time_proposals')
      .select('id, proposed_date, proposed_start_time, proposed_end_time')
      .eq('request_id', requestId)
      .eq('proposal_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestProposalForAdoption) {
      await supabase
        .from('request_time_proposals')
        .update({ proposal_status: 'superseded' })
        .eq('request_id', requestId)
        .eq('proposal_status', 'pending')
        .neq('id', latestProposalForAdoption.id)

      await supabase
        .from('request_time_proposals')
        .update({ proposal_status: 'accepted' })
        .eq('id', latestProposalForAdoption.id)

      await supabase
        .from('requests')
        .update({
          requested_date: latestProposalForAdoption.proposed_date,
          requested_start_time: latestProposalForAdoption.proposed_start_time,
          requested_end_time: latestProposalForAdoption.proposed_end_time,
        })
        .eq('id', requestId)
    }

    await supabase.from('request_status_history').insert({
      request_id: requestId,
      old_status: currentStatus,
      new_status: 'accepted',
      changed_by_user_id: user.id,
      reason: null,
    })

    // Sprint 4: Send notifications
    const ctx = await getRequestContext()
    const otherUserId = role === 'musician' ? ctx.centerUserId : ctx.musicianUserId
    const otherUserEmail = otherUserId ? await getRecipientEmail(otherUserId) : null

    if (otherUserId) {
      const participantName = role === 'musician' ? ctx.location?.name : ctx.musician?.name

      await notifyUser({
        userId: otherUserId,
        alertType: 'request_accepted' as AlertType,
        title: 'Event Scheduled! 🎉',
        message: `Your request with ${participantName} for ${dateStr} at ${timeStr} is now scheduled.`,
        recipientEmail: otherUserEmail,
        subject: 'Your Performance Was Scheduled',
        body: `Great news! Your request with ${participantName} for ${dateStr} at ${timeStr} is now scheduled. Check your dashboard for details and next steps.`,
        relatedRequestId: requestId,
      })
    }

    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/schedule')
    return
  }

  if (nextStatus === 'cancelled') {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return

    const timestamp = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'cancelled', cancelled_at: timestamp, updated_at: timestamp })
      .eq('id', requestId)

    if (updateError) return

    await supabase.from('request_status_history').insert({
      request_id: requestId,
      old_status: currentStatus,
      new_status: 'cancelled',
      changed_by_user_id: user.id,
      reason: null,
    })

    // Sprint 4: Send notifications
    const ctx = await getRequestContext()
    const otherUserId = role === 'musician' ? ctx.centerUserId : ctx.musicianUserId
    const otherUserEmail = otherUserId ? await getRecipientEmail(otherUserId) : null

    if (otherUserId) {
      const participantName = role === 'musician' ? ctx.location?.name : ctx.musician?.name
      const isScheduledEventCancellation = currentStatus === 'accepted'
      const alertType = isScheduledEventCancellation ? 'event_cancelled' : 'request_cancelled'
      const title = isScheduledEventCancellation ? 'Performance Cancelled' : 'Request Cancelled'
      const subject = isScheduledEventCancellation ? 'Performance Was Cancelled' : 'Performance Request Was Cancelled'
      const message = isScheduledEventCancellation
        ? `The performance with ${participantName} on ${dateStr} has been cancelled.`
        : `A request with ${participantName} for ${dateStr} has been cancelled.`

      await notifyUser({
        userId: otherUserId,
        alertType: alertType as AlertType,
        title,
        message,
        recipientEmail: otherUserEmail,
        subject,
        body: message,
        relatedRequestId: requestId,
      })
    }

    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/schedule')
  }
}

export default async function RequestsPage() {
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
        .select('id, status, initiator_role, requested_date, requested_start_time, requested_end_time, created_at, notes, musician_id, center_location_id')
        .eq('musician_id', me.id)
        .order('created_at', { ascending: false })
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
          .select('id, status, initiator_role, requested_date, requested_start_time, requested_end_time, created_at, notes, musician_id, center_location_id')
          .in('center_location_id', ownLocationIds)
          .order('created_at', { ascending: false })
        requests = (data as RequestRow[] | null) ?? []
      }
    }
  }

  const requestIds = requests.map((row) => row.id)
  const musicianIds = Array.from(new Set(requests.map((row) => row.musician_id).filter(Boolean) as string[]))
  const locationIds = Array.from(new Set(requests.map((row) => row.center_location_id).filter(Boolean) as string[]))

  const [musiciansResult, locationsResult, proposalsResult] = await Promise.all([
    musicianIds.length
      ? supabase.from('musicians').select('id, user_id, name, zip_code, profile_image_url').in('id', musicianIds)
      : Promise.resolve({ data: [] as { id: string; user_id: string; name: string; zip_code: string; profile_image_url: string | null }[] }),
    locationIds.length
      ? supabase.from('center_locations').select('id, name, center_id, location_image_url').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string; center_id: string; location_image_url: string | null }[] }),
    requestIds.length
      ? supabase
          .from('request_time_proposals')
          .select('id, request_id, proposed_date, proposed_start_time, proposed_end_time, notes, proposed_by_user_id, proposal_status, created_at')
          .in('request_id', requestIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as ProposalRow[] }),
  ])

  const { data: musicians } = musiciansResult
  const { data: locations } = locationsResult
  const { data: proposals } = proposalsResult

  const centerIds = Array.from(new Set((locations ?? []).map((row) => row.center_id)))
  const { data: centers } = centerIds.length
    ? await supabase.from('centers').select('id, user_id, name, profile_image_url').in('id', centerIds)
    : { data: [] as { id: string; user_id: string; name: string; profile_image_url: string | null }[] }

  const musicianMap = new Map((musicians ?? []).map((row) => [row.id, row]))
  const locationMap = new Map((locations ?? []).map((row) => [row.id, row]))
  const centerMap = new Map((centers ?? []).map((row) => [row.id, row]))

  const latestPendingByRequest = new Map<string, ProposalRow>()
  for (const proposal of proposals ?? []) {
    if (proposal.proposal_status === 'pending' && !latestPendingByRequest.has(proposal.request_id)) {
      latestPendingByRequest.set(proposal.request_id, proposal)
    }
  }

  const activeRequests = requests.filter((row) => row.status === 'initiated')
  const archivedRequests = requests.filter((row) => row.status === 'completed' || row.status === 'cancelled')

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="mt-1 text-sm text-stone-500">Active negotiations only. Scheduled events move to Scheduled Events.</p>
        </div>
        <Link
          href="/dashboard/requests/new"
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          New request
        </Link>
      </div>

      {activeRequests.length > 0 ? (
        <ul className="space-y-3">
          {activeRequests.map((request) => {
            const musician = request.musician_id ? musicianMap.get(request.musician_id) : null
            const location = request.center_location_id ? locationMap.get(request.center_location_id) : null
            const center = location ? centerMap.get(location.center_id) : null
            const latestPendingProposal = latestPendingByRequest.get(request.id)
            const isInitiator = request.initiator_role === role
            const canCurrentUserAcceptInitiated = latestPendingProposal
              ? latestPendingProposal.proposed_by_user_id !== user.id
              : !isInitiator
            const showMusicianAsPrimary = role === 'center_coordinator'
            const primaryImageUrl = showMusicianAsPrimary
              ? (musician?.profile_image_url ?? null)
              : (location?.location_image_url ?? center?.profile_image_url ?? null)
            const primaryName = showMusicianAsPrimary
              ? (musician?.name ?? 'Musician')
              : (location?.name ?? center?.name ?? 'Center location')
            const primaryFallbackClass = showMusicianAsPrimary
              ? 'bg-amber-100 text-amber-700'
              : 'bg-brand-100 text-brand-700'

            return (
              <li key={request.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  {primaryImageUrl ? (
                    <img
                      src={primaryImageUrl}
                      alt={primaryName}
                      className="h-14 w-14 flex-shrink-0 rounded-xl border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 text-sm font-semibold ${primaryFallbackClass}`}>
                      {primaryName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-stone-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status] ?? 'bg-stone-100 text-stone-800'}`}>
                        {formatStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
                      <p><span className="font-medium">Musician:</span> {musician?.name ?? 'Unknown'}{musician?.zip_code ? ` (ZIP ${musician.zip_code})` : ''}</p>
                      <p>
                        <span className="font-medium">Current proposal:</span> {formatDateLabel(request.requested_date)}
                        {request.requested_start_time && request.requested_end_time
                          ? ` (${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)})`
                          : ''}
                      </p>
                    </div>

                    {latestPendingProposal && (
                      <p className="mt-2 text-xs text-stone-600">
                        Latest pending proposal by {latestPendingProposal.proposed_by_user_id === user.id ? 'you' : 'the other side'} on{' '}
                        {new Date(latestPendingProposal.created_at).toLocaleString()}.
                      </p>
                    )}

                    {request.notes && <p className="mt-2 text-sm text-stone-600">{request.notes}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canCurrentUserAcceptInitiated && (
                        <form action={updateRequestStatusAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="nextStatus" value="accepted" />
                          <button
                            type="submit"
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Schedule event
                          </button>
                        </form>
                      )}

                      <Link
                        href={`/dashboard/requests/${request.id}/propose`}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Suggest alternate time
                      </Link>

                      <form action={updateRequestStatusAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="nextStatus" value="cancelled" />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Cancel
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
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-500 shadow-sm">
          No active request negotiations right now.
        </div>
      )}

      <details className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-stone-900">Archive / History ({archivedRequests.length})</summary>
        {archivedRequests.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {archivedRequests.map((request) => {
              const musician = request.musician_id ? musicianMap.get(request.musician_id) : null
              const location = request.center_location_id ? locationMap.get(request.center_location_id) : null
              const center = location ? centerMap.get(location.center_id) : null
              const showMusicianAsPrimary = role === 'center_coordinator'
              const primaryImageUrl = showMusicianAsPrimary
                ? (musician?.profile_image_url ?? null)
                : (location?.location_image_url ?? center?.profile_image_url ?? null)
              const primaryName = showMusicianAsPrimary
                ? (musician?.name ?? 'Musician')
                : (location?.name ?? center?.name ?? 'Center location')
              const primaryFallbackClass = showMusicianAsPrimary
                ? 'bg-amber-100 text-amber-700'
                : 'bg-brand-100 text-brand-700'

              return (
                <li key={request.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    {primaryImageUrl ? (
                      <img
                        src={primaryImageUrl}
                        alt={primaryName}
                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 text-xs font-semibold ${primaryFallbackClass}`}>
                        {primaryName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-stone-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[request.status] ?? 'bg-stone-100 text-stone-800'}`}>
                          {formatStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
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
          <p className="mt-3 text-sm text-stone-400">No archived requests yet.</p>
        )}
      </details>
    </section>
  )
}
