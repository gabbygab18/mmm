import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DASH_ICONS, EmptyState, Panel, StatCard, WelcomeBanner } from '@/components/mmm/dashboard-ui'

export const metadata = { title: "Admin Dashboard | Margaret's MemoryCare Music" }

/**
 * Admin dashboard, per the approved design pack.
 *
 * Four status cards across the top, then Volunteer Hours · Platform Statistics
 * · Upcoming Performances, and Top Musicians · Top Facilities · Recent
 * Activity below.
 *
 * Two figures the design shows are not drawn here, because there is nothing
 * behind them yet rather than because they were forgotten:
 *
 *   Avg. rating   there is no ratings table — ratings are Sprint 8, on hold
 *                 post-MVP. A zero would read as "everyone rates us nothing".
 *   Musician photos in Upcoming Performances — musicians.profile_image_url is
 *                 read where set; the placeholder tile shows otherwise.
 *
 * Volunteer hours are derived from completed requests (end − start) rather than
 * stored, so they need no new table and cannot drift from the bookings.
 *
 * The moderation console this page used to be still exists in full, at
 * /dashboard/admin/oversight.
 */

type RequestRow = {
  id: string
  status: string
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  musician_id: string | null
  center_location_id: string | null
  updated_at: string
}

/** Length of one booking in hours, or 0 when the times were never filled in. */
function hoursFor(row: Pick<RequestRow, 'requested_start_time' | 'requested_end_time'>) {
  if (!row.requested_start_time || !row.requested_end_time) return 0
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const minutes = toMinutes(row.requested_end_time) - toMinutes(row.requested_start_time)
  return minutes > 0 ? minutes / 60 : 0
}

const round1 = (n: number) => Math.round(n * 10) / 10

function formatDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

function formatTime(value: string | null) {
  if (!value) return 'TBD'
  const [hRaw, mRaw] = value.split(':')
  const h = Number(hRaw)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${(mRaw ?? '00').padStart(2, '0')} ${period}`
}

/** One line of the Platform Statistics grid. */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-poppins text-[19px] font-bold text-ocean-900">{value}</p>
      <p className="mt-0.5 font-poppins text-[8.5px] font-bold uppercase tracking-[0.12em] text-ocean-900/70">
        {label}
      </p>
    </div>
  )
}

/** Numbered leaderboard row, used by both Top Musicians and Top Facilities. */
function RankRow({ rank, name, meta, value }: { rank: number; name: string; meta: string; value: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="font-poppins text-[12px] font-bold text-ocean-900/60">{rank}</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean-800">
        {DASH_ICONS.people}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-poppins text-[12.5px] font-semibold text-ocean-900">{name}</span>
        <span className="block truncate font-poppins text-[10.5px] text-ocean-900/70">{meta}</span>
      </span>
      <span className="shrink-0 font-poppins text-[11.5px] font-semibold text-ocean-900">{value}</span>
    </li>
  )
}

export default async function AdminDashboardPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createSupabaseServerClient()

  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const monthStart = `${todayIso.slice(0, 7)}-01`
  const yearStart = `${todayIso.slice(0, 4)}-01-01`

  const [
    { count: pendingMusicians },
    { count: pendingFacilities },
    { count: todaysRequests },
    { count: musicianCount },
    { count: facilityCount },
    { count: totalBookings },
    { count: completedCount },
    { count: cancelledCount },
    { data: upcomingData },
    { data: completedData },
    { data: recentData },
  ] = await Promise.all([
    supabase.from('musicians').select('id', { count: 'exact', head: true }).eq('approved', false).is('deleted_at', null),
    supabase.from('centers').select('id', { count: 'exact', head: true }).eq('approved', false).is('deleted_at', null),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('requested_date', todayIso),
    supabase.from('musicians').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('centers').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('requests').select('id', { count: 'exact', head: true }),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('requests').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase
      .from('requests')
      .select('id, status, requested_date, requested_start_time, requested_end_time, musician_id, center_location_id, updated_at')
      .eq('status', 'accepted')
      .gte('requested_date', todayIso)
      .order('requested_date', { ascending: true })
      .limit(5),
    supabase
      .from('requests')
      .select('id, status, requested_date, requested_start_time, requested_end_time, musician_id, center_location_id, updated_at')
      .eq('status', 'completed')
      .gte('requested_date', yearStart)
      .limit(500),
    supabase
      .from('requests')
      .select('id, status, requested_date, requested_start_time, requested_end_time, musician_id, center_location_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(6),
  ])

  const upcoming = (upcomingData ?? []) as RequestRow[]
  const completed = (completedData ?? []) as RequestRow[]
  const recent = (recentData ?? []) as RequestRow[]

  // Names for every musician / location referenced above, in two queries.
  const musicianIds = [...new Set([...upcoming, ...completed, ...recent].map((r) => r.musician_id).filter(Boolean))] as string[]
  const locationIds = [...new Set([...upcoming, ...completed, ...recent].map((r) => r.center_location_id).filter(Boolean))] as string[]

  const [{ data: musicianRows }, { data: locationRows }] = await Promise.all([
    musicianIds.length
      ? supabase.from('musicians').select('id, name, profile_image_url').in('id', musicianIds)
      : Promise.resolve({ data: [] }),
    // center_locations carries address + zip_code; there are no city/state columns.
    locationIds.length
      ? supabase.from('center_locations').select('id, name, address, zip_code').in('id', locationIds)
      : Promise.resolve({ data: [] }),
  ])

  const musicianById = new Map(
    ((musicianRows ?? []) as { id: string; name: string; profile_image_url: string | null }[]).map((m) => [m.id, m]),
  )
  const locationById = new Map(
    ((locationRows ?? []) as { id: string; name: string; address: string | null; zip_code: string | null }[]).map(
      (l) => [l.id, l],
    ),
  )

  // ── Volunteer hours, derived from completed bookings ──────────────────────
  const hoursThisYear = completed.reduce((sum, r) => sum + hoursFor(r), 0)
  const hoursThisMonth = completed
    .filter((r) => r.requested_date >= monthStart)
    .reduce((sum, r) => sum + hoursFor(r), 0)

  // ── Leaderboards ──────────────────────────────────────────────────────────
  const musicianHours = new Map<string, number>()
  const facilityBookings = new Map<string, number>()
  for (const r of completed) {
    if (r.musician_id) musicianHours.set(r.musician_id, (musicianHours.get(r.musician_id) ?? 0) + hoursFor(r))
    if (r.center_location_id)
      facilityBookings.set(r.center_location_id, (facilityBookings.get(r.center_location_id) ?? 0) + 1)
  }

  const topMusicians = [...musicianHours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const topFacilities = [...facilityBookings.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

  const bookings = totalBookings ?? 0
  const completedPct = bookings ? Math.round(((completedCount ?? 0) / bookings) * 100) : 0

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <WelcomeBanner
        title="Welcome back, Admin!"
        subtitle="Here’s what’s happening on Margaret’s Memorycare Music today."
      />

      {/* ---- Status cards ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DASH_ICONS.people}
          title="Pending Musicians"
          value={`${pendingMusicians ?? 0} awaiting review`}
          eyebrow="Pending Musicians"
          actionLabel="View all"
          actionHref="/dashboard/admin/musicians?status=pending"
        />
        <StatCard
          icon={DASH_ICONS.building}
          title="Pending Facilities"
          value={`${pendingFacilities ?? 0} awaiting review`}
          eyebrow="Pending Facilities"
          actionLabel="View all"
          actionHref="/dashboard/admin/facilities?status=pending"
        />
        <StatCard
          icon={DASH_ICONS.calendar}
          title="Today’s Requests"
          value={`${todaysRequests ?? 0} in view`}
          eyebrow="Today’s Requests"
          actionLabel="View all"
          actionHref="/dashboard/admin/oversight"
        />
        <StatCard
          icon={DASH_ICONS.music}
          title="Upcoming Performances"
          value={`${upcoming.length} scheduled`}
          eyebrow="Upcoming Performances"
          actionLabel="View all"
          actionHref="/dashboard/schedule"
        />
      </div>

      {/* ---- Hours · statistics · upcoming ---- */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title="Volunteer Hours">
          <div className="space-y-5">
            <div>
              <p className="font-poppins text-[8.5px] font-bold uppercase tracking-[0.12em] text-ocean-900/70">
                This month
              </p>
              <p className="mt-1 font-poppins text-[22px] font-bold text-ocean-900">{round1(hoursThisMonth)}</p>
            </div>
            <div className="border-t border-ocean-300/70 pt-4">
              <p className="font-poppins text-[8.5px] font-bold uppercase tracking-[0.12em] text-ocean-900/70">
                This year
              </p>
              <p className="mt-1 font-poppins text-[22px] font-bold text-ocean-900">{round1(hoursThisYear)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Platform Statistics">
          <div className="grid grid-cols-3 gap-y-5">
            <Stat value={String(musicianCount ?? 0)} label="Musicians" />
            <Stat value={String(facilityCount ?? 0)} label="Facilities" />
            <Stat value={String(bookings)} label="Total Bookings" />
            <Stat value={`${completedPct}%`} label="Completed" />
            <Stat value={String(cancelledCount ?? 0)} label="Cancelled" />
          </div>
        </Panel>

        <Panel title="Upcoming Performances" viewAllHref="/dashboard/schedule">
          {upcoming.length === 0 ? (
            <EmptyState message="No performances are scheduled yet." />
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 3).map((r) => {
                const location = r.center_location_id ? locationById.get(r.center_location_id) : undefined
                const musician = r.musician_id ? musicianById.get(r.musician_id) : undefined
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-white/70 p-2.5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ocean-100 text-ocean-800">
                      {musician?.profile_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={musician.profile_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        DASH_ICONS.music
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-poppins text-[12.5px] font-bold text-ocean-900">
                        {location?.name ?? 'Facility'}
                      </p>
                      <p className="truncate font-poppins text-[10.5px] text-ocean-900/70">
                        {[location?.address, location?.zip_code].filter(Boolean).join(', ') ||
                          'Location to be confirmed'}
                      </p>
                      <p className="truncate font-poppins text-[10.5px] text-ocean-900/70">
                        {formatDate(r.requested_date)} | {formatTime(r.requested_start_time)} –{' '}
                        {formatTime(r.requested_end_time)}
                      </p>
                      <p className="truncate font-poppins text-[10.5px] text-ocean-900/70">
                        {musician?.name ?? 'Musician to be confirmed'}
                      </p>
                    </div>
                    <span className="shrink-0 font-poppins text-[9px] font-bold uppercase tracking-[0.12em] text-ocean-900">
                      Scheduled
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---- Leaderboards · recent activity ---- */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title="Top Musicians by Hrs." viewAllHref="/dashboard/admin/musicians">
          {topMusicians.length === 0 ? (
            <EmptyState message="No completed performances yet." />
          ) : (
            <ul className="divide-y divide-ocean-200/70">
              {topMusicians.map(([id, hours], i) => (
                <RankRow
                  key={id}
                  rank={i + 1}
                  name={musicianById.get(id)?.name ?? 'Musician'}
                  meta="Hours performed"
                  value={`${round1(hours)} hrs`}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top Facilities by Bookings" viewAllHref="/dashboard/admin/facilities">
          {topFacilities.length === 0 ? (
            <EmptyState message="No completed bookings yet." />
          ) : (
            <ul className="divide-y divide-ocean-200/70">
              {topFacilities.map(([id, count], i) => (
                <RankRow
                  key={id}
                  rank={i + 1}
                  name={locationById.get(id)?.name ?? 'Facility'}
                  meta="Bookings"
                  value={String(count)}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent Activity" viewAllHref="/dashboard/admin/oversight">
          {recent.length === 0 ? (
            <EmptyState message="Nothing has happened yet." />
          ) : (
            <ul className="divide-y divide-ocean-200/70">
              {recent.slice(0, 4).map((r) => {
                const location = r.center_location_id ? locationById.get(r.center_location_id) : undefined
                return (
                  <li key={r.id} className="py-2.5">
                    <p className="font-poppins text-[12px] font-bold capitalize text-ocean-900">
                      Booking {r.status}
                    </p>
                    <p className="font-poppins text-[10.5px] text-ocean-900/70">
                      {location?.name ?? 'Facility'} · {formatDate(r.requested_date)}
                    </p>
                    <p className="font-poppins text-[10px] text-ocean-900/50">
                      Updated {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(r.updated_at))}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <p className="font-poppins text-[11px] text-ocean-900/60">
        Account moderation, event filters and media oversight live on the{' '}
        <Link href="/dashboard/admin/oversight" className="font-semibold underline underline-offset-2">
          oversight console
        </Link>
        .
      </p>
    </div>
  )
}
