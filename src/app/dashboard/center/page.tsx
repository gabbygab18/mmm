import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function getDisplayImageUrl(primary?: string | null, fallback?: string | null) {
  const primaryUrl = primary?.trim()
  if (primaryUrl) return primaryUrl

  const fallbackUrl = fallback?.trim()
  return fallbackUrl || null
}

export default async function CenterDashboardPage() {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: center } = await supabase
    .from('centers')
    .select('id, username, name, phone, profile_image_url, profile_complete, approved')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: locations } = center
    ? await supabase
        .from('center_locations')
        .select('id, username, name, address, zip_code, phone, supports_transport, location_image_url, resident_count')
        .eq('center_id', center.id)
        .order('created_at', { ascending: true })
    : { data: null }

  const totalResidents = (locations ?? []).reduce((sum, loc) => sum + (loc.resident_count ?? 0), 0)

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">My Center</h1>
          <p className="mt-1 text-sm text-stone-500">Manage your center profile and locations.</p>
        </div>
        {center && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/discover/center/${center.username ?? center.id}`}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Public profile
            </Link>
            <Link
              href="/onboarding/center"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>

      {!center && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-900">Center setup required</p>
          <p className="mt-1 text-sm text-amber-800">Complete your center profile before posting performance opportunities.</p>
          <Link
            href="/onboarding/center"
            className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Set up my center
          </Link>
        </div>
      )}

      {center && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Hero */}
          <div className="flex items-center gap-5 border-b border-stone-100 bg-gradient-to-r from-brand-50 to-brand-100 p-6">
            {center.profile_image_url ? (
              <img
                src={center.profile_image_url}
                alt={center.name}
                className="h-20 w-20 flex-shrink-0 rounded-xl border-2 border-white object-cover shadow"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-white bg-brand-200 text-2xl font-bold text-brand-700 shadow">
                {center.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-stone-900">{center.name}</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                {center.phone ? `${center.phone} · ` : ''}
                {locations?.length ?? 0} location{(locations?.length ?? 0) !== 1 ? 's' : ''}
                {locations && locations.length > 0 ? ` · ${totalResidents} total residents` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {center.approved ? (
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">✓ Approved</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Pending review</span>
                )}
                {!center.profile_complete && (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Profile incomplete</span>
                )}
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Locations ({locations?.length ?? 0})
              </p>
              <Link
                href="/dashboard/center/locations/new"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
              >
                + Add location
              </Link>
            </div>

            {locations && locations.length > 0 ? (
              <ul className="space-y-3">
                {locations.map((loc) => (
                  <li key={loc.id} className="flex gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                    {getDisplayImageUrl(loc.location_image_url, center.profile_image_url) ? (
                      <img
                        src={getDisplayImageUrl(loc.location_image_url, center.profile_image_url) ?? undefined}
                        alt={loc.name}
                        className="h-16 w-16 flex-shrink-0 rounded-lg border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-200 text-xs text-stone-500">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0 text-sm text-stone-700">
                      <p className="font-semibold text-stone-900">{loc.name}</p>
                      <p className="mt-0.5">{loc.address}</p>
                      <p className="text-stone-500">ZIP {loc.zip_code}{loc.phone ? ` · ${loc.phone}` : ''}</p>
                      <p className="text-xs text-stone-500">Residents: {loc.resident_count ?? 'Unknown'}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {loc.supports_transport && (
                          <span className="inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Transport available</span>
                        )}
                        <Link
                          href={`/dashboard/center/locations/${loc.id}/discover`}
                          className="inline-block rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                        >
                          Browse musicians
                        </Link>
                        <Link
                          href={`/dashboard/center/locations/${loc.id}/request-dates`}
                          className="inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          Request dates
                        </Link>
                        <Link
                          href={`/dashboard/center/locations/${loc.id}`}
                          className="inline-block rounded-full border border-stone-300 px-2 py-0.5 text-xs font-semibold text-stone-600 transition hover:bg-white"
                        >
                          Edit
                        </Link>
                        {loc.username && (
                          <Link
                            href={`/discover/location/${loc.username}`}
                            className="inline-block rounded-full border border-stone-300 px-2 py-0.5 text-xs font-semibold text-stone-600 transition hover:bg-white"
                          >
                            Public profile
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">No locations yet — your primary location will appear here after onboarding.</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
