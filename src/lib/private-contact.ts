import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Personal phone numbers, kept out of `musicians` / `centers`.
 *
 * Those two tables are readable platform-wide — that is what powers discovery —
 * so a number stored on them is reachable off the API by any signed-in account,
 * even when no page renders it. `private_contacts` carries it instead, behind
 * RLS that admits only the owner, an admin, or a counterparty with an accepted
 * or completed booking.
 *
 * Callers do not need to know any of that: reading someone else's number simply
 * returns null when the viewer is not entitled to it, because RLS filters the
 * row out rather than erroring.
 */

/** The caller's own number. Returns null when none is saved. */
export async function readOwnPhone(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await readOwnContact(supabase, userId)
  return data?.phone ?? null
}

/**
 * Both of the caller's saved numbers. `directorPhone` only ever applies to a
 * facility account — a musician has the one number.
 */
export async function readOwnContact(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: { phone: string | null; directorPhone: string | null } | null }> {
  const { data, error } = await supabase
    .from('private_contacts')
    .select('phone, director_phone')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[readOwnContact] failed:', error.message)
    return { data: null }
  }
  if (!data) return { data: null }
  return { data: { phone: data.phone ?? null, directorPhone: data.director_phone ?? null } }
}

/**
 * Save the caller's own number(s). Writing null clears a field.
 *
 * Upsert on the primary key, so this covers both "first time" and "changed it"
 * without the caller having to know which. `directorPhone` is omitted from the
 * payload when not supplied, so a musician saving their profile cannot blank
 * out a field that does not apply to them.
 */
export async function saveOwnPhone(
  supabase: SupabaseClient,
  userId: string,
  phone: string | null,
  directorPhone?: string | null,
): Promise<{ error: string | null }> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    phone: phone?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  if (directorPhone !== undefined) payload.director_phone = directorPhone?.trim() || null

  const { error } = await supabase
    .from('private_contacts')
    .upsert(payload, { onConflict: 'user_id' })

  return { error: error?.message ?? null }
}

/**
 * Numbers for a set of users, keyed by user id.
 *
 * Used on Scheduled Events, where each side needs the other's number for a
 * booking that is already accepted. RLS decides what actually comes back, so
 * this is safe to call with any set of ids — anyone the viewer has not
 * connected with is simply absent from the result.
 */
export async function readPhonesFor(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('private_contacts')
    .select('user_id, phone')
    .in('user_id', userIds)

  if (error) {
    console.error('[readPhonesFor] failed:', error.message)
    return new Map()
  }

  return new Map(
    (data ?? [])
      .filter((row): row is { user_id: string; phone: string } => Boolean(row.phone))
      .map((row) => [row.user_id, row.phone]),
  )
}
