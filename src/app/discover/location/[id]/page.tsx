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

function InfoRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-ocean-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className="h-6 w-6 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

export default async function LocationProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator' && role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()
  const { id: username } = await params
  const LOCATION_COLUMNS =
    'id, username, center_id, name, address, city, state, zip_code, phone, supports_transport, location_image_url, resident_count, profile_complete'

  let location: {
    id: string
    username: string | null
    center_id: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    phone: string | null
    supports_transport: boolean | null
    location_image_url: string | null
    resident_count: number | null
    profile_complete: boolean | null
  } | null = null

  if (UUID_PATTERN.test(username)) {
    const { data: locationById } = await supabase
      .from('center_locations')
      .select(LOCATION_COLUMNS)
      .eq('id', username)
      .maybeSingle()

    if (locationById?.username) {
      redirect(`/discover/location/${locationById.username}`)
    }
    // A location can exist with no username assigned yet (never claimed one
    // during onboarding) — serve it directly by id rather than 404ing on a
    // username-shaped link that will never resolve.
    location = locationById ?? null
  }

  if (!location) {
    const { data: locationByUsername } = await supabase
      .from('center_locations')
      .select(LOCATION_COLUMNS)
      .eq('username', username)
      .maybeSingle()
    location = locationByUsername ?? null
  }

  if (!location) {
    notFound()
  }

  const { data: center } = await supabase
    .from('centers')
    .select(
      'id, name, username, website, phone, director_first_name, director_last_name, director_email, approved, confirmed, profile_image_url, about_description, established_year, community_type, highlights, testimonial_quote, testimonial_author, preferred_music_styles, preferred_performance_types, preferred_days, visit_frequency, preferred_time, performance_location, preferred_length',
    )
    .eq('id', location.center_id)
    .maybeSingle()

  if (!center || (!(center.approved && center.confirmed) && role !== 'admin')) {
    notFound()
  }

  const locationDisplayImageUrl = getDisplayImageUrl(location.location_image_url, center?.profile_image_url)

  // "View other locations" only means something when there's somewhere else
  // to go — a center with just this one location would just show a thinner
  // duplicate of this same page.
  const { count: siblingLocationCount } = await supabase
    .from('center_locations')
    .select('id', { count: 'exact', head: true })
    .eq('center_id', location.center_id)
  const hasMultipleLocations = (siblingLocationCount ?? 0) > 1

  const { data: requestSlots } = await supabase
    .from('center_request_dates')
    .select('id, requested_date, start_time, end_time, notes')
    .eq('center_location_id', location.id)
    .gte('requested_date', new Date().toISOString().slice(0, 10))
    .order('requested_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(30)

  const fullAddress = [location.address, location.city, location.state].filter(Boolean).join(', ') + (location.zip_code ? ` ${location.zip_code}` : '')
  const directorName = [center.director_first_name, center.director_last_name].filter(Boolean).join(' ')
  const highlights = (center.highlights ?? []).filter(Boolean)
  const musicStyles = center.preferred_music_styles ?? []
  const performanceTypes = center.preferred_performance_types ?? []
  const hasSchedulingPrefs = Boolean(
    musicStyles.length || performanceTypes.length || (center.preferred_days ?? []).length || center.preferred_time || center.preferred_length || center.performance_location,
  )

  return (
    <div className="pb-8 font-poppins">
      {/* ---- Hero ---- */}
      <div className="relative -mx-4 -mt-5 h-[280px] overflow-hidden sm:-mx-6 sm:h-[320px]">
        {locationDisplayImageUrl ? (
          <img src={locationDisplayImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-ocean-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/80 via-ocean-950/20 to-ocean-950/10" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-between px-4 py-5 sm:px-6">
          <Link
            href={role === 'musician' ? '/dashboard/musician/discover' : '/dashboard'}
            className="flex w-fit items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-bold text-ocean-900 shadow-sm transition hover:bg-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
            {role === 'musician' ? 'Back to All Facilities' : 'Back to Dashboard'}
          </Link>

          <div className="flex items-end gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-[#fdfaf3] text-2xl font-bold text-amber-700 shadow sm:h-20 sm:w-20">
              {location.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="font-garamond text-[22px] font-bold leading-tight text-white drop-shadow sm:text-[32px]">{location.name}</h1>
              <span className="mt-1 inline-block rounded-full bg-ocean-900/70 px-2.5 py-0.5 text-[11px] font-medium text-white">Memory Care Community</span>
              {fullAddress.trim() && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/90">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                    <circle cx="12" cy="9" r="2.4" />
                  </svg>
                  {fullAddress}
                  {location.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline underline-offset-2 hover:text-white"
                    >
                      View on map
                    </a>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-5xl px-4 sm:px-6">
        {hasMultipleLocations && center?.username && (
          <Link
            href={`/discover/center/${center.username}`}
            className="mb-4 inline-block rounded-lg border border-ocean-300 bg-ocean-50 px-3 py-1.5 text-sm font-medium text-ocean-700 transition hover:bg-ocean-100"
          >
            View other locations ({siblingLocationCount})
          </Link>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* ---- Left column ---- */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
              <h2 className="font-poppins text-[15px] font-bold text-ocean-900">About this Community</h2>
              {center.about_description ? (
                <p className="mt-2 text-sm leading-relaxed text-ocean-900/80">{center.about_description}</p>
              ) : (
                <p className="mt-2 text-sm italic text-ocean-900/50">This community hasn&apos;t added a description yet.</p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-ocean-200/70 px-2 py-3 text-center">
                  <p className="font-garamond text-lg font-bold text-ocean-900">{location.resident_count ?? '—'}</p>
                  <p className="text-[10.5px] text-ocean-900/70">Residents</p>
                </div>
                <div className="rounded-xl border border-ocean-200/70 px-2 py-3 text-center">
                  <p className="font-garamond text-[13px] font-bold leading-tight text-ocean-900">{center.community_type || 'Not specified'}</p>
                </div>
                <div className="rounded-xl border border-ocean-200/70 px-2 py-3 text-center">
                  <p className="font-garamond text-lg font-bold text-ocean-900">{center.established_year || '—'}</p>
                  <p className="text-[10.5px] text-ocean-900/70">Established</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
              <h2 className="font-poppins text-[15px] font-bold text-ocean-900">Music & Performance Preferences</h2>
              {hasSchedulingPrefs ? (
                <dl className="mt-3 space-y-2.5 text-sm">
                  {musicStyles.length > 0 && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Preferred Music Styles</dt>
                      <dd className="text-ocean-900/80">{musicStyles.join(', ')}</dd>
                    </div>
                  )}
                  {performanceTypes.length > 0 && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Preferred Performance Types</dt>
                      <dd className="text-ocean-900/80">{performanceTypes.join(', ')}</dd>
                    </div>
                  )}
                  {(center.preferred_days ?? []).length > 0 && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Preferred Days</dt>
                      <dd className="text-ocean-900/80">{(center.preferred_days ?? []).join(', ')}</dd>
                    </div>
                  )}
                  {center.preferred_time && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Preferred Times</dt>
                      <dd className="text-ocean-900/80">{center.preferred_time}</dd>
                    </div>
                  )}
                  {center.preferred_length && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Performance Duration</dt>
                      <dd className="text-ocean-900/80">{center.preferred_length}</dd>
                    </div>
                  )}
                  {center.performance_location && (
                    <div className="flex flex-wrap justify-between gap-2">
                      <dt className="font-bold text-ocean-900">Performance Location</dt>
                      <dd className="text-ocean-900/80">{center.performance_location}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="mt-2 text-sm italic text-ocean-900/50">No performance preferences added yet.</p>
              )}
            </div>

            {highlights.length > 0 && (
              <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
                <h2 className="font-poppins text-[15px] font-bold text-ocean-900">What Makes Us Special</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ocean-900/80">
                  {highlights.map((h: string) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {center.testimonial_quote && (
              <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
                <h2 className="font-poppins text-[15px] font-bold text-ocean-900">Notes from the Community</h2>
                <p className="mt-2 text-sm italic leading-relaxed text-ocean-900/80">&ldquo;{center.testimonial_quote}&rdquo;</p>
                {center.testimonial_author && <p className="mt-1 text-right text-xs font-bold text-ocean-900/70">— {center.testimonial_author}</p>}
              </div>
            )}

            <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
              <h2 className="font-poppins text-[15px] font-bold text-ocean-900">Upcoming Request Slots</h2>
              {requestSlots && requestSlots.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {requestSlots.map((slot) => (
                    <li key={slot.id} className="rounded-lg border border-ocean-200/70 bg-ocean-50 px-3 py-2 text-sm text-ocean-900">
                      <p className="font-medium text-ocean-900">{formatDate(slot.requested_date)}</p>
                      <p className="mt-0.5">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                      {slot.notes && <p className="mt-1 text-xs text-ocean-900/70">{slot.notes}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ocean-900/70">No upcoming request slots posted.</p>
              )}
            </div>
          </div>

          {/* ---- Right column ---- */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-ocean-200/70 bg-ocean-50 p-5 shadow-sm">
              <h2 className="font-poppins text-[15px] font-bold text-ocean-900">Contact Information</h2>
              <div className="mt-3 space-y-2.5">
                {(location.phone || center.phone) && <InfoRow icon="/mmm/facility-profile/icon-contact.png">{location.phone || center.phone}</InfoRow>}
                {center.director_email && <InfoRow icon="/mmm/facility-profile/icon-email.png">{center.director_email}</InfoRow>}
                {center.website && (
                  <InfoRow icon="/mmm/facility-profile/icon-website.png">
                    <a href={center.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ocean-700">
                      {center.website.replace(/^https?:\/\//, '')}
                    </a>
                  </InfoRow>
                )}
                {center.visit_frequency && <InfoRow icon="/mmm/facility-profile/icon-time.png">{center.visit_frequency}</InfoRow>}
                {directorName && <InfoRow icon="/mmm/facility-profile/icon-director.png">{directorName}</InfoRow>}
                {!location.phone && !center.phone && !center.director_email && !center.website && !directorName && (
                  <p className="text-sm italic text-ocean-900/50">No contact details on file yet.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {location.supports_transport && (
                <span className="rounded-full bg-ocean-100 px-2.5 py-1 text-xs font-medium text-ocean-700">Transport available</span>
              )}
              {center?.approved && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">Approved organization</span>
              )}
            </div>

            {role === 'musician' && (
              <Link
                href={`/dashboard/requests/new?centerLocationId=${location.id}`}
                className="block rounded-lg bg-ocean-900 px-4 py-2.5 text-center text-sm font-bold text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.25)] transition hover:bg-ocean-800"
              >
                Request this Facility
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
