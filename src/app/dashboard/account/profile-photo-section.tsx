'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AvatarPhotoButton } from '@/components/mmm/avatar-photo-button'
import { saveProfilePhoto, type ProfileTable } from '@/lib/mmm/profile-photo'

/**
 * "Change profile picture" on the profile page — click the avatar's camera
 * badge, crop and zoom, and it saves to the profile row and the sidebar.
 */

export function ProfilePhotoSection({
  table,
  initialUrl,
}: {
  table: ProfileTable
  initialUrl: string | null
}) {
  const router = useRouter()
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isFacility = table === 'centers'

  const handleRemove = async () => {
    setError(null)
    setSaved(false)
    setRemoving(true)

    const supabase = createSupabaseBrowserClient()
    const result = await saveProfilePhoto(supabase, table, null)

    if (result.error) setError(result.error)
    else {
      setUrl(null)
      setSaved(true)
      router.refresh()
    }
    setRemoving(false)
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-base font-bold text-stone-900">{isFacility ? 'Facility Photo' : 'Profile Photo'}</h2>
      <p className="mt-1 text-sm text-stone-500">
        {isFacility
          ? 'Musicians see this photo when they browse nearby communities.'
          : 'Communities see this photo on your profile and on performance requests.'}
      </p>

      <div className="mt-5 flex items-center gap-5">
        <AvatarPhotoButton
          url={url}
          table={table}
          size={104}
          tooltip={isFacility ? 'Change facility picture' : 'Change profile picture'}
          fallback={<span className="text-[11px] text-ocean-900/40">No photo</span>}
          onSaved={(next) => {
            setUrl(next)
            setSaved(true)
            setError(null)
          }}
        />

        <div className="min-w-0">
          <p className="text-sm text-stone-600">
            Click the camera to {url ? 'change' : 'add'} your photo. You can crop and zoom before it saves.
          </p>
          <p className="mt-1 text-xs text-stone-500">JPG or PNG, up to 5 MB.</p>

          {url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="mt-3 text-sm font-semibold text-stone-500 underline transition hover:text-stone-700 disabled:opacity-60"
            >
              {removing ? 'Removing…' : 'Remove photo'}
            </button>
          )}

          {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
          {saved && !error && <p className="mt-2 text-xs font-medium text-green-700">Photo saved.</p>}
        </div>
      </div>
    </section>
  )
}
