'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

const WEEKDAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export default function MusicianOnboardingPage() {
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [musicTypesText, setMusicTypesText] = useState('')
  const [instrumentsText, setInstrumentsText] = useState('')
  const [bandSizePreference, setBandSizePreference] = useState('solo')
  const [compensationPreference, setCompensationPreference] = useState('free')
  const [generalAvailableDays, setGeneralAvailableDays] = useState<string[]>([])
  const [willingToTravel, setWillingToTravel] = useState(true)
  const [travelRadiusMiles, setTravelRadiusMiles] = useState(15)
  const [hasOwnTransport, setHasOwnTransport] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadExistingProfile() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInitializing(false); return }
      const { data: musician } = await supabase
        .from('musicians')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (musician) {
        setUsername(musician.username ?? '')
        setName(musician.name ?? '')
        setPhone(musician.phone ?? '')
        setZipCode(musician.zip_code ?? '')
        setBio(musician.bio ?? '')
        setMusicTypesText((musician.music_types ?? []).join(', '))
        setInstrumentsText((musician.instruments ?? []).join(', '))
        setBandSizePreference(musician.band_size_preference ?? 'solo')
        setCompensationPreference(musician.compensation_preference ?? 'free')
        setGeneralAvailableDays(musician.general_available_days ?? [])
        setWillingToTravel(musician.willing_to_travel ?? true)
        setTravelRadiusMiles(musician.travel_radius_miles ?? 15)
        setHasOwnTransport(musician.has_own_transport ?? false)
        setProfileImageUrl(musician.profile_image_url ?? '')
        setYoutubeChannelUrl(musician.youtube_channel_url ?? '')
      }
      setInitializing(false)
    }
    loadExistingProfile()
  }, [])

  const toggleAvailableDay = (day: string) => {
    setGeneralAvailableDays((current) =>
      current.includes(day) ? current.filter((v) => v !== day) : [...current, day]
    )
  }

  const parseCsv = (value: string) =>
    value.split(',').map((item) => item.trim()).filter(Boolean)

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)

  useEffect(() => {
    const normalized = normalizeUsername(username)

    if (!normalized) {
      setUsernameStatus('idle')
      return
    }

    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setUsernameStatus('invalid')
      return
    }

    let active = true
    setUsernameStatus('checking')

    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.rpc('is_profile_username_available', {
        p_username: normalized,
        p_profile_type: 'musician',
      })

      if (!active) return
      if (error) {
        setUsernameStatus('idle')
        return
      }

      setUsernameStatus(data ? 'available' : 'taken')
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [username])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be signed in to complete onboarding.')
      setLoading(false)
      return
    }

    const musicTypes = parseCsv(musicTypesText)
    const instruments = parseCsv(instrumentsText)
    const normalizedZip = zipCode.replace(/\D/g, '').slice(0, 5)
    const normalizedPhone = phone.trim()
    const normalizedUsername = normalizeUsername(username)

    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setError('Username must be 3-30 characters and use only lowercase letters, numbers, or underscores.')
      setLoading(false)
      return
    }

    if (usernameStatus === 'taken') {
      setError('That username is already taken. Please choose another one.')
      setLoading(false)
      return
    }

    const profileComplete =
      !!normalizedUsername &&
      !!name.trim() &&
      normalizedZip.length === 5 &&
      !!normalizedPhone &&
      musicTypes.length > 0 &&
      instruments.length > 0 &&
      generalAvailableDays.length > 0

    const { error: upsertError } = await supabase.from('musicians').upsert(
      {
        user_id: user.id,
        username: normalizedUsername,
        name: name.trim(),
        zip_code: normalizedZip,
        phone: normalizedPhone,
        bio: bio.trim() || null,
        music_types: musicTypes,
        instruments,
        band_size_preference: bandSizePreference,
        compensation_preference: compensationPreference,
        willing_to_travel: willingToTravel,
        travel_radius_miles: willingToTravel ? travelRadiusMiles : 0,
        has_own_transport: hasOwnTransport,
        profile_image_url: profileImageUrl.trim() || null,
        youtube_channel_url: youtubeChannelUrl.trim() || null,
        general_available_days: generalAvailableDays,
        profile_complete: profileComplete,
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/musician')
    router.refresh()
  }

  if (initializing) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-stone-500">Loading your profile…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-rose-50 to-white px-6 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-amber-200/70 bg-white/90 p-6 shadow-lg shadow-rose-100 backdrop-blur sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Musician Profile</h1>
        <p className="mt-2 text-sm text-stone-600">
          Fields marked <span className="font-semibold text-rose-600">*</span> are required before your profile goes live.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-stone-800">
              Username <span className="text-rose-600">*</span>
              <input
                value={username}
                onChange={(event) => setUsername(normalizeUsername(event.target.value))}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9_]{3,30}"
                placeholder="your_name"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
              <p className="mt-1 text-xs font-normal text-stone-500">Used in your public URL: /discover/musician/{username || 'your_name'}</p>
              {usernameStatus === 'checking' && <p className="mt-1 text-xs text-stone-500">Checking availability...</p>}
              {usernameStatus === 'available' && <p className="mt-1 text-xs text-emerald-700">Username is available.</p>}
              {usernameStatus === 'taken' && <p className="mt-1 text-xs text-rose-700">Username is already taken.</p>}
              {usernameStatus === 'invalid' && (
                <p className="mt-1 text-xs text-rose-700">Use 3-30 lowercase letters, numbers, or underscores.</p>
              )}
            </label>

            <label className="block text-sm font-medium text-stone-800">
              Full name <span className="text-rose-600">*</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800">
              Phone number <span className="text-rose-600">*</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                placeholder="(555) 555-5555"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800">
              ZIP code <span className="text-rose-600">*</span>
              <input
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                required
                maxLength={5}
                pattern="[0-9]{5}"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800">
              Band size
              <select
                value={bandSizePreference}
                onChange={(event) => setBandSizePreference(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:ring"
              >
                <option value="solo">Solo</option>
                <option value="duo">Duo</option>
                <option value="group">Group / Ensemble</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-stone-800">
              Music type(s) <span className="text-rose-600">*</span>
              <span className="ml-1 text-xs font-normal text-stone-500">comma-separated</span>
              <input
                value={musicTypesText}
                onChange={(event) => setMusicTypesText(event.target.value)}
                required
                placeholder="Jazz, Classical, Folk"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800">
              Instrument(s) <span className="text-rose-600">*</span>
              <span className="ml-1 text-xs font-normal text-stone-500">comma-separated</span>
              <input
                value={instrumentsText}
                onChange={(event) => setInstrumentsText(event.target.value)}
                required
                placeholder="Piano, Guitar"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
              Compensation preference
              <select
                value={compensationPreference}
                onChange={(event) => setCompensationPreference(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-amber-500 focus:ring"
              >
                <option value="free">Volunteer — free of charge</option>
                <option value="paid-preferred">Compensation preferred</option>
                <option value="either">Open to either</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-stone-800">
            Profile photo URL <span className="text-xs font-normal text-stone-500">optional</span>
            <input
              type="url"
              value={profileImageUrl}
              onChange={(event) => setProfileImageUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            YouTube channel URL <span className="text-xs font-normal text-stone-500">optional — share your music with centers</span>
            <input
              type="url"
              value={youtubeChannelUrl}
              onChange={(event) => setYoutubeChannelUrl(event.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Bio <span className="text-xs font-normal text-stone-500">optional — tell centers about yourself</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
            />
          </label>

          <fieldset className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <legend className="px-1 text-sm font-semibold text-stone-900">
              General available days <span className="text-rose-600">*</span>
            </legend>
            <p className="mt-1 text-xs text-stone-500">Check all days you are typically available.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEKDAY_OPTIONS.map((day) => (
                <label key={day} className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:border-amber-300">
                  <input
                    type="checkbox"
                    checked={generalAvailableDays.includes(day)}
                    onChange={() => toggleAvailableDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-900">Travel preferences</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={willingToTravel}
                  onChange={(event) => setWillingToTravel(event.target.checked)}
                />
                Willing to travel
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={hasOwnTransport}
                  onChange={(event) => setHasOwnTransport(event.target.checked)}
                />
                I have my own transportation
              </label>

              <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
                Travel radius (miles)
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={travelRadiusMiles}
                  onChange={(event) => setTravelRadiusMiles(Number(event.target.value))}
                  disabled={!willingToTravel}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring disabled:cursor-not-allowed disabled:bg-stone-200"
                />
              </label>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>
    </main>
  )
}

