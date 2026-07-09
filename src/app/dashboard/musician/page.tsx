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

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export default async function MusicianDashboardPage() {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()

  const { data: musician } = await supabase
    .from('musicians')
    .select('id, username, name, phone, zip_code, music_types, instruments, band_size_preference, compensation_preference, general_available_days, travel_radius_miles, has_own_transport, willing_to_travel, profile_image_url, youtube_channel_url, profile_complete, approved')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: availabilityDates } = musician
    ? await supabase
        .from('musician_availability_dates')
        .select('id, available_date, start_time, end_time, notes')
        .eq('musician_id', musician.id)
        .order('available_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(8)
    : { data: null }

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">My Profile</h1>
          <p className="mt-1 text-sm text-stone-500">Manage your musician profile and availability.</p>
        </div>
        {musician && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/discover/musician/${musician.username ?? musician.id}`}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Public profile
            </Link>
            <Link
              href="/onboarding/musician"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>

      {!musician && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">Profile setup required</p>
          <p className="mt-1 text-sm text-amber-800">Complete your profile before posting availability to centers.</p>
          <Link
            href="/onboarding/musician"
            className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500"
          >
            Set up my profile
          </Link>
        </div>
      )}

      {musician && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {/* Hero */}
          <div className="flex items-center gap-5 border-b border-stone-100 bg-gradient-to-r from-brand-50 to-brand-100 p-6">
            {musician.profile_image_url ? (
              <img
                src={musician.profile_image_url}
                alt={musician.name}
                className="h-20 w-20 flex-shrink-0 rounded-full border-2 border-white object-cover shadow"
              />
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-200 text-2xl font-bold text-brand-700 shadow">
                {musician.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-stone-900">{musician.name}</h2>
              <p className="mt-0.5 text-sm text-stone-500">ZIP {musician.zip_code} · {musician.phone}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {musician.approved ? (
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">✓ Approved</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Pending review</span>
                )}
                {!musician.profile_complete && (
                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Profile incomplete</span>
                )}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid divide-stone-100 sm:grid-cols-2 sm:divide-x">
            <div className="space-y-3 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Music</p>
              <div className="space-y-1.5 text-sm text-stone-700">
                <p><span className="font-semibold">Types:</span> {musician.music_types?.length ? musician.music_types.join(', ') : <span className="text-stone-400">Not set</span>}</p>
                <p><span className="font-semibold">Instruments:</span> {musician.instruments?.length ? musician.instruments.join(', ') : <span className="text-stone-400">Not set</span>}</p>
                <p><span className="font-semibold">Format:</span> {BAND_LABELS[musician.band_size_preference ?? ''] ?? <span className="text-stone-400">Not set</span>}</p>
                <p><span className="font-semibold">Compensation:</span> {COMP_LABELS[musician.compensation_preference ?? ''] ?? <span className="text-stone-400">Not set</span>}</p>
              </div>
              {musician.youtube_channel_url ? (
                <div className="pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">YouTube</p>
                  <a
                    href={musician.youtube_channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-800"
                  >
                    View channel
                  </a>
                </div>
              ) : (
                <div className="pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400">YouTube</p>
                  <p className="mt-1 text-sm text-stone-400">Not set — <Link href="/onboarding/musician" className="underline">add your channel</Link></p>
                </div>
              )}
            </div>

            <div className="space-y-3 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Travel</p>
              <div className="space-y-1.5 text-sm text-stone-700">
                <p><span className="font-semibold">Radius:</span> {musician.willing_to_travel ? `${musician.travel_radius_miles} miles` : 'Not willing to travel'}</p>
                <p><span className="font-semibold">Own transport:</span> {musician.has_own_transport ? 'Yes' : 'No'}</p>
              </div>

              <p className="pt-2 text-xs font-bold uppercase tracking-wider text-stone-400">Generally available</p>
              {musician.general_available_days?.length ? (
                <div className="flex flex-wrap gap-1">
                  {(musician.general_available_days as string[]).map((day) => (
                    <span key={day} className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
                      {day.slice(0, 3)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-400">Not set</p>
              )}
            </div>
          </div>

          {!musician.profile_complete && (
            <div className="border-t border-stone-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
              Your profile is missing required fields.{' '}
              <Link href="/onboarding/musician" className="font-semibold underline">Complete it now</Link>{' '}
              to appear in center searches.
            </div>
          )}
        </div>
      )}

      {musician && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Date Availability</h3>
              <p className="text-sm text-stone-500">Post specific open dates so centers can discover you.</p>
            </div>
            <Link
              href="/dashboard/musician/availability"
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Manage dates
            </Link>
          </div>

          {availabilityDates && availabilityDates.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {availabilityDates.map((item) => (
                <li key={item.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
                  <p className="font-semibold text-stone-900">{formatDateLabel(item.available_date)}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{formatTimeLabel(item.start_time)} – {formatTimeLabel(item.end_time)}</p>
                  {item.notes && <p className="mt-0.5 text-xs text-stone-500">{item.notes}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-400">No dates posted yet.</p>
          )}
        </div>
      )}
    </section>
  )
}

