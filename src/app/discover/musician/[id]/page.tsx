import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type AllowedRole = 'musician' | 'center_coordinator' | 'admin'

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

export default async function MusicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator' && role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()
  const { id: username } = await params
  const MUSICIAN_COLUMNS =
    'id, username, name, bio, zip_code, profile_image_url, youtube_channel_url, music_types, instruments, band_size_preference, compensation_preference, general_available_days, willing_to_travel, travel_radius_miles, has_own_transport, profile_complete, approved'

  let musician: {
    id: string
    username: string | null
    name: string
    bio: string | null
    zip_code: string | null
    profile_image_url: string | null
    youtube_channel_url: string | null
    music_types: string[] | null
    instruments: string[] | null
    band_size_preference: string | null
    compensation_preference: string | null
    general_available_days: string[] | null
    willing_to_travel: boolean | null
    travel_radius_miles: number | null
    has_own_transport: boolean | null
    profile_complete: boolean | null
    approved: boolean | null
  } | null = null

  if (UUID_PATTERN.test(username)) {
    const { data: musicianById } = await supabase.from('musicians').select(MUSICIAN_COLUMNS).eq('id', username).maybeSingle()

    if (musicianById?.username) {
      redirect(`/discover/musician/${musicianById.username}`)
    }
    // A musician can exist with no username assigned yet — serve it directly
    // by id rather than 404ing on a username-shaped link that never resolves.
    musician = musicianById ?? null
  }

  if (!musician) {
    const { data: musicianByUsername } = await supabase.from('musicians').select(MUSICIAN_COLUMNS).eq('username', username).maybeSingle()
    musician = musicianByUsername ?? null
  }

  if (!musician) {
    notFound()
  }

  const { data: availability } = await supabase
    .from('musician_availability_dates')
    .select('id, available_date, start_time, end_time, notes')
    .eq('musician_id', musician.id)
    .gte('available_date', new Date().toISOString().slice(0, 10))
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(20)

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Musician Profile</h1>
          <p className="mt-1 text-sm text-ocean-900/70">Full profile and upcoming availability.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm font-medium text-ocean-900 transition hover:bg-ocean-50"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {musician.profile_image_url ? (
            <img
              src={musician.profile_image_url}
              alt={musician.name}
              className="h-24 w-24 rounded-full border border-ocean-200/70 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ocean-200/70 bg-ocean-100 text-2xl font-semibold text-ocean-700">
              {musician.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-ocean-900">{musician.name}</h2>
            <p className="mt-1 text-sm text-ocean-900/70">ZIP {musician.zip_code}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {musician.approved && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Approved</span>
              )}
              {musician.profile_complete && (
                <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-900">Profile complete</span>
              )}
              {musician.has_own_transport && (
                <span className="rounded-full bg-ocean-100 px-2 py-0.5 text-xs font-medium text-ocean-900">Own transport</span>
              )}
            </div>

            {musician.bio && <p className="mt-3 text-sm text-ocean-900">{musician.bio}</p>}

            {musician.youtube_channel_url && (
              <div className="mt-3">
                <a
                  href={musician.youtube_channel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean-700 underline hover:text-ocean-900"
                >
                  YouTube Channel
                </a>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900/60">Music Types</p>
                <p className="mt-1 text-sm text-ocean-900">{musician.music_types?.length ? musician.music_types.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900/60">Instruments</p>
                <p className="mt-1 text-sm text-ocean-900">{musician.instruments?.length ? musician.instruments.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900/60">General Availability</p>
                <p className="mt-1 text-sm text-ocean-900">{musician.general_available_days?.length ? musician.general_available_days.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900/60">Travel</p>
                <p className="mt-1 text-sm text-ocean-900">
                  {musician.willing_to_travel ? `Up to ${musician.travel_radius_miles ?? 0} miles` : 'Not willing to travel'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ocean-900">General Weekly Availability Pattern</h3>
        <p className="mt-1 text-xs text-ocean-900/70">Days this musician is typically available (soft highlight shows recurring day-of-week availability).</p>
        {musician.general_available_days && musician.general_available_days.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const isAvailable = (musician.general_available_days ?? []).includes(day)
              return (
                <span
                  key={day}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isAvailable
                      ? 'border border-ocean-400 bg-ocean-100 text-ocean-900 shadow-sm'
                      : 'border border-ocean-200/70 bg-ocean-50 text-ocean-900/60'
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-ocean-900/70">No recurring availability pattern set.</p>
        )}
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-ocean-900">Upcoming Availability Slots</h3>
        {availability && availability.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {availability.map((slot) => (
              <li key={slot.id} className="rounded-lg border border-ocean-200/70 bg-ocean-50 px-3 py-2">
                <p className="text-sm font-medium text-ocean-900">
                  {formatDate(slot.available_date)} · {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </p>
                {slot.notes && <p className="mt-1 text-xs text-ocean-900/70">{slot.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ocean-900/70">No upcoming slots posted.</p>
        )}
      </div>
    </section>
  )
}
