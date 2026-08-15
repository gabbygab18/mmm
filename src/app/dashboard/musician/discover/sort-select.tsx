'use client'

import { useRouter } from 'next/navigation'

/** Single "Sort by" dropdown that navigates on change — no separate submit
    control, matching the approved design.

    Builds the destination URL itself from plain serializable params rather
    than taking a href-building function as a prop: functions can't cross
    the server/client boundary (only plain data can), which is what crashed
    this in production — "Functions cannot be passed directly to Client
    Components". */
export function SortSelect({
  basePath,
  params,
  sort,
}: {
  basePath: string
  params: Record<string, string | undefined>
  sort: string
}) {
  const router = useRouter()

  const hrefFor = (nextSort: string) => {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries({ ...params, sort: nextSort, page: undefined })) {
      if (value) qs.set(key, value)
    }
    const query = qs.toString()
    return `${basePath}${query ? `?${query}` : ''}`
  }

  return (
    <select
      value={sort}
      onChange={(e) => router.push(hrefFor(e.target.value))}
      className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
    >
      <option value="nearest">Nearest</option>
      <option value="name">Name</option>
    </select>
  )
}
