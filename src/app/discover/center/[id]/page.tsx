import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LocationSortSelect } from './sort-select'

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
const PAGE_SIZE = 6

function getDisplayImageUrl(primary?: string | null, fallback?: string | null) {
  const primaryUrl = primary?.trim()
  if (primaryUrl) return primaryUrl

  const fallbackUrl = fallback?.trim()
  return fallbackUrl || null
}

export default async function CenterProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}) {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator' && role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()
  const { id: username } = await params
  const { page: pageParam, sort: sortParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const sort = sortParam === 'name' ? 'name' : 'nearest'

  const CENTER_COLUMNS =
    'id, username, name, phone, website, director_email, about_description, community_type, established_year, profile_image_url, profile_complete, approved, confirmed, created_at'

  let center: {
    id: string
    username: string | null
    name: string
    phone: string | null
    website: string | null
    director_email: string | null
    about_description: string | null
    community_type: string | null
    established_year: number | null
    profile_image_url: string | null
    profile_complete: boolean | null
    approved: boolean | null
    confirmed: boolean | null
    created_at: string
  } | null = null

  if (UUID_PATTERN.test(username)) {
    const { data: centerById } = await supabase.from('centers').select(CENTER_COLUMNS).eq('id', username).maybeSingle()

    if (centerById?.username) {
      redirect(`/discover/center/${centerById.username}`)
    }
    // A center can exist with no username assigned yet — serve it directly
    // by id rather than 404ing on a username-shaped link that never resolves.
    center = centerById ?? null
  }

  if (!center) {
    const { data: centerByUsername } = await supabase.from('centers').select(CENTER_COLUMNS).eq('username', username).maybeSingle()
    center = centerByUsername ?? null
  }

  // Admins can preview an unconfirmed facility (e.g. while verifying it);
  // everyone else only ever sees confirmed, approved facilities.
  if (!center || (!(center.approved && center.confirmed) && role !== 'admin')) {
    notFound()
  }

  const { data: locations } = await supabase
    .from('center_locations')
    .select('id, username, name, address, city, state, zip_code, resident_count, phone, supports_transport, location_image_url, created_at')
    .eq('center_id', center.id)
    .order('created_at', { ascending: true })

  const allLocations = locations ?? []
  const locationIds = allLocations.map((location) => location.id)

  const [{ data: requestSlots }, { count: completedCount }] = await Promise.all([
    locationIds.length
      ? supabase
          .from('center_request_dates')
          .select('id, center_location_id, requested_date, start_time, end_time, notes')
          .in('center_location_id', locationIds)
          .gte('requested_date', new Date().toISOString().slice(0, 10))
          .order('requested_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(30)
      : Promise.resolve({ data: [] as { id: string; center_location_id: string; requested_date: string; start_time: string; end_time: string; notes: string | null }[] }),
    locationIds.length
      ? supabase.from('requests').select('id', { count: 'exact', head: true }).in('center_location_id', locationIds).eq('status', 'completed')
      : Promise.resolve({ count: 0 }),
  ])

  const locationNameById = new Map(allLocations.map((location) => [location.id, location.name]))

  // ---- Real, derivable stats — no invented "Years of Excellence" placeholder ----
  const residentsServed = allLocations.reduce((sum, l) => sum + (l.resident_count ?? 0), 0)
  const memberSinceYear = new Date(center.created_at).getFullYear()
  const primaryLocation = allLocations[0] ?? null

  // ---- Sort + paginate the location directory ----
  const sortedLocations = [...allLocations].sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : 0))
  const totalPages = Math.max(1, Math.ceil(sortedLocations.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageLocations = sortedLocations.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900 sm:text-[32.3px]">Center Organization</h1>
          <p className="mt-1 text-sm text-ocean-900/70 sm:text-[15px]">Organization overview and location directory.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm font-medium text-ocean-900 transition hover:bg-ocean-50"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Identity — full width, so a long facility name never has to
              fight two fixed-width side columns for room (that's what forced
              an ugly mid-word wrap before). */}
          <div className="flex gap-4">
            {center.profile_image_url ? (
              <img
                src={center.profile_image_url}
                alt={center.name}
                className="h-16 w-16 shrink-0 rounded-xl border border-ocean-200/70 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-ocean-200/70 bg-amber-100 text-xl font-semibold text-amber-700">
                {center.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="font-garamond text-[22px] font-bold text-ocean-900">{center.name}</h2>
              {center.about_description ? (
                <p className="mt-1 text-sm text-ocean-900/80">{center.about_description}</p>
              ) : (
                <p className="mt-1 text-sm italic text-ocean-900/50">This organization hasn&apos;t added a description yet.</p>
              )}
              {(center.community_type || center.established_year) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {center.community_type && (
                    <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-900">{center.community_type}</span>
                  )}
                  {center.established_year && (
                    <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-900">Est. {center.established_year}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            {/* Stats — sans-serif for the numbers: Cormorant Garamond's "1"
                renders as a serif stroke that reads like a capital "I". */}
            <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-xl border border-ocean-200/70 px-3 py-3 text-center">
                <p className="font-poppins text-2xl font-extrabold text-ocean-900">{allLocations.length}</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-ocean-900/70">Participating Communit{allLocations.length === 1 ? 'y' : 'ies'}</p>
              </div>
              <div className="rounded-xl border border-ocean-200/70 px-3 py-3 text-center">
                <p className="font-poppins text-2xl font-extrabold text-ocean-900">{residentsServed}+</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-ocean-900/70">Residents Served</p>
              </div>
              <div className="rounded-xl border border-ocean-200/70 px-3 py-3 text-center">
                <p className="font-poppins text-2xl font-extrabold text-ocean-900">{completedCount ?? 0}</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-ocean-900/70">Performances Hosted</p>
              </div>
              <div className="rounded-xl border border-ocean-200/70 px-3 py-3 text-center">
                <p className="font-poppins text-2xl font-extrabold text-ocean-900">{memberSinceYear}</p>
                <p className="mt-0.5 text-[10.5px] leading-tight text-ocean-900/70">Member Since</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-xl border border-ocean-200/70 bg-ocean-50 p-4 lg:w-[260px] lg:shrink-0">
              <h3 className="font-poppins text-[13px] font-bold text-ocean-900">Contact Information</h3>
            <div className="mt-2 space-y-2 text-sm text-ocean-900/80">
              {center.website && (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/facility-profile/icon-website.png" alt="" className="h-5 w-5 shrink-0" />
                  <a href={center.website} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2 hover:text-ocean-900">
                    {center.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {primaryLocation?.address && (
                <div className="flex items-start gap-2">
                  {/* No pin-in-badge asset in either provided zip (matching the
                      circular navy-badge style of the website/phone/email
                      icons) — drawn to match rather than using the
                      differently-styled plain pin from the edit-profile set. */}
                  <svg className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#003366" />
                    <path
                      d="M12 6.2c-2.1 0-3.8 1.7-3.8 3.8 0 2.6 3.8 6.8 3.8 6.8s3.8-4.2 3.8-6.8c0-2.1-1.7-3.8-3.8-3.8Z"
                      fill="#fff"
                    />
                    <circle cx="12" cy="10" r="1.3" fill="#003366" />
                  </svg>
                  <p>
                    {[primaryLocation.address, primaryLocation.city, primaryLocation.state].filter(Boolean).join(', ')}
                    {primaryLocation.zip_code ? ` ${primaryLocation.zip_code}` : ''}
                  </p>
                </div>
              )}
              {center.phone && (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/facility-profile/icon-contact.png" alt="" className="h-5 w-5 shrink-0" />
                  <p>{center.phone}</p>
                </div>
              )}
              {center.director_email && (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/facility-profile/icon-email.png" alt="" className="h-5 w-5 shrink-0" />
                  <p className="truncate">{center.director_email}</p>
                </div>
              )}
              {!center.website && !primaryLocation?.address && !center.phone && !center.director_email && (
                <p className="italic text-ocean-900/50">No contact details on file yet.</p>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-ocean-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-poppins text-[15px] font-bold text-ocean-900">Our Participating Communities</h3>
            <p className="text-xs text-ocean-900/60">Communities under this organization.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ocean-900">Sort by</span>
            <LocationSortSelect basePath={`/discover/center/${username}`} sort={sort} />
          </div>
        </div>

        {pageLocations.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {pageLocations.map((location) => (
              <li key={location.id} className="rounded-lg border border-ocean-200/70 bg-white px-3 py-2 text-sm text-ocean-900">
                <div className="flex flex-wrap items-center gap-3">
                  {getDisplayImageUrl(location.location_image_url, center.profile_image_url) ? (
                    <img
                      src={getDisplayImageUrl(location.location_image_url, center.profile_image_url) ?? undefined}
                      alt={location.name}
                      className="h-14 w-14 flex-shrink-0 rounded-lg border border-ocean-200/70 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-ocean-200/70 bg-amber-100 text-lg font-semibold text-amber-700">
                      {location.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ocean-900">{location.name}</p>
                    <p className="mt-0.5">
                      {[location.city, location.state].filter(Boolean).join(', ')}
                      {location.zip_code ? ` ${location.zip_code}` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-ocean-900/70">{location.resident_count ?? 'Unknown'} residents</span>
                      {location.supports_transport && (
                        <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-700">Transport available</span>
                      )}
                    </div>
                  </div>
                  {location.username && (
                    <Link
                      href={`/discover/location/${location.username}`}
                      className="shrink-0 rounded-lg border border-ocean-300 bg-white px-3 py-1.5 text-xs font-bold text-ocean-900 transition hover:bg-ocean-100"
                    >
                      View Facility Profile
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ocean-900/70">No locations available.</p>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1.5">
            <Link
              href={`/discover/center/${username}?sort=${sort}&page=${Math.max(1, currentPage - 1)}`}
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
                href={`/discover/center/${username}?sort=${sort}&page=${n}`}
                aria-current={n === currentPage ? 'page' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${
                  n === currentPage ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-ocean-300 text-ocean-900 hover:bg-ocean-50'
                }`}
              >
                {n}
              </Link>
            ))}
            <Link
              href={`/discover/center/${username}?sort=${sort}&page=${Math.min(totalPages, currentPage + 1)}`}
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
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ocean-900">Upcoming Request Slots</h3>
        {requestSlots && requestSlots.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {requestSlots.map((slot) => (
              <li key={slot.id} className="rounded-lg border border-ocean-200/70 bg-ocean-50 px-3 py-2 text-sm text-ocean-900">
                <p className="font-medium text-ocean-900">
                  {locationNameById.get(slot.center_location_id) ?? 'Location'} · {formatDate(slot.requested_date)}
                </p>
                <p className="mt-0.5">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                {slot.notes && <p className="mt-1 text-xs text-ocean-900/70">{slot.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ocean-900/70">No upcoming request slots posted.</p>
        )}
      </div>
    </section>
  )
}
