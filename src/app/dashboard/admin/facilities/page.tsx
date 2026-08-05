import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminAccountTable, type AdminAccountRow } from '@/components/mmm/admin-account-table'
import { toggleCenterApprovalAction, removeCenterAccountAction, toggleCenterConfirmedAction } from '../accounts/actions'

export const metadata = { title: "Facilities | Margaret's MemoryCare Music" }

type Row = {
  id: string
  user_id: string
  name: string
  resident_count: number | null
  profile_complete: boolean
  approved: boolean
  confirmed: boolean
  created_at: string
  deleted_at: string | null
  username: string | null
}

/**
 * Admin → Facilities. Every registered memory care community, newest first,
 * with the approve/disable control. `?status=pending` narrows it to those
 * awaiting review, which is where the dashboard card points.
 */
export default async function AdminFacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const { status } = await searchParams
  const pendingOnly = status === 'pending'

  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('centers')
    .select('id, user_id, name, resident_count, profile_complete, approved, confirmed, created_at, deleted_at, username')
  if (pendingOnly) query = query.eq('approved', false).is('deleted_at', null)

  const { data } = await query.order('created_at', { ascending: false }).limit(250)
  const centers = (data ?? []) as Row[]

  const rows: AdminAccountRow[] = centers.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.name || 'Unnamed facility',
    detail: c.resident_count ? `${c.resident_count} residents` : 'Resident count not set',
    profileComplete: c.profile_complete,
    approved: c.approved,
    confirmed: c.confirmed,
    deletedAt: c.deleted_at,
    createdAt: c.created_at,
    href: c.username ? `/discover/center/${c.username}` : undefined,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Facilities</h1>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            {pendingOnly ? 'Accounts awaiting review.' : 'Every registered memory care community, newest first.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/facilities"
            className={`rounded-lg px-4 py-2 font-poppins text-[11.5px] font-bold uppercase tracking-[0.1em] transition ${
              pendingOnly ? 'border border-ocean-800/50 text-ocean-900 hover:bg-ocean-900/5' : 'bg-ocean-800 text-white'
            }`}
          >
            All
          </Link>
          <Link
            href="/dashboard/admin/facilities?status=pending"
            className={`rounded-lg px-4 py-2 font-poppins text-[11.5px] font-bold uppercase tracking-[0.1em] transition ${
              pendingOnly ? 'bg-ocean-800 text-white' : 'border border-ocean-800/50 text-ocean-900 hover:bg-ocean-900/5'
            }`}
          >
            Awaiting review
          </Link>
        </div>
      </div>

      <div className="mt-7">
        <AdminAccountTable
          rows={rows}
          action={toggleCenterApprovalAction}
          removeAction={removeCenterAccountAction}
          confirmAction={toggleCenterConfirmedAction}
          emptyMessage={pendingOnly ? 'No facilities are awaiting review.' : 'No facilities have registered yet.'}
        />
      </div>
    </div>
  )
}
