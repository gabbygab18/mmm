import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DASH_ICONS, StatCard, WelcomeBanner } from '@/components/mmm/dashboard-ui'

type RequestStatus = 'initiated' | 'matched' | 'accepted' | 'completed' | 'cancelled'

type AdminRequestRow = {
  id: string
  status: RequestStatus
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  musician_id: string | null
  center_location_id: string | null
  updated_at: string
  created_at: string
}

type AdminSearchParams = {
  musician?: string
  center?: string
  fromDate?: string
  toDate?: string
  status?: string | string[]
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatTimeLabel(value: string | null) {
  if (!value) return 'TBD'
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

function matchesFilter(value: string, query: string) {
  if (!query) return true
  return value.toLowerCase().includes(query.toLowerCase())
}

function isValidStatus(value: string): value is RequestStatus {
  return value === 'initiated' || value === 'accepted' || value === 'completed' || value === 'cancelled'
}

function parseStatusFilters(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  return raw
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter((entry): entry is RequestStatus => isValidStatus(entry))
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  initiated: 'bg-stone-100 text-stone-800',
  matched: 'bg-stone-100 text-stone-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

function getStatusLabel(status: RequestStatus) {
  if (status === 'accepted') return 'scheduled'
  if (status === 'matched') return 'initiated'
  return status
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const params = await searchParams
  const musicianFilter = (params.musician ?? '').trim()
  const centerFilter = (params.center ?? '').trim()
  const fromDateFilter = (params.fromDate ?? '').trim()
  const toDateFilter = (params.toDate ?? '').trim()
  const statusFilters = parseStatusFilters(params.status)
  const statusFilterSet = new Set<RequestStatus>(statusFilters)

  async function toggleMusicianApproval(formData: FormData) {
    'use server'

    const musicianId = String(formData.get('musician_id') ?? '')
    const approved = String(formData.get('approved') ?? '') === 'true'

    if (!musicianId) return

    const supabase = await createSupabaseServerClient()
    await supabase.from('musicians').update({ approved: !approved }).eq('id', musicianId)
    revalidatePath('/dashboard/admin')
  }

  async function toggleCenterApproval(formData: FormData) {
    'use server'

    const centerId = String(formData.get('center_id') ?? '')
    const approved = String(formData.get('approved') ?? '') === 'true'

    if (!centerId) return

    const supabase = await createSupabaseServerClient()
    await supabase.from('centers').update({ approved: !approved }).eq('id', centerId)
    revalidatePath('/dashboard/admin')
  }

  async function createMusicianFlag(formData: FormData) {
    'use server'

    const user = await requireAuthenticatedUser()
    const musicianId = String(formData.get('musician_id') ?? '')
    const reason = String(formData.get('reason') ?? '').trim()

    if (!musicianId || reason.length < 3) return

    const supabase = await createSupabaseServerClient()
    await supabase.from('moderation_flags').insert({
      musician_id: musicianId,
      reason,
      status: 'open',
      created_by_admin_user_id: user.id,
    })

    revalidatePath('/dashboard/admin')
  }

  async function createCenterFlag(formData: FormData) {
    'use server'

    const user = await requireAuthenticatedUser()
    const centerId = String(formData.get('center_id') ?? '')
    const reason = String(formData.get('reason') ?? '').trim()

    if (!centerId || reason.length < 3) return

    const supabase = await createSupabaseServerClient()
    await supabase.from('moderation_flags').insert({
      center_id: centerId,
      reason,
      status: 'open',
      created_by_admin_user_id: user.id,
    })

    revalidatePath('/dashboard/admin')
  }

  async function resolveFlag(formData: FormData) {
    'use server'

    const user = await requireAuthenticatedUser()
    const flagId = String(formData.get('flag_id') ?? '')
    const resolutionNotes = String(formData.get('resolution_notes') ?? '').trim()

    if (!flagId) return

    const supabase = await createSupabaseServerClient()
    await supabase
      .from('moderation_flags')
      .update({
        status: 'resolved',
        resolution_notes: resolutionNotes || null,
        resolved_by_admin_user_id: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)

    revalidatePath('/dashboard/admin')
  }

  async function updateRequestStatusByAdmin(formData: FormData) {
    'use server'

    const user = await requireAuthenticatedUser()
    const requestId = String(formData.get('request_id') ?? '')
    const nextStatus = String(formData.get('next_status') ?? '') as RequestStatus
    const reason = String(formData.get('reason') ?? '').trim()

    if (!requestId || !nextStatus) return

    const supabase = await createSupabaseServerClient()

    const { data: requestRow } = await supabase
      .from('requests')
      .select('id, status')
      .eq('id', requestId)
      .maybeSingle()

    if (!requestRow) return

    const now = new Date().toISOString()
    const updates: Record<string, string> = { status: nextStatus, updated_at: now }

    if (nextStatus === 'accepted') {
      updates.accepted_at = now
    }
    if (nextStatus === 'completed') {
      updates.completed_at = now
    }
    if (nextStatus === 'cancelled') {
      updates.cancelled_at = now
    }

    await supabase.from('requests').update(updates).eq('id', requestId)
    await supabase.from('request_status_history').insert({
      request_id: requestId,
      old_status: requestRow.status,
      new_status: nextStatus,
      changed_by_user_id: user.id,
      reason: reason || 'Admin support intervention',
    })

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/requests')
    revalidatePath('/dashboard/schedule')
  }

  const supabase = await createSupabaseServerClient()

  const hasMusicianFilter = Boolean(musicianFilter)
  const hasCenterFilter = Boolean(centerFilter)

  const { data: musicians } = hasMusicianFilter
    ? await supabase
        .from('musicians')
        .select('id, name, zip_code, profile_complete, approved, created_at, deleted_at')
        .ilike('name', `%${musicianFilter}%`)
        .order('created_at', { ascending: false })
        .limit(250)
    : { data: [] as { id: string; name: string; zip_code: string; profile_complete: boolean; approved: boolean; created_at: string; deleted_at: string | null }[] }

  const { data: centers } = hasCenterFilter
    ? await supabase
        .from('centers')
        .select('id, name, resident_count, profile_complete, approved, created_at, deleted_at')
        .ilike('name', `%${centerFilter}%`)
        .order('created_at', { ascending: false })
        .limit(250)
    : { data: [] as { id: string; name: string; resident_count: number | null; profile_complete: boolean; approved: boolean; created_at: string; deleted_at: string | null }[] }

  const [{ data: flags }, { data: requests }, { data: completedRequestsData }] = await Promise.all([
    supabase
      .from('moderation_flags')
      .select('id, musician_id, center_id, reason, status, resolution_notes, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('requests')
      .select('id, status, requested_date, requested_start_time, requested_end_time, musician_id, center_location_id, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(60),
    supabase
      .from('requests')
      .select('id, status, requested_date, requested_start_time, requested_end_time, musician_id, center_location_id, created_at, updated_at')
      .eq('status', 'completed')
      .order('requested_date', { ascending: false })
      .limit(250),
  ])

  const requestRows = (requests ?? []) as AdminRequestRow[]
  const completedEventRows = (completedRequestsData ?? []) as AdminRequestRow[]
  const musicianIds = Array.from(
    new Set([...requestRows, ...completedEventRows].map((row) => row.musician_id).filter(Boolean) as string[])
  )
  const locationIds = Array.from(
    new Set([...requestRows, ...completedEventRows].map((row) => row.center_location_id).filter(Boolean) as string[])
  )

  const { data: requestMusicians } = musicianIds.length
    ? await supabase.from('musicians').select('id, name').in('id', musicianIds)
    : { data: [] as { id: string; name: string }[] }

  const { data: requestLocations } = locationIds.length
    ? await supabase.from('center_locations').select('id, name, center_id').in('id', locationIds)
    : { data: [] as { id: string; name: string; center_id: string }[] }

  const centerIds = Array.from(new Set((requestLocations ?? []).map((row) => row.center_id)))
  const { data: requestCenters } = centerIds.length
    ? await supabase.from('centers').select('id, name').in('id', centerIds)
    : { data: [] as { id: string; name: string }[] }

  const musicianNameById = new Map((requestMusicians ?? []).map((row) => [row.id, row.name]))
  const locationById = new Map((requestLocations ?? []).map((row) => [row.id, row]))
  const centerNameById = new Map((requestCenters ?? []).map((row) => [row.id, row.name]))

  const openFlags = (flags ?? []).filter((row) => row.status === 'open')

  const musicianOptions = Array.from(new Set((requestMusicians ?? []).map((row) => row.name))).sort((a, b) => a.localeCompare(b)).slice(0, 250)
  const centerOptions = Array.from(new Set((requestCenters ?? []).map((row) => row.name))).sort((a, b) => a.localeCompare(b)).slice(0, 250)

  const matchesSharedEventFilters = (request: AdminRequestRow) => {
    const musicianName = request.musician_id ? musicianNameById.get(request.musician_id) ?? '' : ''
    const location = request.center_location_id ? locationById.get(request.center_location_id) : null
    const centerName = location ? centerNameById.get(location.center_id) ?? '' : ''
    const musicianMatches = matchesFilter(musicianName, musicianFilter)
    const centerMatches = matchesFilter(centerName, centerFilter)
    const fromDateMatches = !fromDateFilter || request.requested_date >= fromDateFilter
    const toDateMatches = !toDateFilter || request.requested_date <= toDateFilter

    return musicianMatches && centerMatches && fromDateMatches && toDateMatches
  }

  const filteredOversightRequests = requestRows.filter((request) => {
    if (!matchesSharedEventFilters(request)) return false
    if (statusFilterSet.size === 0) return true
    return statusFilterSet.has(request.status)
  })

  const hasAnyUnifiedFilter = Boolean(
    musicianFilter || centerFilter || fromDateFilter || toDateFilter || statusFilters.length > 0
  )
  const hasAnyAccountFilter = hasMusicianFilter || hasCenterFilter

  // Summary counts for the branded overview tiles.
  const pendingMusicianCount = (musicians ?? []).filter((m) => !m.approved && !m.deleted_at).length
  const pendingCenterCount = (centers ?? []).filter((c) => !c.approved && !c.deleted_at).length
  const filteredMusicians = musicians ?? []
  const filteredCenters = centers ?? []

  const openFlagsByMusicianId = new Map<string, typeof openFlags>()
  const openFlagsByCenterId = new Map<string, typeof openFlags>()

  for (const flag of openFlags) {
    if (flag.musician_id) {
      const current = openFlagsByMusicianId.get(flag.musician_id) ?? []
      current.push(flag)
      openFlagsByMusicianId.set(flag.musician_id, current)
    }

    if (flag.center_id) {
      const current = openFlagsByCenterId.get(flag.center_id) ?? []
      current.push(flag)
      openFlagsByCenterId.set(flag.center_id, current)
    }
  }

  const displayedOversightRequests = hasAnyUnifiedFilter ? filteredOversightRequests : []

  const buildFilterHref = (overrides: {
    musician?: string | null
    center?: string | null
    fromDate?: string | null
    toDate?: string | null
    statuses?: RequestStatus[] | null
  }) => {
    const nextMusician = overrides.musician === undefined ? musicianFilter : overrides.musician ?? ''
    const nextCenter = overrides.center === undefined ? centerFilter : overrides.center ?? ''
    const nextFromDate = overrides.fromDate === undefined ? fromDateFilter : overrides.fromDate ?? ''
    const nextToDate = overrides.toDate === undefined ? toDateFilter : overrides.toDate ?? ''
    const nextStatuses = overrides.statuses === undefined ? statusFilters : overrides.statuses ?? []

    const query = new URLSearchParams()
    if (nextMusician) query.set('musician', nextMusician)
    if (nextCenter) query.set('center', nextCenter)
    if (nextFromDate) query.set('fromDate', nextFromDate)
    if (nextToDate) query.set('toDate', nextToDate)
    for (const status of nextStatuses) {
      query.append('status', status)
    }

    const queryString = query.toString()
    return queryString ? `/dashboard/admin?${queryString}` : '/dashboard/admin'
  }

  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
  const toIsoDate = (value: Date) => value.toISOString().slice(0, 10)

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <section className="mx-auto max-w-[1240px] space-y-5">
      <WelcomeBanner
        title="Welcome back, Admin!"
        subtitle="Here’s what’s happening on Margaret’s Memorycare Music today."
        aside={
          <span className="inline-flex items-center gap-2 self-start rounded-xl bg-ocean-800 px-5 py-3 font-poppins text-[12.4px] font-semibold text-white shadow">
            {DASH_ICONS.calendar}
            {todayLabel}
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DASH_ICONS.people}
          title="Pending Musicians"
          value={`${pendingMusicianCount} awaiting review`}
          eyebrow="Pending musicians"
          actionLabel="View all"
          actionHref="/dashboard/admin?musicianStatus=pending"
        />
        <StatCard
          icon={DASH_ICONS.building}
          title="Pending Facilities"
          value={`${pendingCenterCount} awaiting review`}
          eyebrow="Pending facilities"
          actionLabel="View all"
          actionHref="/dashboard/admin?centerStatus=pending"
        />
        <StatCard
          icon={DASH_ICONS.calendar}
          title="Today’s Requests"
          value={`${requestRows.length} in view`}
          eyebrow="Today’s requests"
          actionLabel="View all"
          actionHref="/dashboard/requests"
        />
        <StatCard
          icon={DASH_ICONS.music}
          title="Open Flags"
          value={`${openFlags.length} to resolve`}
          eyebrow="Needs attention"
          actionLabel="View all"
          actionHref="/dashboard/admin"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Open flags</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">{openFlags.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Recent requests</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">{requestRows.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Completed events</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900">{completedEventRows.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Event Filters</h2>
        <p className="mt-1 text-xs text-stone-600">
          Shared filters are applied to both Media Library and Request/Event Oversight. Status filters apply to Oversight only.
        </p>

        <form action="/dashboard/admin" className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="admin-filter-musician" className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Musician</label>
            <input
              id="admin-filter-musician"
              list="admin-filter-musicians"
              type="text"
              name="musician"
              defaultValue={musicianFilter}
              placeholder="Type a musician name"
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="admin-filter-center" className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">Center</label>
            <input
              id="admin-filter-center"
              list="admin-filter-centers"
              type="text"
              name="center"
              defaultValue={centerFilter}
              placeholder="Type a center name"
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="admin-filter-from-date" className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">From date</label>
            <input
              id="admin-filter-from-date"
              type="date"
              name="fromDate"
              defaultValue={fromDateFilter}
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="admin-filter-to-date" className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">To date</label>
            <input
              id="admin-filter-to-date"
              type="date"
              name="toDate"
              defaultValue={toDateFilter}
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded border border-stone-200 bg-white p-3 md:col-span-2 lg:col-span-4">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Oversight status filter</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-700">
              {(['initiated', 'accepted', 'completed', 'cancelled'] as RequestStatus[]).map((status) => (
                <label key={status} className="inline-flex items-center gap-2">
                  <input type="checkbox" name="status" value={status} defaultChecked={statusFilterSet.has(status)} className="h-4 w-4" />
                  <span className="capitalize">{getStatusLabel(status)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-2 lg:justify-end">
            <button
              type="submit"
              className="rounded border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Apply filters
            </button>
            <a
              href="/dashboard/admin"
              className="rounded border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Clear all
            </a>
          </div>
        </form>

        <datalist id="admin-filter-musicians">
          {musicianOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <datalist id="admin-filter-centers">
          {centerOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-stone-500">Quick actions</span>
          <a href={buildFilterHref({ statuses: ['completed'] })} className="rounded-full border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-100">
            Completed only
          </a>
          <a href={buildFilterHref({ statuses: ['cancelled'] })} className="rounded-full border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-100">
            Cancelled only
          </a>
          <a
            href={buildFilterHref({ fromDate: toIsoDate(thirtyDaysAgo), toDate: toIsoDate(today), statuses: ['completed'] })}
            className="rounded-full border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-100"
          >
            Completed last 30 days
          </a>
          <a
            href={buildFilterHref({ fromDate: null, toDate: null, statuses: [], musician: null, center: null })}
            className="rounded-full border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-100"
          >
            Reset filters
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Account Moderation</h2>
        {!hasAnyAccountFilter ? (
          <p className="mt-3 text-sm text-stone-600">Search by musician or center above to load matching accounts for moderation.</p>
        ) : filteredMusicians.length === 0 && filteredCenters.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">No account records matched the current musician/center filters.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {filteredMusicians.map((musician) => {
              const accountFlags = openFlagsByMusicianId.get(musician.id) ?? []

              return (
                <li key={`musician-${musician.id}`} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{musician.name}</p>
                      <p className="text-sm text-stone-600">Musician · ZIP {musician.zip_code}</p>
                      <p className="text-xs text-stone-500">Profile complete: {musician.profile_complete ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {musician.deleted_at && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Deleted
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          musician.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {musician.approved ? 'Approved' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={toggleMusicianApproval}>
                      <input type="hidden" name="musician_id" value={musician.id} />
                      <input type="hidden" name="approved" value={String(musician.approved)} />
                      <button
                        type="submit"
                        className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                      >
                        {musician.approved ? 'Disable profile' : 'Re-enable profile'}
                      </button>
                    </form>
                  </div>

                  <form action={createMusicianFlag} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input type="hidden" name="musician_id" value={musician.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      minLength={3}
                      placeholder="Flag reason (internal only)"
                      className="rounded border border-stone-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Add flag
                    </button>
                  </form>

                  {accountFlags.length > 0 && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Open moderation flags</p>
                      <ul className="mt-2 space-y-2">
                        {accountFlags.map((flag) => (
                          <li key={flag.id} className="rounded border border-rose-200 bg-white p-2">
                            <p className="text-sm text-rose-900">{flag.reason}</p>
                            <p className="mt-1 text-xs text-rose-700">Opened {new Date(flag.created_at).toLocaleString()}</p>
                            <form action={resolveFlag} className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                              <input type="hidden" name="flag_id" value={flag.id} />
                              <input
                                type="text"
                                name="resolution_notes"
                                placeholder="Resolution notes (optional)"
                                className="rounded border border-rose-300 px-3 py-2 text-sm"
                              />
                              <button
                                type="submit"
                                className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                Resolve
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}

            {filteredCenters.map((center) => {
              const accountFlags = openFlagsByCenterId.get(center.id) ?? []

              return (
                <li key={`center-${center.id}`} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{center.name}</p>
                      <p className="text-sm text-stone-600">Center · Residents: {center.resident_count ?? 'Unknown'}</p>
                      <p className="text-xs text-stone-500">Profile complete: {center.profile_complete ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {center.deleted_at && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Deleted
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          center.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {center.approved ? 'Approved' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <form action={toggleCenterApproval}>
                      <input type="hidden" name="center_id" value={center.id} />
                      <input type="hidden" name="approved" value={String(center.approved)} />
                      <button
                        type="submit"
                        className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                      >
                        {center.approved ? 'Disable profile' : 'Re-enable profile'}
                      </button>
                    </form>
                  </div>

                  <form action={createCenterFlag} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input type="hidden" name="center_id" value={center.id} />
                    <input
                      type="text"
                      name="reason"
                      required
                      minLength={3}
                      placeholder="Flag reason (internal only)"
                      className="rounded border border-stone-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Add flag
                    </button>
                  </form>

                  {accountFlags.length > 0 && (
                    <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Open moderation flags</p>
                      <ul className="mt-2 space-y-2">
                        {accountFlags.map((flag) => (
                          <li key={flag.id} className="rounded border border-rose-200 bg-white p-2">
                            <p className="text-sm text-rose-900">{flag.reason}</p>
                            <p className="mt-1 text-xs text-rose-700">Opened {new Date(flag.created_at).toLocaleString()}</p>
                            <form action={resolveFlag} className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                              <input type="hidden" name="flag_id" value={flag.id} />
                              <input
                                type="text"
                                name="resolution_notes"
                                placeholder="Resolution notes (optional)"
                                className="rounded border border-rose-300 px-3 py-2 text-sm"
                              />
                              <button
                                type="submit"
                                className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                Resolve
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Event Oversight and Media</h2>
        <p className="mt-1 text-xs text-stone-600">
          Filter to load matching events, update status when needed, and manage media on completed events in one place.
        </p>
        {displayedOversightRequests.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {displayedOversightRequests.map((request) => {
              const musicianName = request.musician_id ? musicianNameById.get(request.musician_id) ?? 'Unknown musician' : 'Unknown musician'
              const location = request.center_location_id ? locationById.get(request.center_location_id) : null
              const centerName = location ? centerNameById.get(location.center_id) ?? 'Unknown center' : 'Unknown center'
              return (
                <li key={request.id} className="rounded-lg border border-stone-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{musicianName} @ {centerName}</p>
                      <p className="text-sm text-stone-600">
                        {formatDateLabel(request.requested_date)} · {formatTimeLabel(request.requested_start_time)} - {formatTimeLabel(request.requested_end_time)}
                      </p>
                      <p className="text-xs text-stone-500">Updated {new Date(request.updated_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status] ?? 'bg-stone-100 text-stone-800'}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  <form action={updateRequestStatusByAdmin} className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_auto]">
                    <input type="hidden" name="request_id" value={request.id} />
                    <select name="next_status" defaultValue={request.status} className="rounded border border-stone-300 px-2 py-2 text-sm">
                      <option value="initiated">initiated</option>
                      <option value="accepted">scheduled</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                    <input
                      type="text"
                      name="reason"
                      placeholder="Reason (support note)"
                      className="rounded border border-stone-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                    >
                      Apply status
                    </button>
                  </form>

                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-600">
            {hasAnyUnifiedFilter
              ? 'No events matched the current filters. Try widening the date range or removing one filter.'
              : 'Apply at least one filter above to load matching events and media items.'}
          </p>
        )}
      </div>
    </section>
  )
}

