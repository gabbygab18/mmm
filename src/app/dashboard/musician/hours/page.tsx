import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EmptyState, Panel } from '@/components/mmm/dashboard-ui'

export const metadata = { title: "Volunteer Hours | Margaret's MemoryCare Music" }

type CompletedRow = {
  id: string
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  center_locations: { name: string | null; address: string | null } | { name: string | null; address: string | null }[] | null
}

/** Length of one booking in hours, or 0 when the times were never filled in. */
function hoursFor(row: Pick<CompletedRow, 'requested_start_time' | 'requested_end_time'>) {
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

export default async function VolunteerHoursPage() {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: musician } = await supabase.from('musicians').select('id').eq('user_id', user.id).maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = `${today.slice(0, 7)}-01`
  const yearStart = `${today.slice(0, 4)}-01-01`

  const { data } = musician
    ? await supabase
        .from('requests')
        .select('id, requested_date, requested_start_time, requested_end_time, center_locations(name, address)')
        .eq('musician_id', musician.id)
        .eq('status', 'completed')
        .order('requested_date', { ascending: false })
    : { data: null }

  const completed = (data ?? []) as CompletedRow[]

  const hoursThisMonth = completed
    .filter((r) => r.requested_date >= monthStart)
    .reduce((sum, r) => sum + hoursFor(r), 0)
  const hoursThisYear = completed
    .filter((r) => r.requested_date >= yearStart)
    .reduce((sum, r) => sum + hoursFor(r), 0)
  const hoursAllTime = completed.reduce((sum, r) => sum + hoursFor(r), 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Volunteer Hours</h1>
      <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
        Hours are derived from your completed performances — no need to log them yourself.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Panel title="This Month">
          <p className="font-garamond text-3xl font-bold text-ocean-900">{round1(hoursThisMonth)}</p>
          <p className="mt-1 font-poppins text-[11px] text-ocean-900/60">hours</p>
        </Panel>
        <Panel title="This Year">
          <p className="font-garamond text-3xl font-bold text-ocean-900">{round1(hoursThisYear)}</p>
          <p className="mt-1 font-poppins text-[11px] text-ocean-900/60">hours</p>
        </Panel>
        <Panel title="All Time">
          <p className="font-garamond text-3xl font-bold text-ocean-900">{round1(hoursAllTime)}</p>
          <p className="mt-1 font-poppins text-[11px] text-ocean-900/60">hours</p>
        </Panel>
      </div>

      <div className="mt-7">
        <Panel title="Completed Performances">
          {completed.length === 0 ? (
            <EmptyState message="No completed performances yet — they'll show up here, with hours, once a booking is marked complete." />
          ) : (
            <ul className="divide-y divide-ocean-200/70">
              {completed.map((r) => {
                const location = Array.isArray(r.center_locations) ? r.center_locations[0] : r.center_locations
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-poppins text-[12.5px] font-semibold text-ocean-900">
                        {location?.name ?? 'Facility'}
                      </p>
                      <p className="truncate font-poppins text-[10.5px] text-ocean-900/70">
                        {location?.address ?? ''} · {formatDate(r.requested_date)}
                      </p>
                    </div>
                    <span className="shrink-0 font-poppins text-[12.5px] font-semibold text-ocean-900">
                      {round1(hoursFor(r))} hrs
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
