'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CONTENT_FIELDS, CONTENT_GROUPS } from '@/lib/mmm/site-content'

export type SaveContentResult = { ok: boolean; error?: string }

const KNOWN_KEYS = new Set(CONTENT_FIELDS.map((f) => f.key))

/**
 * Saves the marketing copy for one page.
 *
 * A field left identical to the shipped text, or cleared, is deleted rather
 * than stored: the table holds overrides only, so "reset to default" and "never
 * touched" are the same state and there is no stale copy to go looking for
 * later. Keys are checked against the registry so nothing outside it can be
 * written even if the form is tampered with.
 */
export async function saveSiteContentAction(
  groupId: string,
  values: Record<string, string>,
): Promise<SaveContentResult> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return { ok: false, error: 'Not authorised.' }

  const group = CONTENT_GROUPS.find((g) => g.id === groupId)
  if (!group) return { ok: false, error: 'Unknown page.' }

  const fields = group.sections.flatMap((s) => s.fields)
  const upserts: { key: string; value: string; updated_at: string }[] = []
  const deletes: string[] = []
  const now = new Date().toISOString()

  for (const field of fields) {
    if (!KNOWN_KEYS.has(field.key)) continue
    const next = (values[field.key] ?? '').trim()
    if (!next || next === field.default.trim()) {
      deletes.push(field.key)
    } else {
      upserts.push({ key: field.key, value: next, updated_at: now })
    }
  }

  const supabase = await createSupabaseServerClient()

  if (upserts.length) {
    const { error } = await supabase.from('site_content').upsert(upserts, { onConflict: 'key' })
    if (error) return { ok: false, error: error.message }
  }

  if (deletes.length) {
    const { error } = await supabase.from('site_content').delete().in('key', deletes)
    if (error) return { ok: false, error: error.message }
  }

  // The marketing pages are statically rendered, so they have to be told.
  revalidatePath('/dashboard/admin/content')
  revalidatePath(group.href)

  return { ok: true }
}
