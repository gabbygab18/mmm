import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatTime(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getDisplayImageUrl(primary?: string | null, fallback?: string | null) {
  const primaryUrl = primary?.trim()
  if (primaryUrl) return primaryUrl

  const fallbackUrl = fallback?.trim()
  return fallbackUrl || null
}

export default async function CenterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator' && role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()
  const { id: username } = await params

  if (UUID_PATTERN.test(username)) {
    const { data: centerById } = await supabase
      .from('centers')
      .select('username')
      .eq('id', username)
      .maybeSingle()

    if (centerById?.username) {
      redirect(`/discover/center/${centerById.username}`)
    }
  }

  const { data: center, error: centerError } = await supabase
    .from('centers')
    .select('id, username, name, phone, profile_image_url, profile_complete, approved')
    .eq('username', username)
    .maybeSingle()

  if (centerError || !center) {
    notFound()
  }

  const { data: locations } = await supabase
    .from('center_locations')
    .select('id, username, name, address, zip_code, resident_count, phone, supports_transport, location_image_url')
    .eq('center_id', center.id)
    .order('name', { ascending: true })

  const locationIds = (locations ?? []).map((location) => location.id)

  const { data: requestSlots } = locationIds.length
    ? await supabase
        .from('center_request_dates')
        .select('id, center_location_id, requested_date, start_time, end_time, notes')
        .in('center_location_id', locationIds)
        .gte('requested_date', new Date().toISOString().slice(0, 10))
        .order('requested_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(30)
    : { data: [] }

  const locationNameById = new Map((locations ?? []).map((location) => [location.id, location.name]))

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Center Organization</h1>
          <p className="mt-1 text-sm text-stone-600">Organization overview and location directory.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {center.profile_image_url ? (
            <img
              src={center.profile_image_url}
              alt={center.name}
              className="h-24 w-24 rounded-xl border border-stone-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-stone-200 bg-amber-100 text-2xl font-semibold text-amber-700">
              {center.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-stone-900">{center.name}</h2>
            <p className="mt-1 text-sm text-stone-600">{locations?.length ?? 0} location{(locations?.length ?? 0) !== 1 ? 's' : ''}</p>
            {center.phone && <p className="mt-1 text-sm text-stone-600">Phone: {center.phone}</p>}

            <div className="mt-2 flex flex-wrap gap-2">
              {center.approved && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Approved</span>
              )}
              {center.profile_complete && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Profile complete</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Location Profiles</h3>
        {locations && locations.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {locations.map((location) => (
              <li key={location.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <div className="flex gap-3">
                  {getDisplayImageUrl(location.location_image_url, center.profile_image_url) ? (
                    <img
                      src={getDisplayImageUrl(location.location_image_url, center.profile_image_url) ?? undefined}
                      alt={location.name}
                      className="h-14 w-14 flex-shrink-0 rounded-lg border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-amber-100 text-lg font-semibold text-amber-700">
                      {location.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{location.name}</p>
                    <p className="mt-0.5">{location.address} · ZIP {location.zip_code}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-stone-600">{location.resident_count ?? 'Unknown'} residents</span>
                      {location.phone && <span className="text-xs text-stone-600">{location.phone}</span>}
                      {location.supports_transport && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">Transport available</span>
                      )}
                      {location.username && (
                        <Link
                          href={`/discover/location/${location.username}`}
                          className="rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                        >
                          View location profile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-600">No locations available.</p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Upcoming Request Slots</h3>
        {requestSlots && requestSlots.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {requestSlots.map((slot: any) => (
              <li key={slot.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <p className="font-medium text-stone-900">
                  {locationNameById.get(slot.center_location_id) ?? 'Location'} · {formatDate(slot.requested_date)}
                </p>
                <p className="mt-0.5">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                {slot.notes && <p className="mt-1 text-xs text-stone-600">{slot.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-600">No upcoming request slots posted.</p>
        )}
      </div>

    </section>
  )
}
