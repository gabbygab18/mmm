'use client'

import { useRouter } from 'next/navigation'

/** Single "Sort by" dropdown that navigates on change — matches the
    Browse Facilities pattern, not a two-pill toggle. */
export function LocationSortSelect({ basePath, sort }: { basePath: string; sort: string }) {
  const router = useRouter()

  return (
    <select
      value={sort}
      onChange={(e) => router.push(`${basePath}?sort=${e.target.value}`)}
      className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
    >
      <option value="nearest">Newest</option>
      <option value="name">Name</option>
    </select>
  )
}
