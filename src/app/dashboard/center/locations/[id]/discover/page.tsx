import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const COMP_LABELS: Record<string, string> = {
  free: 'Volunteer (free)',
  'paid-preferred': 'Compensation preferred',
  either: 'Open to either',
}
const BAND_LABELS: Record<string, string> = {
  solo: 'Solo',
  duo: 'Duo',
  group: 'Group / Ensemble',
}

function formatDistance(value: number | string | null) {
  if (value == null) return 'Distance unavailable'
  const distance = typeof value === 'string' ? Number(value) : value
  return `${distance.toFixed(1)} miles away`
}

type NearbyMusicianRow = {
  musician_id: string
  musician_name: string
  musician_zip_code: string
  profile_image_url: string | null
  distance_miles: number | string | null
  music_types: string[] | null
  instruments: string[] | null
  band_size_preference: string | null
  compensation_preference: string | null
  has_own_transport: boolean | null
}

export default async function CenterLocationDiscoverPage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') redirect('/dashboard')

  await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()
  const { id } = await params

  // Check if center's own profile is complete
  const { data: centerProfile, error: profileError } = await supabase
    .from('centers')
    .select('id, profile_complete, name')
    .maybeSingle()

  if (profileError) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Musicians</h1>
          </div>
          <Link
            href="/dashboard/center"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </div>
        <p className="text-sm font-medium text-red-700">Error loading profile: {profileError.message}</p>
      </section>
    )
  }

  if (!centerProfile?.profile_complete) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Musicians</h1>
          </div>
          <Link
            href="/dashboard/center"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">
          <p className="font-medium">Complete your profile first</p>
          <p className="mt-1">You need to finish your center profile before you can discover nearby musicians.</p>
          <Link href="/dashboard/center" className="mt-3 inline-block text-sm font-medium text-amber-700 underline hover:text-amber-900">
            Go to your profile →
          </Link>
        </div>
      </section>
    )
  }

  const { data: nearbyMusicians, error } = await supabase.rpc('get_nearby_musicians_for_center', {
    target_location_id: id,
    result_limit: 100,
  })

  const typedNearbyMusicians = (nearbyMusicians ?? []) as NearbyMusicianRow[]
  const musicianIds = Array.from(new Set(typedNearbyMusicians.map((row) => row.musician_id).filter(Boolean)))
  const { data: musicianProfiles } = musicianIds.length
    ? await supabase.from('musicians').select('id, username').in('id', musicianIds)
    : { data: [] as { id: string; username: string }[] }
  const musicianUsernameById = new Map((musicianProfiles ?? []).map((row) => [row.id, row.username]))

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse Nearby Musicians</h1>
          <p className="mt-1 text-sm text-stone-600">Approved, profile-complete musicians who can travel to this location.</p>
          {nearbyMusicians && nearbyMusicians.length > 0 && <p className="mt-2 text-xs text-stone-500">Showing {nearbyMusicians.length} result{nearbyMusicians.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/center/locations/${id}/discover-slots`}
            className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          >
            Browse posted slots
          </Link>
          <Link
            href="/dashboard/center"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error.message}</p>}

      {nearbyMusicians && nearbyMusicians.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {typedNearbyMusicians.map((musician) => (
            <li key={musician.musician_id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex gap-4 p-4">
                {musician.profile_image_url ? (
                  <img
                    src={musician.profile_image_url}
                    alt={musician.musician_name}
                    className="h-20 w-20 flex-shrink-0 rounded-full border border-stone-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border border-stone-200 bg-brand-100 text-xl font-semibold text-brand-700">
                    {musician.musician_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-stone-900">{musician.musician_name}</p>
                  <p className="text-sm text-stone-600">ZIP {musician.musician_zip_code}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">{formatDistance(musician.distance_miles)}</p>
                  <p className="mt-2 text-sm text-stone-700">
                    <span className="font-medium">Music:</span> {musician.music_types?.length ? musician.music_types.join(', ') : 'Not set'}
                  </p>
                  <p className="text-sm text-stone-700">
                    <span className="font-medium">Instruments:</span> {musician.instruments?.length ? musician.instruments.join(', ') : 'Not set'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                      {BAND_LABELS[musician.band_size_preference ?? ''] ?? 'Format not set'}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {COMP_LABELS[musician.compensation_preference ?? ''] ?? 'Compensation not set'}
                    </span>
                    {musician.has_own_transport && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Own transport</span>
                    )}
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/discover/musician/${musicianUsernameById.get(musician.musician_id) ?? musician.musician_id}`}
                      className="mr-2 inline-block rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      View full profile
                    </Link>
                    <Link
                      href={`/dashboard/requests/new?centerLocationId=${id}&musicianId=${musician.musician_id}`}
                      className="inline-block rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      Request this musician
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
          No nearby musicians found yet for this location.
        </div>
      )}
    </section>
  )
}
