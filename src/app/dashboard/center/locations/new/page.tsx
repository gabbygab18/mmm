'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function AddLocationPage() {
  const router = useRouter()
  const [locationUsername, setLocationUsername] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationZipCode, setLocationZipCode] = useState('')
  const [residentCount, setResidentCount] = useState(0)
  const [locationPhone, setLocationPhone] = useState('')
  const [locationImageUrl, setLocationImageUrl] = useState('')
  const [supportsTransport, setSupportsTransport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('You must be signed in.')
      setLoading(false)
      return
    }

    const { data: center, error: centerError } = await supabase
      .from('centers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (centerError || !center) {
      setError('Center profile not found. Complete onboarding first.')
      setLoading(false)
      return
    }

    const normalizedLocationUsername = normalizeUsername(locationUsername)
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedLocationUsername)) {
      setError('Location username must be 3-30 characters and use only lowercase letters, numbers, or underscores.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('center_locations').insert({
      center_id: center.id,
      username: normalizedLocationUsername,
      name: locationName.trim(),
      address: locationAddress.trim(),
      zip_code: locationZipCode,
      resident_count: residentCount,
      phone: locationPhone.trim() || null,
      supports_transport: supportsTransport,
      location_image_url: locationImageUrl.trim() || null,
      profile_complete: true,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/center')
    router.refresh()
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/center" className="text-sm text-stone-500 hover:text-stone-700">
          ← Back to dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add a location</h1>
        <p className="mt-1 text-sm text-stone-600">
          Each location can post its own performance requests and will be matched independently.
          Fields marked <span className="font-semibold text-rose-600">*</span> are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-800">
            Location username <span className="text-rose-600">*</span>
            <input
              value={locationUsername}
              onChange={(event) => setLocationUsername(normalizeUsername(event.target.value))}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]{3,30}"
              placeholder="east_wing"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
            <p className="mt-1 text-xs font-normal text-stone-500">Used in public URL: /discover/location/{locationUsername || 'east_wing'}</p>
          </label>

          <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
            Location name <span className="text-rose-600">*</span>
            <input
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              required
              placeholder="East Wing, Building B, etc."
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
            Address <span className="text-rose-600">*</span>
            <input
              value={locationAddress}
              onChange={(event) => setLocationAddress(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
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
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Number of residents <span className="text-rose-600">*</span>
            <input
              type="number"
              min={0}
              value={residentCount}
              onChange={(event) => setResidentCount(Number(event.target.value))}
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800">
            Location phone <span className="text-xs font-normal text-stone-500">optional</span>
            <input
              value={locationPhone}
              onChange={(event) => setLocationPhone(event.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
          </label>

          <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
            Common space photo URL <span className="text-xs font-normal text-stone-500">optional</span>
            <input
              type="url"
              value={locationImageUrl}
              onChange={(event) => setLocationImageUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={supportsTransport}
            onChange={(event) => setSupportsTransport(event.target.checked)}
          />
          This location can provide transportation support
        </label>

        {error && <p className="text-sm font-medium text-red-700">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Add location'}
          </button>
          <Link
            href="/dashboard/center"
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  )
}

