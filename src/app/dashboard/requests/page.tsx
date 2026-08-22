import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { notifyUser, getRecipientEmail, buildRequestJourneyEmailHtml } from '@/lib/notifications'
import type { AlertType } from '@/lib/notifications'
import { checkBookingConflicts } from '@/lib/booking-conflicts'
import { SubmitButton } from '@/components/mmm/submit-button'

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
  initiated: 'bg-ocean-100 text-ocean-800',
  matched: 'bg-ocean-100 text-ocean-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
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
    // These are business-rule no-ops (nothing to accept, or you're waiting on
    // your own last proposal) — redirect with a status instead of returning
    // blank, so the button doesn't just look stuck.
    if (currentStatus !== 'initiated') redirect('/dashboard/requests?status=accept_failed')

    const { data: latestPendingProposal } = await supabase
      .from('request_time_proposals')
      .select('id, proposed_by_user_id')
      .eq('request_id', requestId)
      .eq('proposal_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestPendingProposal && latestPendingProposal.proposed_by_user_id === user.id) {
      redirect('/dashboard/requests?status=accept_waiting')
    }

    // Double-booking guard. This is the authoritative check: accepting is the
    // moment the booking becomes a real commitment, and until now nothing
    // stopped a musician from accepting two overlapping requests (or one on a
    // date they had marked unavailable). The times checked are the ones that
    // will actually be adopted below — the latest pending proposal when there
    // is one, otherwise what is already on the request.
    const effectiveDate = latestPendingProposal
      ? (
          await supabase
            .from('request_time_proposals')
            .select('proposed_date, proposed_start_time, proposed_end_time')
            .eq('id', latestPendingProposal.id)
            .maybeSingle()
        ).data
      : null

    const checkDate = effectiveDate?.proposed_date ?? requestRow.requested_date
    const checkStart = effectiveDate?.proposed_start_time ?? requestRow.requested_start_time
    const checkEnd = effectiveDate?.proposed_end_time ?? requestRow.requested_end_time

    if (requestRow.musician_id && checkDate && checkStart && checkEnd) {
      const conflict = await checkBookingConflicts({
        musicianId: requestRow.musician_id,
        date: checkDate,
        startTime: checkStart,
        endTime: checkEnd,
        excludeRequestId: requestId,
      })

      if (conflict.kind === 'date_blocked') {
        redirect('/dashboard/requests?status=conflict_date')
      }
      if (conflict.kind === 'overlap') {
        redirect('/dashboard/requests?status=conflict_time')
      }
    }

    const timestamp = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('requests')
      .update({ status: 'accepted', accepted_at: timestamp, updated_at: timestamp })
      .eq('id', requestId)

    if (updateError) redirect('/dashboard/requests?status=accept_failed')

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
    const participantName = role === 'musician' ? ctx.location?.name : ctx.musician?.name

    if (otherUserId) {
      const otherBody = `Great news! Your request with ${participantName} for ${dateStr} at ${timeStr} is now scheduled. Check your dashboard for details and next steps.`
      await notifyUser({
        userId: otherUserId,
        alertType: 'request_accepted' as AlertType,
        title: 'Event Scheduled! 🎉',
        message: `Your request with ${participantName} for ${dateStr} at ${timeStr} is now scheduled.`,
        recipientEmail: otherUserEmail,
        subject: 'Your Performance Was Scheduled',
        body: otherBody,
        html: buildRequestJourneyEmailHtml(otherBody, 'accepted'),
        relatedRequestId: requestId,
      })
    }

    // Confirmation back to whoever clicked Accept — they see the banner
    // in-app already, so this is email-only, not a second alert.
    const selfEmail = await getRecipientEmail(user.id)
    const selfAcceptBody = `Hi,\n\nThis confirms you accepted the request with ${participantName} for ${dateStr} at ${timeStr}. It's now on your Scheduled Events.\n\n— Margaret's MemoryCare Music`
    await notifyUser({
      userId: user.id,
      alertType: 'request_accepted' as AlertType,
      title: 'You accepted a performance request',
      message: `You accepted the request with ${participantName} for ${dateStr} at ${timeStr}.`,
      recipientEmail: selfEmail,
      subject: 'You accepted a performance request — Margaret\'s MemoryCare Music',
      body: selfAcceptBody,
      html: buildRequestJourneyEmailHtml(selfAcceptBody, 'accepted'),
      relatedRequestId: requestId,
      skipInAppAlert: true,
    })

    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/requests?status=accepted')
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
    const participantName = role === 'musician' ? ctx.location?.name : ctx.musician?.name
    const isScheduledEventCancellation = currentStatus === 'accepted'
    const alertType = isScheduledEventCancellation ? 'event_cancelled' : 'request_cancelled'
    const title = isScheduledEventCancellation ? 'Performance Cancelled' : 'Request Cancelled'
    const subject = isScheduledEventCancellation ? 'Performance Was Cancelled' : 'Performance Request Was Cancelled'
    const message = isScheduledEventCancellation
      ? `The performance with ${participantName} on ${dateStr} has been cancelled.`
      : `A request with ${participantName} for ${dateStr} has been cancelled.`
    const journeyStage = isScheduledEventCancellation ? 'cancelled_after_accept' : 'cancelled_before_accept'

    if (otherUserId) {
      await notifyUser({
        userId: otherUserId,
        alertType: alertType as AlertType,
        title,
        message,
        recipientEmail: otherUserEmail,
        subject,
        body: message,
        html: buildRequestJourneyEmailHtml(message, journeyStage),
        relatedRequestId: requestId,
      })
    }

    // Confirmation back to whoever cancelled — email-only, they already see
    // the in-app banner.
    const selfEmail = await getRecipientEmail(user.id)
    const selfCancelBody = isScheduledEventCancellation
      ? `Hi,\n\nThis confirms you cancelled the performance with ${participantName} on ${dateStr}.\n\n— Margaret's MemoryCare Music`
      : `Hi,\n\nThis confirms you cancelled the request with ${participantName} for ${dateStr}.\n\n— Margaret's MemoryCare Music`
    await notifyUser({
      userId: user.id,
      alertType: alertType as AlertType,
      title: isScheduledEventCancellation ? 'You cancelled a performance' : 'You cancelled a request',
      message: isScheduledEventCancellation
        ? `You cancelled the performance with ${participantName} on ${dateStr}.`
        : `You cancelled the request with ${participantName} for ${dateStr}.`,
      recipientEmail: selfEmail,
      subject: isScheduledEventCancellation ? 'You cancelled a performance — Margaret\'s MemoryCare Music' : 'You cancelled a request — Margaret\'s MemoryCare Music',
      body: selfCancelBody,
      html: buildRequestJourneyEmailHtml(selfCancelBody, journeyStage),
      relatedRequestId: requestId,
      skipInAppAlert: true,
    })

    revalidatePath('/dashboard/schedule')
    redirect('/dashboard/requests?status=cancelled')
  }
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: justUpdatedStatus } = await searchParams
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
      ? supabase.from('musicians').select('id, user_id, username, name, zip_code, profile_image_url, music_types, instruments').in('id', musicianIds)
      : Promise.resolve({ data: [] as { id: string; user_id: string; username: string | null; name: string; zip_code: string; profile_image_url: string | null; music_types: string[] | null; instruments: string[] | null }[] }),
    locationIds.length
      ? supabase.from('center_locations').select('id, name, center_id, location_image_url, zip_code').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string; center_id: string; location_image_url: string | null; zip_code: string | null }[] }),
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

  // Distance per musician/location pair, so a facility can judge a request
  // without opening the profile. Resolved once per distinct pair rather than
  // once per request — the same musician and venue recur across requests, and
  // each lookup is its own round trip.
  const distanceKey = (zip1: string, zip2: string) => `${zip1}|${zip2}`
  const distancePairs = new Map<string, { zip1: string; zip2: string }>()
  for (const request of requests) {
    const musicianZip = request.musician_id ? musicianMap.get(request.musician_id)?.zip_code : null
    const locationZip = request.center_location_id ? locationMap.get(request.center_location_id)?.zip_code : null
    if (musicianZip && locationZip) {
      distancePairs.set(distanceKey(musicianZip, locationZip), { zip1: musicianZip, zip2: locationZip })
    }
  }

  const distanceByPair = new Map<string, number>()
  await Promise.all(
    Array.from(distancePairs.entries()).map(async ([key, { zip1, zip2 }]) => {
      const { data } = await supabase.rpc('get_distance_miles', { zip1, zip2 })
      if (typeof data === 'number') distanceByPair.set(key, data)
    }),
  )

  /** "12.4 miles away", or null when either ZIP is unknown to the lookup. */
  const distanceLabelFor = (musicianZip?: string | null, locationZip?: string | null) => {
    if (!musicianZip || !locationZip) return null
    const miles = distanceByPair.get(distanceKey(musicianZip, locationZip))
    if (miles === undefined) return null
    return `${miles.toFixed(1)} miles away`
  }

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
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Requests</h1>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            Active negotiations only. Scheduled events move to Scheduled Events.
          </p>
        </div>
        <Link
          href="/dashboard/requests/new"
          className="rounded-lg bg-ocean-800 px-4 py-2 font-poppins text-[12px] font-semibold text-white transition hover:bg-ocean-700"
        >
          New request
        </Link>
      </div>

      {justUpdatedStatus === 'accepted' && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-emerald-800">
          Request accepted — it&apos;s now on Scheduled Events.
        </p>
      )}
      {justUpdatedStatus === 'cancelled' && (
        <p className="rounded-lg bg-rose-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-rose-800">
          Request cancelled.
        </p>
      )}
      {justUpdatedStatus === 'accept_waiting' && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-amber-800">
          You suggested the latest time — waiting on the other side to accept it.
        </p>
      )}
      {justUpdatedStatus === 'accept_failed' && (
        <p className="rounded-lg bg-rose-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-rose-800">
          Couldn&apos;t accept that request — it may have already changed. Refresh and try again.
        </p>
      )}
      {justUpdatedStatus === 'created' && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-emerald-800">
          Request sent.
        </p>
      )}
      {/* Double-booking guard outcomes. Wording stays free/busy — it says the
          slot is taken, never which facility took it. */}
      {justUpdatedStatus === 'conflict_time' && (
        <p className="rounded-lg bg-rose-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-rose-800">
          Couldn&apos;t accept — that time overlaps a performance already scheduled for this musician. Suggest a
          different time instead.
        </p>
      )}
      {justUpdatedStatus === 'conflict_date' && (
        <p className="rounded-lg bg-rose-50 px-4 py-2.5 font-poppins text-[12.5px] font-medium text-rose-800">
          Couldn&apos;t accept — the musician has marked that date unavailable. Suggest a different date instead.
        </p>
      )}

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
              : 'bg-ocean-100 text-ocean-700'
            // Both profile routes accept a bare id, so the username is only a
            // nicety here. Falls back to the requests list when the row is
            // missing entirely, rather than building a link to nowhere.
            const primaryProfileHref = showMusicianAsPrimary
              ? musician
                ? `/discover/musician/${musician.username ?? musician.id}`
                : '/dashboard/requests'
              : location
                ? `/discover/location/${location.id}`
                : '/dashboard/requests'

            return (
              <li key={request.id} className="rounded-2xl border border-ocean-200/70 bg-white p-4 shadow-sm">
                <div className="flex gap-4">
                  {/* The avatar goes wherever the name beside it goes. Which
                      profile that is depends on who is looking: a facility
                      sees the musician here, a musician sees the venue. */}
                  <Link
                    href={primaryProfileHref}
                    aria-label={`View ${primaryName}'s profile`}
                    title={`View ${primaryName}'s profile`}
                    className="flex-shrink-0 rounded-xl transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                  >
                    {primaryImageUrl ? (
                      <img
                        src={primaryImageUrl}
                        alt={primaryName}
                        className="h-14 w-14 rounded-xl border border-ocean-200/70 object-cover"
                      />
                    ) : (
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl border border-ocean-200/70 font-poppins text-sm font-semibold ${primaryFallbackClass}`}>
                        {primaryName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-poppins text-sm font-semibold text-ocean-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                      <span className={`rounded-full px-2.5 py-0.5 font-poppins text-xs font-semibold ${STATUS_STYLES[request.status] ?? 'bg-ocean-100 text-ocean-800'}`}>
                        {formatStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 font-poppins text-sm text-ocean-900/80 sm:grid-cols-2">
                      <p>
                        <span className="font-medium">Musician:</span>{' '}
                        {musician ? (
                          // Still a link to the full profile — the details
                          // below just save the trip for the common case.
                          <Link
                            href={`/discover/musician/${musician.username ?? musician.id}`}
                            className="font-semibold text-ocean-700 underline underline-offset-2 transition hover:text-ocean-900"
                          >
                            {musician.name}
                          </Link>
                        ) : (
                          'Unknown'
                        )}
                        {musician?.zip_code ? ` (ZIP ${musician.zip_code})` : ''}
                      </p>
                      <p>
                        <span className="font-medium">Current proposal:</span> {formatDateLabel(request.requested_date)}
                        {request.requested_start_time && request.requested_end_time
                          ? ` (${formatTimeLabel(request.requested_start_time)} - ${formatTimeLabel(request.requested_end_time)})`
                          : ''}
                      </p>
                    </div>

                    {/* Music types, instruments and distance inline, so a
                        facility can size up a request without opening the
                        profile first. Each group is labelled: unlabelled the
                        pills were ambiguous, since a value like "Vocals"
                        reads equally as a genre or an instrument. */}
                    {musician && (
                      <div className="mt-2 space-y-1.5">
                        {distanceLabelFor(musician.zip_code, location?.zip_code) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-poppins text-xs font-medium text-ocean-900/60">Distance:</span>
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-poppins text-xs font-semibold text-amber-700">
                              {distanceLabelFor(musician.zip_code, location?.zip_code)}
                            </span>
                          </div>
                        )}

                        {((musician.music_types ?? []) as string[]).length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-poppins text-xs font-medium text-ocean-900/60">Music types:</span>
                            {((musician.music_types ?? []) as string[]).map((type) => (
                              <span key={`t-${type}`} className="rounded-full bg-ocean-100 px-2 py-0.5 font-poppins text-xs font-medium text-ocean-800">
                                {type}
                              </span>
                            ))}
                          </div>
                        )}

                        {((musician.instruments ?? []) as string[]).length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-poppins text-xs font-medium text-ocean-900/60">Instruments:</span>
                            {((musician.instruments ?? []) as string[]).map((instrument) => (
                              <span key={`i-${instrument}`} className="rounded-full border border-ocean-200 px-2 py-0.5 font-poppins text-xs font-medium text-ocean-700">
                                {instrument}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {latestPendingProposal && (
                      <p className="mt-2 font-poppins text-xs text-ocean-900/60">
                        Latest pending proposal by {latestPendingProposal.proposed_by_user_id === user.id ? 'you' : 'the other side'} on{' '}
                        {new Date(latestPendingProposal.created_at).toLocaleString()}.
                      </p>
                    )}

                    {request.notes && <p className="mt-2 font-poppins text-sm text-ocean-900/70">{request.notes}</p>}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canCurrentUserAcceptInitiated && (
                        <form action={updateRequestStatusAction}>
                          <input type="hidden" name="requestId" value={request.id} />
                          <input type="hidden" name="nextStatus" value="accepted" />
                          <SubmitButton
                            pendingLabel="Accepting…"
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 font-poppins text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Accept
                          </SubmitButton>
                        </form>
                      )}

                      <Link
                        href={`/dashboard/requests/${request.id}/propose`}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 font-poppins text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Suggest alternate time
                      </Link>

                      <form action={updateRequestStatusAction}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <input type="hidden" name="nextStatus" value="cancelled" />
                        <SubmitButton
                          pendingLabel="Cancelling…"
                          className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-poppins text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Cancel
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 font-poppins text-sm text-ocean-900/60 shadow-sm">
          No active request negotiations right now.
        </div>
      )}

      <details className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-poppins text-sm font-semibold text-ocean-900">Archive / History ({archivedRequests.length})</summary>
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
                : 'bg-ocean-100 text-ocean-700'

              return (
                <li key={request.id} className="rounded-lg border border-ocean-200/70 bg-ocean-50/60 px-3 py-2 font-poppins text-sm text-ocean-900/80">
                  <div className="flex items-start gap-3">
                    {primaryImageUrl ? (
                      <img
                        src={primaryImageUrl}
                        alt={primaryName}
                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-ocean-200/70 object-cover"
                      />
                    ) : (
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-ocean-200/70 font-poppins text-xs font-semibold ${primaryFallbackClass}`}>
                        {primaryName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-ocean-900">{center?.name ?? 'Center'} · {location?.name ?? 'Location'}</p>
                        <span className={`rounded-full px-2 py-0.5 font-poppins text-xs font-semibold ${STATUS_STYLES[request.status] ?? 'bg-ocean-100 text-ocean-800'}`}>
                          {formatStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-1 font-poppins text-xs text-ocean-900/60">
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
          <p className="mt-3 font-poppins text-sm text-ocean-900/50">No archived requests yet.</p>
        )}
      </details>
    </section>
  )
}
