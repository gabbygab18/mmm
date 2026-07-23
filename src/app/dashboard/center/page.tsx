import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  DASH_ICONS,
  EmptyState,
  Panel,
  PanelButton,
  StatCard,
  WelcomeBanner,
} from '@/components/mmm/dashboard-ui'

/**
 * Facility dashboard — approved design.
 * Welcome banner · four summary tiles · Upcoming Visits · Request a
 * Performance · Announcements · Resources.
 */

function formatDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d))
}

function formatTime(value?: string | null) {
  if (!value) return null
  const [h, min] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${`${min}`.padStart(2, '0')} ${period}`
}

function timeRange(start?: string | null, end?: string | null) {
  const a = formatTime(start)
  const b = formatTime(end)
  return a && b ? `${a} – ${b}` : a ?? ''
}

export default async function CenterDashboardPage() {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: center } = await supabase
    .from('centers')
    .select('id, name, profile_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: locations } = center
    ? await supabase.from('center_locations').select('id, name, address').eq('center_id', center.id)
    : { data: null }

  const locationIds = (locations ?? []).map((l) => l.id)
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`

  const [upcoming, pending, announcements] =
    locationIds.length > 0
      ? await Promise.all([
          supabase
            .from('requests')
            .select('id, requested_date, requested_start_time, requested_end_time, musicians(name, first_name, last_name)')
            .in('center_location_id', locationIds)
            .eq('status', 'accepted')
            .gte('requested_date', today)
            .order('requested_date', { ascending: true })
            .limit(4),
          supabase
            .from('requests')
            .select('id')
            .in('center_location_id', locationIds)
            .in('status', ['initiated', 'matched']),
          supabase
            .from('alerts')
            .select('id, title, body, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(4),
        ])
      : [{ data: null }, { data: null }, { data: null }]

  const { count: pastCount } =
    locationIds.length > 0
      ? await supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .in('center_location_id', locationIds)
          .eq('status', 'accepted')
          .gte('requested_date', monthStart)
          .lt('requested_date', today)
      : { count: 0 }

  const upcomingList = upcoming?.data ?? []
  const pendingCount = (pending?.data ?? []).length
  const announcementList = announcements?.data ?? []

  // Musicians are shown publicly as first name plus last initial.
  const musicianLabel = (m: { name?: string | null; first_name?: string | null; last_name?: string | null } | null) => {
    if (!m) return 'Musician'
    if (m.first_name) return `${m.first_name}${m.last_name ? ` ${m.last_name[0]}.` : ''}`
    return m.name ?? 'Musician'
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <WelcomeBanner
        title="Welcome back,"
        name={center?.name ?? '(Name of the Facility)'}
        subtitle="Thank you for creating moments of joy and connection through the healing of live music."
      />

      {!center?.profile_complete && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-5">
          <h2 className="font-garamond text-[19px] font-bold text-amber-900">Finish setting up your community</h2>
          <p className="mt-1 font-poppins text-[11.5px] text-amber-900/90">
            Add your location details so we can match you with nearby volunteer musicians.
          </p>
          <Link
            href="/onboarding/center"
            className="mt-3 inline-block rounded-md bg-ocean-800 px-4 py-2 font-poppins text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-ocean-700"
          >
            Complete my profile
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DASH_ICONS.calendar}
          title="Upcoming Visits"
          value={`${upcomingList.length} scheduled`}
          eyebrow="This week"
          actionLabel="View schedule"
          actionHref="/dashboard/schedule"
        />
        <StatCard
          icon={DASH_ICONS.handshake}
          title="Pending Requests"
          value={`${pendingCount} waiting`}
          eyebrow="New requests"
          actionLabel="Review requests"
          actionHref="/dashboard/requests"
        />
        <StatCard
          icon={DASH_ICONS.music}
          title="Past Performances"
          value={`${pastCount ?? 0} this month`}
          eyebrow="This month"
          actionLabel="View history"
          actionHref="/dashboard/schedule"
        />
        <StatCard
          icon={DASH_ICONS.clock}
          title="Hours of Music"
          value={`${(pastCount ?? 0) * 1} hour${(pastCount ?? 0) === 1 ? '' : 's'}`}
          eyebrow="This month"
          actionLabel="View hours"
          actionHref="/dashboard/schedule"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Upcoming Visits"
          viewAllHref="/dashboard/schedule"
          footer={<PanelButton href="/dashboard/schedule">View full schedule</PanelButton>}
        >
          {upcomingList.length === 0 ? (
            <EmptyState
              message="No visits booked yet. Send a performance request to get started."
              actionLabel="Request a performance"
              actionHref="/dashboard/requests/new"
            />
          ) : (
            <ul className="space-y-4">
              {upcomingList.map((item) => {
                const musician = Array.isArray(item.musicians) ? item.musicians[0] : item.musicians
                return (
                  <li key={item.id} className="border-b border-ocean-200/70 pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-ocean-200 font-poppins text-[12.9px] font-semibold text-ocean-900">
                        {formatDate(item.requested_date)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-poppins text-[11.1px] font-bold text-ocean-900">
                          {musicianLabel(musician)}
                        </p>
                        <p className="font-poppins text-[11.1px] text-ocean-900/80">
                          {timeRange(item.requested_start_time, item.requested_end_time)}
                        </p>
                        <p className="mt-1 font-poppins text-[11.1px] font-bold uppercase tracking-wide text-ocean-800">
                          Confirmed
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          {/* Request a performance — the primary action for a facility. */}
          <section className="relative overflow-hidden rounded-2xl bg-[#fdfaf3] px-6 py-6 shadow-sm">
            <h2 className="font-garamond text-[19px] font-bold text-ocean-900">Request a Performance</h2>
            <p className="mt-1 max-w-[280px] font-poppins text-[10.3px] leading-relaxed text-ocean-900/85">
              Invite volunteer musicians to bring live music and joy to your residents.
            </p>
            <Link
              href="/dashboard/requests/new"
              className="mt-4 inline-block rounded-md bg-ocean-800 px-6 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3)] transition hover:bg-ocean-700"
            >
              Request now
            </Link>
          </section>

          <Panel title="Resources" viewAllHref="/education">
            <ul className="space-y-3">
              <li>
                <Link href="/education" className="block transition hover:opacity-80">
                  <p className="font-poppins text-[11.1px] font-bold text-ocean-900">Performance Guidelines</p>
                  <p className="font-poppins text-[9.3px] text-ocean-900/75">Best practices for visits</p>
                </Link>
              </li>
              <li>
                <Link href="/education" className="block transition hover:opacity-80">
                  <p className="font-poppins text-[11.1px] font-bold text-ocean-900">Suggested Songs</p>
                  <p className="font-poppins text-[9.3px] text-ocean-900/75">By era and genre</p>
                </Link>
              </li>
            </ul>
          </Panel>
        </div>

        <Panel title="Announcements" viewAllHref="/dashboard/alerts">
          {announcementList.length === 0 ? (
            <EmptyState message="Nothing new from the MMM team." />
          ) : (
            <ul className="space-y-3">
              {announcementList.map((a) => (
                <li key={a.id} className="rounded-xl bg-ocean-100/80 px-4 py-3">
                  <p className="font-poppins text-[11.1px] font-bold text-ocean-900">{a.title}</p>
                  {a.body && <p className="mt-0.5 font-poppins text-[11.1px] text-ocean-900/85">{a.body}</p>}
                  <p className="mt-1 font-poppins text-[7px] uppercase tracking-wide text-ocean-900/60">
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
