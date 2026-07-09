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

export default async function LocationProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator' && role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()
  const { id: username } = await params

  if (UUID_PATTERN.test(username)) {
    const { data: locationById } = await supabase
      .from('center_locations')
      .select('username')
      .eq('id', username)
      .maybeSingle()

    if (locationById?.username) {
      redirect(`/discover/location/${locationById.username}`)
    }
  }

  const { data: location, error: locationError } = await supabase
    .from('center_locations')
    .select('id, username, center_id, name, address, zip_code, phone, supports_transport, location_image_url, resident_count, profile_complete')
    .eq('username', username)
    .maybeSingle()

  if (locationError || !location) {
    notFound()
  }

  const { data: center } = await supabase
    .from('centers')
    .select('id, name, username, approved, profile_image_url')
    .eq('id', location.center_id)
    .maybeSingle()

  const locationDisplayImageUrl = getDisplayImageUrl(location.location_image_url, center?.profile_image_url)

  const { data: requestSlots } = await supabase
    .from('center_request_dates')
    .select('id, requested_date, start_time, end_time, notes')
    .eq('center_location_id', location.id)
    .gte('requested_date', new Date().toISOString().slice(0, 10))
    .order('requested_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(30)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Location Profile</h1>
          <p className="mt-1 text-sm text-stone-600">Venue details, request slots, and event portfolio for this location.</p>
        </div>
        <div className="flex items-center gap-2">
          {center?.username && (
            <Link
              href={`/discover/center/${center.username}`}
              className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
            >
              View parent organization
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {locationDisplayImageUrl ? (
            <img
              src={locationDisplayImageUrl}
              alt={location.name}
              className="h-24 w-24 rounded-xl border border-stone-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-stone-200 bg-amber-100 text-2xl font-semibold text-amber-700">
              {location.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-stone-900">{location.name}</h2>
            {center?.name && <p className="mt-1 text-sm text-stone-600">{center.name}</p>}
            <p className="mt-1 text-sm text-stone-600">{location.address} · ZIP {location.zip_code}</p>
            {location.phone && <p className="mt-1 text-sm text-stone-600">Phone: {location.phone}</p>}

            <div className="mt-2 flex flex-wrap gap-2">
              {center?.approved && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Approved organization</span>
              )}
              {location.profile_complete && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Location profile complete</span>
              )}
              {location.supports_transport && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">Transport available</span>
              )}
            </div>

            <p className="mt-3 text-sm text-stone-700">{location.resident_count ?? 'Unknown'} residents at this location</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Upcoming Request Slots</h3>
        {requestSlots && requestSlots.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {requestSlots.map((slot: any) => (
              <li key={slot.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <p className="font-medium text-stone-900">{formatDate(slot.requested_date)}</p>
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
