'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function EditCenterLocationPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const locationId = params.id

  const [locationUsername, setLocationUsername] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationZipCode, setLocationZipCode] = useState('')
  const [residentCount, setResidentCount] = useState(0)
  const [locationPhone, setLocationPhone] = useState('')
  const [locationImageUrl, setLocationImageUrl] = useState('')
  const [supportsTransport, setSupportsTransport] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30)

  useEffect(() => {
    async function loadLocation() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

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
        setError('Center profile not found.')
        setLoading(false)
        return
      }

      const { data: location, error: locationError } = await supabase
        .from('center_locations')
        .select('id, username, name, address, zip_code, resident_count, phone, location_image_url, supports_transport')
        .eq('id', locationId)
        .eq('center_id', center.id)
        .maybeSingle()

      if (locationError || !location) {
        setError('Location not found or access denied.')
        setLoading(false)
        return
      }

      setLocationUsername(location.username ?? '')
      setLocationName(location.name ?? '')
      setLocationAddress(location.address ?? '')
      setLocationZipCode(location.zip_code ?? '')
      setResidentCount(location.resident_count ?? 0)
      setLocationPhone(location.phone ?? '')
      setLocationImageUrl(location.location_image_url ?? '')
      setSupportsTransport(location.supports_transport ?? false)
      setLoading(false)
    }

    loadLocation()
  }, [locationId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const normalizedLocationUsername = normalizeUsername(locationUsername)
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedLocationUsername)) {
      setError('Location username must be 3-30 characters and use only lowercase letters, numbers, or underscores.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('center_locations')
      .update({
        username: normalizedLocationUsername,
        name: locationName.trim(),
        address: locationAddress.trim(),
        zip_code: locationZipCode,
        resident_count: residentCount,
        phone: locationPhone.trim() || null,
        location_image_url: locationImageUrl.trim() || null,
        supports_transport: supportsTransport,
        profile_complete: true,
      })
      .eq('id', locationId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard/center')
    router.refresh()
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Loading location...</p>
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Location</h1>
          <p className="mt-1 text-sm text-stone-600">Update details for this center location.</p>
        </div>
        <Link
          href="/dashboard/center"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          Back to dashboard
        </Link>
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
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-600 focus:ring"
            />
            <p className="mt-1 text-xs font-normal text-stone-500">Public URL: /discover/location/{locationUsername || 'location_slug'}</p>
          </label>

          <label className="block text-sm font-medium text-stone-800 sm:col-span-2">
            Location name <span className="text-rose-600">*</span>
            <input
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              required
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
            disabled={saving}
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
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

