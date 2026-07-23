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
 * Musician dashboard — approved design.
 * Welcome banner · four summary tiles · Upcoming Performance / Pending
 * Requests / Announcements.
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

export default async function MusicianDashboardPage() {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: musician } = await supabase
    .from('musicians')
    .select('id, name, first_name, profile_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`

  const [upcoming, pending, announcements] = musician
    ? await Promise.all([
        supabase
          .from('requests')
          .select('id, requested_date, requested_start_time, requested_end_time, status, center_locations(name, address)')
          .eq('musician_id', musician.id)
          .eq('status', 'accepted')
          .gte('requested_date', today)
          .order('requested_date', { ascending: true })
          .limit(4),
        supabase
          .from('requests')
          .select('id, requested_date, requested_start_time, requested_end_time, center_locations(name, address)')
          .eq('musician_id', musician.id)
          .in('status', ['initiated', 'matched'])
          .order('requested_date', { ascending: true })
          .limit(4),
        supabase
          .from('alerts')
          .select('id, title, body, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4),
      ])
    : [{ data: null }, { data: null }, { data: null }]

  const { count: monthCount } = musician
    ? await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('musician_id', musician.id)
        .eq('status', 'accepted')
        .gte('requested_date', monthStart)
    : { count: 0 }

  const upcomingList = upcoming?.data ?? []
  const pendingList = pending?.data ?? []
  const announcementList = announcements?.data ?? []
  const displayName = musician?.first_name ?? musician?.name ?? ''

  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <WelcomeBanner
        title="Welcome back,"
        name={displayName ? `${displayName}` : '(Name of the Musician)'}
        subtitle="Thank you for using your gift of music to bring joy and connection to memory care communities."
      />

      {!musician?.profile_complete && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-5">
          <h2 className="font-garamond text-[19px] font-bold text-amber-900">Finish setting up your profile</h2>
          <p className="mt-1 font-poppins text-[11.5px] text-amber-900/90">
            Facilities can&apos;t send you performance requests until your profile is complete.
          </p>
          <Link
            href="/onboarding/musician"
            className="mt-3 inline-block rounded-md bg-ocean-800 px-4 py-2 font-poppins text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-ocean-700"
          >
            Complete my profile
          </Link>
        </div>
      )}

      {/* ---- Summary tiles ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DASH_ICONS.calendar}
          title="Upcoming Performance"
          value={`${upcomingList.length} scheduled`}
          eyebrow="This week"
          actionLabel="View schedule"
          actionHref="/dashboard/schedule"
        />
        <StatCard
          icon={DASH_ICONS.handshake}
          title="Pending Requests"
          value={`${pendingList.length} waiting`}
          eyebrow="New requests"
          actionLabel="Review requests"
          actionHref="/dashboard/requests"
        />
        <StatCard
          icon={DASH_ICONS.megaphone}
          title="Announcements"
          value={`${announcementList.length} update${announcementList.length === 1 ? '' : 's'}`}
          eyebrow="New updates"
          actionLabel="View announcements"
          actionHref="/dashboard/alerts"
        />
        <StatCard
          icon={DASH_ICONS.clock}
          title="Hours Completed"
          value={`${monthCount ?? 0} performance${(monthCount ?? 0) === 1 ? '' : 's'}`}
          eyebrow="This month"
          actionLabel="View hours"
          actionHref="/dashboard/schedule"
        />
      </div>

      {/* ---- Panels ---- */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Upcoming Performance"
          viewAllHref="/dashboard/schedule"
          footer={<PanelButton href="/dashboard/schedule">View full schedule</PanelButton>}
        >
          {upcomingList.length === 0 ? (
            <EmptyState
              message="No performances booked yet. Set your availability so facilities can find you."
              actionLabel="Set availability"
              actionHref="/dashboard/musician/availability"
            />
          ) : (
            <ul className="space-y-4">
              {upcomingList.map((item) => {
                const location = Array.isArray(item.center_locations) ? item.center_locations[0] : item.center_locations
                return (
                  <li key={item.id} className="border-b border-ocean-200/70 pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-3">
                      <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-ocean-200 font-poppins text-[12.9px] font-semibold text-ocean-900">
                        {formatDate(item.requested_date)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-poppins text-[11.1px] font-bold text-ocean-900">
                          {location?.name ?? 'Facility'}
                        </p>
                        <p className="truncate font-poppins text-[11.1px] text-ocean-900/80">{location?.address ?? ''}</p>
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

        <Panel
          title="Pending Requests"
          viewAllHref="/dashboard/requests"
          footer={<PanelButton href="/dashboard/requests">View all requests</PanelButton>}
        >
          {pendingList.length === 0 ? (
            <EmptyState message="No requests waiting on you right now." />
          ) : (
            <ul className="space-y-4">
              {pendingList.map((item) => {
                const location = Array.isArray(item.center_locations) ? item.center_locations[0] : item.center_locations
                return (
                  <li key={item.id} className="border-b border-ocean-200/70 pb-4 last:border-0 last:pb-0">
                    <p className="font-poppins text-[11.1px] font-bold text-ocean-900">{location?.name ?? 'Facility'}</p>
                    <p className="font-poppins text-[11.1px] text-ocean-900/80">{location?.address ?? ''}</p>
                    <p className="font-poppins text-[11.1px] text-ocean-900/80">
                      {formatDate(item.requested_date)} · {timeRange(item.requested_start_time, item.requested_end_time)}
                    </p>
                    <div className="mt-2">
                      <Link
                        href={`/dashboard/requests/${item.id}/propose`}
                        className="inline-block rounded-md border border-ocean-800/70 px-4 py-1.5 font-poppins text-[7.6px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

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
