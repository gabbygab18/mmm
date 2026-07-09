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

  if (UUID_PATTERN.test(username)) {
    const { data: musicianById } = await supabase
      .from('musicians')
      .select('username')
      .eq('id', username)
      .maybeSingle()

    if (musicianById?.username) {
      redirect(`/discover/musician/${musicianById.username}`)
    }
  }

  const { data: musician, error: musicianError } = await supabase
    .from('musicians')
    .select(
      'id, username, name, bio, zip_code, profile_image_url, youtube_channel_url, music_types, instruments, band_size_preference, compensation_preference, general_available_days, willing_to_travel, travel_radius_miles, has_own_transport, profile_complete, approved'
    )
    .eq('username', username)
    .maybeSingle()

  if (musicianError || !musician) {
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
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Musician Profile</h1>
          <p className="mt-1 text-sm text-stone-600">Full profile and upcoming availability.</p>
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
          {musician.profile_image_url ? (
            <img
              src={musician.profile_image_url}
              alt={musician.name}
              className="h-24 w-24 rounded-full border border-stone-200 object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-stone-200 bg-brand-100 text-2xl font-semibold text-brand-700">
              {musician.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-stone-900">{musician.name}</h2>
            <p className="mt-1 text-sm text-stone-600">ZIP {musician.zip_code}</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {musician.approved && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Approved</span>
              )}
              {musician.profile_complete && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Profile complete</span>
              )}
              {musician.has_own_transport && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Own transport</span>
              )}
            </div>

            {musician.bio && <p className="mt-3 text-sm text-stone-700">{musician.bio}</p>}

            {musician.youtube_channel_url && (
              <div className="mt-3">
                <a
                  href={musician.youtube_channel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 underline hover:text-brand-800"
                >
                  YouTube Channel
                </a>
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Music Types</p>
                <p className="mt-1 text-sm text-stone-700">{musician.music_types?.length ? musician.music_types.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Instruments</p>
                <p className="mt-1 text-sm text-stone-700">{musician.instruments?.length ? musician.instruments.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">General Availability</p>
                <p className="mt-1 text-sm text-stone-700">{musician.general_available_days?.length ? musician.general_available_days.join(', ') : 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Travel</p>
                <p className="mt-1 text-sm text-stone-700">
                  {musician.willing_to_travel ? `Up to ${musician.travel_radius_miles ?? 0} miles` : 'Not willing to travel'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">General Weekly Availability Pattern</h3>
        <p className="mt-1 text-xs text-stone-600">Days this musician is typically available (soft highlight shows recurring day-of-week availability).</p>
        {musician.general_available_days && musician.general_available_days.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
              const isAvailable = musician.general_available_days.includes(day)
              return (
                <span
                  key={day}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isAvailable
                      ? 'border border-brand-400 bg-brand-100 text-brand-800 shadow-sm'
                      : 'border border-stone-200 bg-stone-50 text-stone-500'
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-stone-600">No recurring availability pattern set.</p>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-900">Upcoming Availability Slots</h3>
        {availability && availability.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {availability.map((slot) => (
              <li key={slot.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <p className="text-sm font-medium text-stone-900">
                  {formatDate(slot.available_date)} · {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </p>
                {slot.notes && <p className="mt-1 text-xs text-stone-600">{slot.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-600">No upcoming slots posted.</p>
        )}
      </div>
    </section>
  )
}
