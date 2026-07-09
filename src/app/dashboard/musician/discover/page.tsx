import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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

function clampRadiusBoost(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(Math.max(value, 0), 30)
}

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

export default async function MusicianDiscoverPage({ searchParams }: { searchParams: Promise<{ radiusBoost?: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()
  const params = await searchParams
  const radiusBoost = clampRadiusBoost(Number(params.radiusBoost ?? '0'))

  // Check if musician's own profile is complete
  const { data: musicianProfile, error: profileError } = await supabase
    .from('musicians')
    .select('id, profile_complete, name, travel_radius_miles, willing_to_travel')
    .maybeSingle()

  if (profileError) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Centers</h1>
          </div>
          <Link
            href="/dashboard/musician"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
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
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Centers</h1>
          </div>
          <Link
            href="/dashboard/musician"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
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

  const baseRadius = musicianProfile?.willing_to_travel ? musicianProfile.travel_radius_miles ?? 0 : 0
  const effectiveRadius = baseRadius + radiusBoost

  const { data: centers, error } = await supabase.rpc('get_nearby_centers_for_musician_with_expansion', {
    result_limit: 100,
    radius_boost_miles: radiusBoost,
  })

  const typedCenters = (centers ?? []) as NearbyCenterRow[]
  const centerIds = Array.from(new Set(typedCenters.map((row) => row.center_id).filter(Boolean)))
  const locationIds = Array.from(new Set(typedCenters.map((row) => row.location_id).filter(Boolean)))
  const [centerProfilesResult, locationProfilesResult] = await Promise.all([
    centerIds.length
      ? supabase.from('centers').select('id, username').in('id', centerIds)
      : Promise.resolve({ data: [] as { id: string; username: string }[] }),
    locationIds.length
      ? supabase.from('center_locations').select('id, username, resident_count').in('id', locationIds)
      : Promise.resolve({ data: [] as { id: string; username: string; resident_count: number | null }[] }),
  ])

  const { data: centerProfiles } = centerProfilesResult
  const { data: locationProfiles } = locationProfilesResult
  const centerUsernameById = new Map((centerProfiles ?? []).map((row) => [row.id, row.username]))
  const locationUsernameById = new Map((locationProfiles ?? []).map((row) => [row.id, row.username]))
  const locationResidentCountById = new Map((locationProfiles ?? []).map((row) => [row.id, row.resident_count]))

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Centers</h1>
          <p className="mt-1 text-sm text-stone-600">Approved, profile-complete centers within your travel radius.</p>
          <p className="mt-1 text-xs text-stone-500">Range: {baseRadius} mi base + {radiusBoost} mi expansion = {effectiveRadius} mi</p>
          {centers && centers.length > 0 && <p className="mt-2 text-xs text-stone-500">Showing {centers.length} result{centers.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1">
            <Link
              href={`/dashboard/musician/discover?radiusBoost=${Math.max(radiusBoost - 5, 0)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              -5 mi
            </Link>
            <Link
              href="/dashboard/musician/discover"
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Reset
            </Link>
            <Link
              href={`/dashboard/musician/discover?radiusBoost=${Math.min(radiusBoost + 5, 30)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              +5 mi
            </Link>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error.message}</p>}

      {centers && centers.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {typedCenters.map((center) => (
            <li key={`${center.location_id}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex gap-4 p-4">
                {center.location_image_url || center.center_profile_image_url ? (
                  <img
                    src={center.location_image_url ?? center.center_profile_image_url ?? undefined}
                    alt={center.center_name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl border border-stone-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-amber-100 text-xl font-semibold text-amber-700">
                    {center.center_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-stone-900">{center.center_name}</p>
                  <p className="text-sm text-stone-600">{center.location_name} · ZIP {center.location_zip_code}</p>
                  <p className="mt-1 text-sm text-stone-600">{locationResidentCountById.get(center.location_id) ?? 'Unknown'} residents</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{formatDistance(center.distance_miles)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {center.supports_transport && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">Transport available</span>
                    )}
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                      {COMP_LABELS.free}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/discover/location/${locationUsernameById.get(center.location_id) ?? center.location_id}`}
                      className="mr-2 inline-block rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      View location profile
                    </Link>
                    <Link
                      href={`/dashboard/requests/new?centerLocationId=${center.location_id}`}
                      className="inline-block rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Request this center
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
          No nearby centers found yet. This can happen if there are no approved centers within your current travel radius.
        </div>
      )}
    </section>
  )
}
