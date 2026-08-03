import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AdminAccountTable, type AdminAccountRow } from '@/components/mmm/admin-account-table'
import { toggleMusicianApprovalAction, removeMusicianAccountAction } from '../accounts/actions'

export const metadata = { title: "Musicians | Margaret's MemoryCare Music" }

type Row = {
  id: string
  user_id: string
  name: string
  zip_code: string | null
  profile_complete: boolean
  approved: boolean
  created_at: string
  deleted_at: string | null
  username: string | null
}

/**
 * Admin → Musicians. Everyone who has registered as a musician, newest first,
 * with the approve/disable control.
 *
 * `?status=pending` narrows it to accounts awaiting review — that is where the
 * dashboard's "Pending Musicians" card points.
 */
export default async function AdminMusiciansPage({
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
    .from('musicians')
    .select('id, user_id, name, zip_code, profile_complete, approved, created_at, deleted_at, username')
  if (pendingOnly) query = query.eq('approved', false).is('deleted_at', null)

  const { data } = await query.order('created_at', { ascending: false }).limit(250)
  const musicians = (data ?? []) as Row[]

  const rows: AdminAccountRow[] = musicians.map((m) => ({
    id: m.id,
    userId: m.user_id,
    name: m.name || 'Unnamed musician',
    detail: m.zip_code ? `ZIP ${m.zip_code}` : 'No service area set',
    profileComplete: m.profile_complete,
    approved: m.approved,
    deletedAt: m.deleted_at,
    createdAt: m.created_at,
    href: m.username ? `/discover/musician/${m.username}` : undefined,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Musicians</h1>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            {pendingOnly ? 'Accounts awaiting review.' : 'Every registered musician, newest first.'}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/musicians"
            className={`rounded-lg px-4 py-2 font-poppins text-[11.5px] font-bold uppercase tracking-[0.1em] transition ${
              pendingOnly ? 'border border-ocean-800/50 text-ocean-900 hover:bg-ocean-900/5' : 'bg-ocean-800 text-white'
            }`}
          >
            All
          </Link>
          <Link
            href="/dashboard/admin/musicians?status=pending"
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
          action={toggleMusicianApprovalAction}
          removeAction={removeMusicianAccountAction}
          emptyMessage={pendingOnly ? 'No musicians are awaiting review.' : 'No musicians have registered yet.'}
        />
      </div>
    </div>
  )
}
