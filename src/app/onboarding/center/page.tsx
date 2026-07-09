'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function CenterOnboardingPage() {
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)
  const [existingLocationId, setExistingLocationId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [locationUsername, setLocationUsername] = useState('')
  const [locationName, setLocationName] = useState('Main Location')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationZipCode, setLocationZipCode] = useState('')
  const [locationResidentCount, setLocationResidentCount] = useState(0)
  const [locationPhone, setLocationPhone] = useState('')
  const [locationImageUrl, setLocationImageUrl] = useState('')
  const [supportsTransport, setSupportsTransport] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadExistingProfile() {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setInitializing(false); return }
      const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (center) {
        setUsername(center.username ?? '')
        setName(center.name ?? '')
        setPhone(center.phone ?? '')
        setProfileImageUrl(center.profile_image_url ?? '')
        const { data: location } = await supabase
          .from('center_locations')
          .select('*')
          .eq('center_id', center.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (location) {
          setExistingLocationId(location.id)
          setLocationUsername(location.username ?? '')
          setLocationName(location.name ?? 'Main Location')
          setLocationAddress(location.address ?? '')
          setLocationZipCode(location.zip_code ?? '')
          setLocationResidentCount(location.resident_count ?? 0)
          setLocationPhone(location.phone ?? '')
          setLocationImageUrl(location.location_image_url ?? '')
          setSupportsTransport(location.supports_transport ?? false)
        }
      }
      setInitializing(false)
    }
    loadExistingProfile()
  }, [])

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
        p_profile_type: 'center',
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

    const normalizedUsername = normalizeUsername(username)
    const normalizedLocationUsername = normalizeUsername(locationUsername)
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setError('Username must be 3-30 characters and use only lowercase letters, numbers, or underscores.')
      setLoading(false)
      return
    }

    if (!/^[a-z0-9_]{3,30}$/.test(normalizedLocationUsername)) {
      setError('Location username must be 3-30 characters and use only lowercase letters, numbers, or underscores.')
      setLoading(false)
      return
    }

    if (usernameStatus === 'taken') {
      setError('That username is already taken. Please choose another one.')
      setLoading(false)
      return
    }

    const { data: savedCenter, error: upsertError } = await supabase
      .from('centers')
      .upsert(
        {
          user_id: user.id,
          username: normalizedUsername,
          name: name.trim(),
          phone: phone.trim() || null,
          profile_image_url: profileImageUrl.trim() || null,
          profile_complete: true,
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single()

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    const centerId = savedCenter.id

    const { data: locationUsernameAvailable, error: locationUsernameCheckError } = await supabase.rpc('is_location_username_available', {
      p_username: normalizedLocationUsername,
      p_exclude_location_id: existingLocationId,
    })

    if (locationUsernameCheckError) {
      setError(locationUsernameCheckError.message)
      setLoading(false)
      return
    }

    if (!locationUsernameAvailable) {
      setError('That location username is already taken. Please choose another one.')
      setLoading(false)
      return
    }

    const locationPayload = {
      center_id: centerId,
      username: normalizedLocationUsername,
      name: locationName.trim(),
      address: locationAddress.trim(),
      zip_code: locationZipCode,
      resident_count: locationResidentCount,
      phone: locationPhone.trim() || null,
      supports_transport: supportsTransport,
      location_image_url: locationImageUrl.trim() || null,
      profile_complete: true,
    }

    const locationMutation = existingLocationId
      ? supabase.from('center_locations').update(locationPayload).eq('id', existingLocationId)
      : supabase.from('center_locations').insert(locationPayload)

    const { error: locationError } = await locationMutation

    if (locationError) {
      setError(locationError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/center')
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
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-stone-50 to-white px-6 py-10">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-brand-200/70 bg-white/90 p-6 shadow-lg shadow-brand-100 backdrop-blur sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Center Profile</h1>
        <p className="mt-2 text-sm text-stone-600">
          Fields marked <span className="font-semibold text-rose-600">*</span> are required.
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
                placeholder="sunrise_center"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
              />
              <p className="mt-1 text-xs font-normal text-stone-500">Used in your public URL: /discover/center/{username || 'sunrise_center'}</p>
              {usernameStatus === 'checking' && <p className="mt-1 text-xs text-stone-500">Checking availability...</p>}
              {usernameStatus === 'available' && <p className="mt-1 text-xs text-emerald-700">Username is available.</p>}
              {usernameStatus === 'taken' && <p className="mt-1 text-xs text-rose-700">Username is already taken.</p>}
              {usernameStatus === 'invalid' && (
                <p className="mt-1 text-xs text-rose-700">Use 3-30 lowercase letters, numbers, or underscores.</p>
              )}
            </label>

            <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
              Center name <span className="text-rose-600">*</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800">
              Organization contact phone <span className="text-xs font-normal text-stone-500">optional</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
              />
            </label>

            <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
              Center profile photo URL <span className="text-xs font-normal text-stone-500">optional</span>
              <input
                type="url"
                value={profileImageUrl}
                onChange={(event) => setProfileImageUrl(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
              />
            </label>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h2 className="text-sm font-semibold text-stone-900">
              Primary Location
              {existingLocationId && (
                <span className="ml-2 text-xs font-normal text-stone-500">Add more locations from your dashboard.</span>
              )}
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-stone-800">
                Location username <span className="text-rose-600">*</span>
                <input
                  value={locationUsername}
                  onChange={(event) => setLocationUsername(normalizeUsername(event.target.value))}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z0-9_]{3,30}"
                  placeholder="main_building"
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
                <p className="mt-1 text-xs font-normal text-stone-500">Used in location URL: /discover/location/{locationUsername || 'main_building'}</p>
              </label>

              <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
                Location name <span className="text-rose-600">*</span>
                <input
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>

              <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
                Address <span className="text-rose-600">*</span>
                <input
                  value={locationAddress}
                  onChange={(event) => setLocationAddress(event.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>

              <label className="block text-sm font-medium text-stone-800">
                ZIP code <span className="text-rose-600">*</span>
                <input
                  value={locationZipCode}
                  onChange={(event) => setLocationZipCode(event.target.value)}
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>

              <label className="block text-sm font-medium text-stone-800">
                Number of residents at this location <span className="text-rose-600">*</span>
                <input
                  type="number"
                  min={0}
                  value={locationResidentCount}
                  onChange={(event) => setLocationResidentCount(Number(event.target.value))}
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>

              <label className="block text-sm font-medium text-stone-800">
                Location phone <span className="text-xs font-normal text-stone-500">optional</span>
                <input
                  value={locationPhone}
                  onChange={(event) => setLocationPhone(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>

              <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
                Common space photo URL <span className="text-xs font-normal text-stone-500">optional</span>
                <input
                  type="url"
                  value={locationImageUrl}
                  onChange={(event) => setLocationImageUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-600 focus:ring"
                />
              </label>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800">
              <input
                type="checkbox"
                checked={supportsTransport}
                onChange={(event) => setSupportsTransport(event.target.checked)}
              />
              We can provide transportation support
            </label>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save center profile'}
          </button>
        </form>
      </section>
    </main>
  )
}

