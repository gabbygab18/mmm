import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: "Reports | Margaret's MemoryCare Music" }

/**
 * Admin → reports. Read-only counts drawn straight from the tables.
 *
 * Every figure is a `head: true` count, so the rows themselves never travel —
 * the page stays cheap as the data grows. Nothing here writes.
 */

const REQUEST_STATUSES = ['initiated', 'matched', 'accepted', 'completed', 'cancelled'] as const

type Tile = { label: string; value: number | null; hint?: string }

/** A count that returns null rather than throwing, so one blocked table cannot blank the page. */
async function countRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
): Promise<number | null> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  return error ? null : (count ?? 0)
}

function StatGrid({ title, tiles }: { title: string; tiles: Tile[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-stone-500">{title}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-stone-600">{tile.label}</p>
            <p className="mt-1 text-3xl font-bold text-stone-900">
              {tile.value === null ? <span className="text-base font-medium text-stone-400">unavailable</span> : tile.value}
            </p>
            {tile.hint && <p className="mt-1 text-xs text-stone-500">{tile.hint}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

export default async function AdminReportsPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createSupabaseServerClient()

  const statusCount = async (status: string) => {
    const { count, error } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)
    return error ? null : (count ?? 0)
  }

  const approvedCount = async (table: string, approved: boolean) => {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('approved', approved)
    return error ? null : (count ?? 0)
  }

  const [
    musicians,
    musiciansApproved,
    musiciansPending,
    centers,
    centersApproved,
    centersPending,
    locations,
    requests,
    inquiries,
    ...statuses
  ] = await Promise.all([
    countRows(supabase, 'musicians'),
    approvedCount('musicians', true),
    approvedCount('musicians', false),
    countRows(supabase, 'centers'),
    approvedCount('centers', true),
    approvedCount('centers', false),
    countRows(supabase, 'center_locations'),
    countRows(supabase, 'requests'),
    countRows(supabase, 'contact_inquiries'),
    ...REQUEST_STATUSES.map((s) => statusCount(s)),
  ])

  const byStatus = Object.fromEntries(REQUEST_STATUSES.map((s, i) => [s, statuses[i] ?? null])) as Record<
    (typeof REQUEST_STATUSES)[number],
    number | null
  >

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Live counts across the platform. Figures update as soon as the underlying records change.
      </p>

      <StatGrid
        title="Musicians"
        tiles={[
          { label: 'Total musicians', value: musicians },
          { label: 'Approved', value: musiciansApproved },
          { label: 'Awaiting approval', value: musiciansPending, hint: 'Approve them from the admin dashboard' },
        ]}
      />

      <StatGrid
        title="Facilities"
        tiles={[
          { label: 'Total facilities', value: centers },
          { label: 'Approved', value: centersApproved },
          { label: 'Awaiting approval', value: centersPending },
          { label: 'Locations registered', value: locations },
        ]}
      />

      <StatGrid
        title="Bookings"
        tiles={[
          { label: 'All requests', value: requests },
          { label: 'Awaiting a musician', value: byStatus.initiated },
          { label: 'Matched', value: byStatus.matched },
          { label: 'Accepted', value: byStatus.accepted },
          { label: 'Completed', value: byStatus.completed },
          { label: 'Cancelled', value: byStatus.cancelled },
        ]}
      />

      <StatGrid
        title="Enquiries"
        tiles={[{ label: 'Contact form messages', value: inquiries, hint: 'Submitted through the public contact page' }]}
      />
    </div>
  )
}
