'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { OPTION_KINDS } from '@/lib/mmm/site-options'

export type OptionResult = { ok: boolean; error?: string }

const KNOWN_KINDS = new Set(OPTION_KINDS.map((k) => k.kind as string))

async function guard() {
  const role = await getCurrentUserRole()
  return role === 'admin'
}

/**
 * The registration forms are the only consumers, and they are rendered on the
 * server, so every change has to invalidate them as well as this screen.
 */
function revalidateConsumers() {
  revalidatePath('/dashboard/admin/categories')
  revalidatePath('/register/musician')
  revalidatePath('/register/facility')
}

export async function addOptionAction(kind: string, label: string): Promise<OptionResult> {
  if (!(await guard())) return { ok: false, error: 'Not authorised.' }
  if (!KNOWN_KINDS.has(kind)) return { ok: false, error: 'Unknown category.' }

  const trimmed = label.trim()
  if (!trimmed) return { ok: false, error: 'Please type a name.' }
  if (trimmed.length > 120) return { ok: false, error: 'That name is too long.' }

  const supabase = await createSupabaseServerClient()

  // New entries go to the end of the list rather than the top.
  const { data: last } = await supabase
    .from('site_options')
    .select('sort_order')
    .eq('kind', kind)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1

  const { error } = await supabase
    .from('site_options')
    .insert({ kind, label: trimmed, sort_order: nextOrder, active: true })

  if (error) {
    // The (kind, label) unique constraint is the common failure here.
    if (error.code === '23505') return { ok: false, error: 'That one is already on the list.' }
    return { ok: false, error: error.message }
  }

  revalidateConsumers()
  return { ok: true }
}

export async function renameOptionAction(id: string, label: string): Promise<OptionResult> {
  if (!(await guard())) return { ok: false, error: 'Not authorised.' }

  const trimmed = label.trim()
  if (!trimmed) return { ok: false, error: 'Please type a name.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('site_options')
    .update({ label: trimmed, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That one is already on the list.' }
    return { ok: false, error: error.message }
  }

  revalidateConsumers()
  return { ok: true }
}

/**
 * Hiding rather than deleting is the default: profiles already saved against a
 * label keep reading correctly, the entry simply stops being offered on new
 * forms.
 */
export async function setOptionActiveAction(id: string, active: boolean): Promise<OptionResult> {
  if (!(await guard())) return { ok: false, error: 'Not authorised.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('site_options')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidateConsumers()
  return { ok: true }
}

export async function deleteOptionAction(id: string): Promise<OptionResult> {
  if (!(await guard())) return { ok: false, error: 'Not authorised.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('site_options').delete().eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidateConsumers()
  return { ok: true }
}

/** Moves one entry up or down by swapping its position with its neighbour. */
export async function moveOptionAction(id: string, direction: 'up' | 'down'): Promise<OptionResult> {
  if (!(await guard())) return { ok: false, error: 'Not authorised.' }

  const supabase = await createSupabaseServerClient()

  const { data: row } = await supabase
    .from('site_options')
    .select('id, kind, sort_order')
    .eq('id', id)
    .maybeSingle()

  const current = row as { id: string; kind: string; sort_order: number } | null
  if (!current) return { ok: false, error: 'That entry no longer exists.' }

  // Filters have to be applied before .order() — the builder it returns has no
  // .gt()/.lt() on it, so chaining them afterwards fails at runtime.
  const base = supabase.from('site_options').select('id, sort_order').eq('kind', current.kind)
  const filtered =
    direction === 'down'
      ? base.gt('sort_order', current.sort_order)
      : base.lt('sort_order', current.sort_order)

  const { data: neighbourRow } = await filtered
    .order('sort_order', { ascending: direction === 'down' })
    .limit(1)
    .maybeSingle()

  const neighbour = neighbourRow as { id: string; sort_order: number } | null
  if (!neighbour) return { ok: true } // Already at the end.

  const { error: a } = await supabase
    .from('site_options')
    .update({ sort_order: neighbour.sort_order })
    .eq('id', current.id)
  if (a) return { ok: false, error: a.message }

  const { error: b } = await supabase
    .from('site_options')
    .update({ sort_order: current.sort_order })
    .eq('id', neighbour.id)
  if (b) return { ok: false, error: b.message }

  revalidateConsumers()
  return { ok: true }
}
