import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { UsersManager, type AdminUserRow } from './users-manager'

export const dynamic = 'force-dynamic'

const PER_PAGE = 200

export default async function AdminUsersPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const currentUser = await requireAuthenticatedUser()
  const admin = createSupabaseAdminClient()

  // Auth users (GoTrue). `user_metadata` here is the DB's `raw_user_meta_data`.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: PER_PAGE })

  if (error) {
    return (
      <section className="mx-auto max-w-[1240px]">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Could not load users: {error.message}. Confirm{' '}
          <code className="rounded bg-white px-1">SUPABASE_SERVICE_ROLE_KEY</code> is set.
        </div>
      </section>
    )
  }

  const authUsers = data?.users ?? []

  // Authoritative role lives in public.users — join it (service role bypasses RLS).
  const ids = authUsers.map((u) => u.id)
  const roleById = new Map<string, string | null>()
  if (ids.length > 0) {
    const { data: roleRows } = await admin.from('users').select('id, role').in('id', ids)
    for (const row of roleRows ?? []) roleById.set(row.id, row.role ?? null)
  }

  const rows: AdminUserRow[] = authUsers.map((u) => {
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    const fullName =
      (meta.full_name as string) ||
      [meta.first_name, meta.last_name].filter(Boolean).join(' ') ||
      ''
    // `banned_until` isn't on the typed User but is present in the REST payload.
    const bannedUntil = (u as unknown as { banned_until?: string | null }).banned_until ?? null

    return {
      id: u.id,
      email: u.email ?? '',
      phone: u.phone ?? null,
      displayName: fullName,
      role: roleById.get(u.id) ?? (meta.role as string) ?? null,
      provider: (u.app_metadata?.provider as string) ?? null,
      createdAt: u.created_at ?? null,
      confirmedAt: (u.email_confirmed_at ?? u.confirmed_at) ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
      bannedUntil,
      isSsoUser: Boolean((u as unknown as { is_sso_user?: boolean }).is_sso_user),
      raw: {
        id: u.id,
        email: u.email ?? null,
        phone: u.phone ?? null,
        banned_until: bannedUntil,
        created_at: u.created_at ?? null,
        confirmed_at: (u.email_confirmed_at ?? u.confirmed_at) ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        role: roleById.get(u.id) ?? null,
        app_metadata: u.app_metadata ?? {},
        user_metadata: meta,
      },
    }
  })

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">
      <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Users</h1>
      <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
        Every account across the platform — auth records, roles, and sign-in activity.
      </p>

      <div className="mt-7">
        <UsersManager users={rows} currentUserId={currentUser.id} />
      </div>
    </div>
  )
}
