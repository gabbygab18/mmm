import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { US_STATES } from '@/lib/mmm/options'
import { FacilityFilterBar } from './filter-bar'
import { SortSelect } from './sort-select'

const COMP_LABELS: Record<string, string> = {
  free: 'Volunteer (free)',
  'paid-preferred': 'Compensation preferred',
  either: 'Open to either',
}

function formatDistance(value: number | string | null) {
  if (value == null) return 'Distance unavailable'
  const distance = typeof value === 'string' ? Number(value) : value
  return `${distance.toFixed(1)} miles away`
}

const PAGE_SIZE = 8
/** Narrows the already-fetched (unbounded) result set — a musician-chosen
    display filter, not a platform-imposed cutoff. Distinct from the RPC's
    own radius, which is driven by the musician's own travel-radius setting
    and is never overridden here. */
const DISTANCE_FILTERS = [25, 50, 100, 250] as const

type NearbyCenterRow = {
  center_id: string
  location_id: string
  center_name: string
  location_name: string
  location_zip_code: string
  center_profile_image_url: string | null
  location_image_url: string | null
  supports_transport: boolean
  distance_miles: number | string | null
}

type SearchParams = {
  q?: string
  zip?: string
  distance?: string
  state?: string
  city?: string
  sort?: string
  view?: string
  page?: string
}

function buildHref(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides }
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, String(value))
  }
  const query = qs.toString()
  return `/dashboard/musician/discover${query ? `?${query}` : ''}`
}

export default async function MusicianDiscoverPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)
  const view = params.view === 'list' ? 'list' : 'grid'
  const sort = params.sort === 'name' ? 'name' : 'nearest'

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  // Check if musician's own profile is complete. Filtered by user_id, not
  // just RLS: "musicians_view_approved" makes every approved musician's row
  // visible too, so an unfiltered query here returned multiple rows and
  // .maybeSingle() threw "JSON object requested, multiple rows returned".
  const { data: musicianProfile, error: profileError } = await supabase
    .from('musicians')
    .select('id, profile_complete, name, travel_radius_miles, willing_to_travel')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Browse Facilities</h1>
          </div>
          <Link
            href="/dashboard/musician"
            className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm font-medium text-ocean-900 transition hover:bg-ocean-50"
          >
            Back to profile
          </Link>
        </div>
        <p className="text-sm font-medium text-red-700">Error loading profile: {profileError.message}</p>
      </section>
    )
  }

  if (!musicianProfile?.profile_complete) {
    return (
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Browse Facilities</h1>
          </div>
          <Link
            href="/dashboard/musician"
            className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm font-medium text-ocean-900 transition hover:bg-ocean-50"
          >
            Back to profile
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">
          <p className="font-medium">Complete your profile first</p>
          <p className="mt-1">You need to finish your musician profile before you can discover nearby centers.</p>
          <Link href="/dashboard/musician" className="mt-3 inline-block text-sm font-medium text-amber-700 underline hover:text-amber-900">
            Go to your profile →
          </Link>
        </div>
      </section>
    )
  }

  // No boost — this is the musician's own travel-radius preference from their
  // profile (set on Edit Profile: "Maximum Travel Distance"), not a hardcoded
  // cutoff. Per the team's call: no platform-imposed limit, a musician who
  // sets "Any distance" should see everything.
  const { data: centers, error } = await supabase.rpc('get_nearby_centers_for_musician_with_expansion', {
    result_limit: 500,
  })

  const rawCenters = (centers ?? []) as NearbyCenterRow[]
  const locationIds = Array.from(new Set(rawCenters.map((row) => row.location_id).filter(Boolean)))
  const { data: locationProfiles } = locationIds.length
    ? await supabase.from('center_locations').select('id, username, resident_count, city, state').in('id', locationIds)
    : { data: [] as { id: string; username: string; resident_count: number | null; city: string | null; state: string | null }[] }

  const locationUsernameById = new Map((locationProfiles ?? []).map((row) => [row.id, row.username]))
  const locationResidentCountById = new Map((locationProfiles ?? []).map((row) => [row.id, row.resident_count]))
  const locationCityById = new Map((locationProfiles ?? []).map((row) => [row.id, row.city]))
  const locationStateById = new Map((locationProfiles ?? []).map((row) => [row.id, row.state]))

  // ---- Filters (narrowing the already-fetched, unbounded list) ----
  const q = (params.q ?? '').trim().toLowerCase()
  const zip = (params.zip ?? '').trim()
  const distanceFilter = Number(params.distance) || 0
  const stateFilter = params.state ?? ''
  const cityFilter = params.city ?? ''

  let filteredCenters = rawCenters.filter((center) => {
    if (q && !`${center.center_name} ${center.location_name}`.toLowerCase().includes(q)) return false
    if (zip && !center.location_zip_code?.startsWith(zip)) return false
    if (distanceFilter > 0) {
      const d = center.distance_miles == null ? null : Number(center.distance_miles)
      if (d == null || d > distanceFilter) return false
    }
    if (stateFilter && locationStateById.get(center.location_id) !== stateFilter) return false
    if (cityFilter && locationCityById.get(center.location_id) !== cityFilter) return false
    return true
  })

  filteredCenters = [...filteredCenters].sort((a, b) => {
    if (sort === 'name') return a.center_name.localeCompare(b.center_name)
    const da = a.distance_miles == null ? Infinity : Number(a.distance_miles)
    const db = b.distance_miles == null ? Infinity : Number(b.distance_miles)
    return da - db
  })

  const availableStates = Array.from(new Set((locationProfiles ?? []).map((row) => row.state).filter((s): s is string => Boolean(s)))).sort()
  const availableCities = Array.from(new Set((locationProfiles ?? []).map((row) => row.city).filter((c): c is string => Boolean(c)))).sort()

  const totalResults = filteredCenters.length
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageCenters = filteredCenters.slice(pageStart, pageStart + PAGE_SIZE)

  const hasActiveFilters = Boolean(q || zip || distanceFilter || stateFilter || cityFilter)

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
      <div>
        <h1 className="font-garamond text-[28px] font-bold text-ocean-900 sm:text-[32.3px]">Browse Facilities</h1>
        <p className="mt-1 text-sm text-ocean-900/70 sm:text-[15px]">
          Approved memory care communities within your travel distance, nearest first.
        </p>
      </div>

      {/* ---- Filter bar ---- */}
      <FacilityFilterBar
        action="/dashboard/musician/discover"
        q={params.q}
        zip={params.zip}
        distance={params.distance}
        state={params.state}
        city={params.city}
        distanceOptions={DISTANCE_FILTERS}
        stateOptions={availableStates.length ? availableStates : US_STATES}
        cityOptions={availableCities}
        hasActiveFilters={hasActiveFilters}
        resetHref="/dashboard/musician/discover"
      />

      {/* ---- Sort + view toggle + count ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-ocean-900">Sort by</span>
          <SortSelect sort={sort} basePath="/dashboard/musician/discover" params={params} />
          <span className="text-sm italic text-ocean-900/60">
            ({totalResults} result{totalResults !== 1 ? 's' : ''})
          </span>
        </div>
        <Link
          href={buildHref(params, { view: view === 'grid' ? 'list' : 'grid', page: undefined })}
          className="flex items-center gap-2 rounded-lg bg-ocean-900 px-3.5 py-1.5 text-sm font-bold text-white transition hover:bg-ocean-800"
        >
          View as
          {view === 'grid' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {[3, 10.5, 18].flatMap((y) => [3, 10.5, 18].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.6" />))}
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="4.5" width="18" height="3" rx="1" />
              <rect x="3" y="10.5" width="18" height="3" rx="1" />
              <rect x="3" y="16.5" width="18" height="3" rx="1" />
            </svg>
          )}
        </Link>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error.message}</p>}

      {pageCenters.length > 0 ? (
        <ul className={view === 'grid' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-3'}>
          {pageCenters.map((center) => (
            <li key={center.location_id} className="overflow-hidden rounded-2xl border border-ocean-200/70 bg-white shadow-sm">
              <div className="flex gap-4 p-4">
                {center.location_image_url || center.center_profile_image_url ? (
                  <img
                    src={center.location_image_url ?? center.center_profile_image_url ?? undefined}
                    alt={center.center_name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl border border-ocean-200/70 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-ocean-200/70 bg-amber-100 text-xl font-semibold text-amber-700">
                    {center.center_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {/* break-words: some centers register with an e-mail address
                      as their display name, one unbroken "word" — min-w-0
                      alone lets the box shrink, but the text itself just kept
                      running past that width and got sliced off by the
                      card's overflow-hidden instead of wrapping. */}
                  <p className="break-words text-lg font-semibold text-ocean-900">{center.center_name}</p>
                  <p className="break-words text-sm text-ocean-900/70">{center.location_name} · ZIP {center.location_zip_code}</p>
                  <p className="mt-1 text-sm text-ocean-900/70">{locationResidentCountById.get(center.location_id) ?? 'Unknown'} residents</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{formatDistance(center.distance_miles)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {center.supports_transport && (
                      <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-700">Transport available</span>
                    )}
                    <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-900">
                      {COMP_LABELS.free}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/discover/location/${locationUsernameById.get(center.location_id) ?? center.location_id}`}
                      className="mr-2 inline-block rounded-lg border border-ocean-300 px-3 py-1.5 text-xs font-bold text-ocean-900 transition hover:bg-ocean-100"
                    >
                      View Facility Profile
                    </Link>
                    <Link
                      href={`/dashboard/requests/new?centerLocationId=${center.location_id}`}
                      className="inline-block rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      Request this center
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {view === 'grid' &&
            Array.from({ length: Math.max(0, PAGE_SIZE - pageCenters.length) }, (_, i) => (
              <li
                key={`ghost-${i}`}
                aria-hidden="true"
                className="flex min-h-[150px] items-center justify-center rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/40"
              >
                <span className="font-poppins text-sm italic text-ocean-900/30">FACILITY</span>
              </li>
            ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 text-sm text-ocean-900/70 shadow-sm">
          {hasActiveFilters
            ? 'No facilities match your filters. Try clearing some of them.'
            : 'No nearby centers found yet. This can happen if there are no approved centers within your current travel radius.'}{' '}
          {!hasActiveFilters && (
            <Link href="/dashboard/account/edit" className="font-medium text-ocean-700 underline underline-offset-2 hover:text-ocean-900">
              Adjust your maximum travel distance
            </Link>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <Link
            href={buildHref(params, { page: String(Math.max(1, currentPage - 1)) })}
            aria-disabled={currentPage <= 1}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-ocean-300 text-ocean-900 transition hover:bg-ocean-50 ${
              currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
            }`}
            aria-label="Previous page"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref(params, { page: String(n) })}
              aria-current={n === currentPage ? 'page' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${
                n === currentPage ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-ocean-300 text-ocean-900 hover:bg-ocean-50'
              }`}
            >
              {n}
            </Link>
          ))}
          <Link
            href={buildHref(params, { page: String(Math.min(totalPages, currentPage + 1)) })}
            aria-disabled={currentPage >= totalPages}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-ocean-300 text-ocean-900 transition hover:bg-ocean-50 ${
              currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''
            }`}
            aria-label="Next page"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  )
}
