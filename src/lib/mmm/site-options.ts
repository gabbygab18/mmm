import { cache } from 'react'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import {
  DIRECTOR_JOB_TITLES,
  EQUIPMENT_NEEDED,
  GENRES,
  INSTRUMENTS,
  LANGUAGES,
  PERFORMANCE_LOCATIONS,
  PERFORMANCE_TYPES,
} from '@/lib/mmm/options'

/**
 * Admin-managed vocabularies.
 *
 * The lists in options.ts stay put and stay the fallback: they are what the
 * table is seeded from, and what the forms use if the table has no rows for a
 * kind or cannot be reached. A deployment that runs ahead of the migration
 * therefore behaves exactly as before rather than rendering empty dropdowns.
 *
 * Only the lists worth curating are here. Fixed vocabularies — US states, days
 * of the week, time bands — are not editable and stay as constants.
 */

export const OPTION_KINDS = [
  { kind: 'instrument', label: 'Instruments', fallback: INSTRUMENTS },
  { kind: 'genre', label: 'Musical genres', fallback: GENRES },
  { kind: 'language', label: 'Languages', fallback: LANGUAGES },
  { kind: 'performance_type', label: 'Performance types', fallback: PERFORMANCE_TYPES },
  { kind: 'performance_location', label: 'Performance locations', fallback: PERFORMANCE_LOCATIONS },
  { kind: 'equipment', label: 'Equipment needed', fallback: EQUIPMENT_NEEDED },
  { kind: 'director_job_title', label: 'Director job titles', fallback: DIRECTOR_JOB_TITLES },
] as const

export type OptionKind = (typeof OPTION_KINDS)[number]['kind']

export type SiteOptionRow = {
  id: string
  kind: string
  label: string
  sort_order: number
  active: boolean
}

const FALLBACKS: Record<string, readonly string[]> = Object.fromEntries(
  OPTION_KINDS.map((k) => [k.kind, k.fallback]),
)

/** Every row, including the inactive ones — for the admin screen. */
export const getAllSiteOptions = cache(async (): Promise<SiteOptionRow[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data, error } = await supabase
      .from('site_options')
      .select('id, kind, label, sort_order, active')
      .order('kind')
      .order('sort_order')
      .order('label')
    if (error || !data) return []
    return data as SiteOptionRow[]
  } catch {
    return []
  }
})

/**
 * The active labels for each kind, ready to drop into a form. Any kind with no
 * rows falls back to the constant, so the forms are never empty.
 */
export const getSiteOptionLists = cache(async (): Promise<Record<string, string[]>> => {
  const rows = await getAllSiteOptions()

  const lists: Record<string, string[]> = {}
  for (const row of rows) {
    if (!row.active) continue
    ;(lists[row.kind] ??= []).push(row.label)
  }

  for (const { kind } of OPTION_KINDS) {
    if (!lists[kind]?.length) lists[kind] = [...(FALLBACKS[kind] ?? [])]
  }

  return lists
})
