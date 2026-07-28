'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole, requireAuthenticatedUser, type AppRole } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = new Set<AppRole>(['musician', 'center_coordinator', 'admin'])

export type DeleteUsersResult = {
  ok: boolean
  deleted: string[]
  failed: { id: string; error: string }[]
  error?: string
}

/**
 * Permanently delete one or more auth users.
 *
 * Re-checks the caller is an admin server-side (never trust the client), and
 * refuses to let an admin delete their own account. Deleting the auth user
 * cascades to `public.users` if you have an ON DELETE CASCADE / trigger set up;
 * otherwise clean up dependent rows here first.
 */
export async function deleteUsersAction(ids: string[]): Promise<DeleteUsersResult> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') {
    return { ok: false, deleted: [], failed: [], error: 'Not authorized.' }
  }

  const currentUser = await requireAuthenticatedUser()
  const targetIds = Array.from(new Set(ids.filter(Boolean)))

  if (targetIds.length === 0) {
    return { ok: false, deleted: [], failed: [], error: 'No users selected.' }
  }
  if (targetIds.includes(currentUser.id)) {
    return { ok: false, deleted: [], failed: [], error: 'You cannot delete your own account here.' }
  }

  const admin = createSupabaseAdminClient()
  const deleted: string[] = []
  const failed: { id: string; error: string }[] = []

  for (const id of targetIds) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) {
      failed.push({ id, error: error.message })
    } else {
      deleted.push(id)
    }
  }

  revalidatePath('/dashboard/admin/users')

  return { ok: failed.length === 0, deleted, failed }
}

export type UpdateRoleResult = { ok: boolean; error?: string }

/**
 * Change a user's role in `public.users` (the authoritative source read by
 * getCurrentUserRole), and mirror it onto the auth user_metadata so the
 * Raw JSON / metadata stays in sync.
 *
 * Admin-gated. An admin cannot demote their own account here — that would risk
 * locking the last admin out of the panel.
 */
export async function updateUserRoleAction(userId: string, role: AppRole): Promise<UpdateRoleResult> {
  const callerRole = await getCurrentUserRole()
  if (callerRole !== 'admin') {
    return { ok: false, error: 'Not authorized.' }
  }
  if (!userId || !VALID_ROLES.has(role)) {
    return { ok: false, error: 'Invalid role.' }
  }

  const currentUser = await requireAuthenticatedUser()
  if (userId === currentUser.id && role !== 'admin') {
    return { ok: false, error: 'You cannot change your own admin role here.' }
  }

  const admin = createSupabaseAdminClient()

  const { error } = await admin.from('users').update({ role }).eq('id', userId)
  if (error) {
    return { ok: false, error: error.message }
  }

  // Best-effort: keep auth metadata consistent (merge onto existing metadata).
  const { data: existing } = await admin.auth.admin.getUserById(userId)
  const meta = (existing?.user?.user_metadata ?? {}) as Record<string, unknown>
  await admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, role } })

  revalidatePath('/dashboard/admin/users')
  return { ok: true }
}
