'use client'

import Link from 'next/link'
import { FormEvent } from 'react'

/**
 * Facility search/filter bar — a plain GET form (works with JS disabled),
 * with selects auto-submitting on change so there's no separate "Search"
 * button to click, matching the approved design. Text fields submit on
 * Enter, same as any form.
 */
export function FacilityFilterBar({
  action,
  q,
  zip,
  distance,
  state,
  city,
  distanceOptions,
  stateOptions,
  cityOptions,
  hasActiveFilters,
  resetHref,
}: {
  action: string
  q?: string
  zip?: string
  distance?: string
  state?: string
  city?: string
  distanceOptions: readonly number[]
  stateOptions: readonly string[]
  cityOptions: readonly string[]
  hasActiveFilters: boolean
  resetHref: string
}) {
  const submitOnChange = (e: FormEvent<HTMLSelectElement>) => {
    e.currentTarget.form?.requestSubmit()
  }

  return (
    <form action={action} className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
      <h2 className="font-poppins text-[15px] font-bold text-ocean-900">Find facilities near you.</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">Search Facilities</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name"
            className="w-full rounded-lg border border-ocean-300 px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">ZIP Code</span>
          <input
            type="text"
            name="zip"
            defaultValue={zip}
            inputMode="numeric"
            placeholder="Enter ZIP Code"
            className="w-full rounded-lg border border-ocean-300 px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">Distance</span>
          <select
            name="distance"
            defaultValue={distance ?? ''}
            onChange={submitOnChange}
            className="w-full rounded-lg border border-ocean-300 px-3 py-2 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          >
            <option value="">Any distance</option>
            {distanceOptions.map((d) => (
              <option key={d} value={d}>
                Within {d} miles
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">State</span>
          <select
            name="state"
            defaultValue={state ?? ''}
            onChange={submitOnChange}
            className="w-full rounded-lg border border-ocean-300 px-3 py-2 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          >
            <option value="">All States</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">City</span>
          <select
            name="city"
            defaultValue={city ?? ''}
            onChange={submitOnChange}
            className="w-full rounded-lg border border-ocean-300 px-3 py-2 text-sm text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
          >
            <option value="">All Cities</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col items-center">
          <span className="mb-1 block text-[11px] font-bold text-ocean-900">Reset</span>
          {hasActiveFilters ? (
            <Link
              href={resetHref}
              aria-label="Reset filters"
              className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-ocean-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/facility-profile/icon-reset.png" alt="" className="h-5 w-5" />
            </Link>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center opacity-25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/facility-profile/icon-reset.png" alt="" className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
    </form>
  )
}
