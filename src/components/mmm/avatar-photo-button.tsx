'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { PhotoEditor } from '@/components/mmm/photo-editor'
import { ACCEPT_ATTRIBUTE, saveProfilePhoto, validatePhoto, type ProfileTable } from '@/lib/mmm/profile-photo'

/**
 * The avatar *is* the control: a camera badge sits on the corner, hovering shows
 * "Change profile picture", and clicking goes straight to pick → crop → save,
 * the pattern the client asked for.
 *
 * Used in the dashboard sidebar and on the profile page, so it owns the whole
 * round trip (upload, write the profile row, refresh the server components).
 */

export function AvatarPhotoButton({
  url,
  table,
  size = 96,
  tooltip = 'Change profile picture',
  fallback,
  onSaved,
}: {
  url: string | null
  /** Which profile row owns the photo. */
  table: ProfileTable
  /** Diameter in px. */
  size?: number
  tooltip?: string
  /** Shown when there is no photo yet. */
  fallback?: React.ReactNode
  onSaved?: (url: string | null) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = '' // let the same file be re-picked after an error
    if (!file) return

    const problem = validatePhoto(file)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setPending(file)
  }

  const handleCropped = async (cropped: File) => {
    setPending(null)
    setBusy(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const result = await saveProfilePhoto(supabase, table, cropped)

    if (result.error) setError(result.error)
    else {
      onSaved?.(result.url ?? null)
      router.refresh()
    }
    setBusy(false)
  }

  const badge = Math.max(26, Math.round(size * 0.3))

  return (
    <div className="flex flex-col items-center">
      <div className="group relative" style={{ width: size, height: size }}>
        <div className="h-full w-full overflow-hidden rounded-full bg-ocean-100/90">
          {url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="Your profile photo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">{fallback}</div>
          )}
        </div>

        {/* Camera badge */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={tooltip}
          style={{ width: badge, height: badge }}
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full border-2 border-white bg-ocean-800 text-white shadow-md transition hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
        >
          {busy ? (
            <span className="block h-1/2 w-1/2 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-1/2 w-1/2">
              <path d="M9.4 4h5.2l1.2 1.6H19A2 2 0 0 1 21 7.6v10A2 2 0 0 1 19 19.6H5a2 2 0 0 1-2-2V7.6a2 2 0 0 1 2-2h3.2L9.4 4Zm2.6 4.4a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Zm0 1.9a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" />
            </svg>
          )}
        </button>

        {/* Tooltip — appears on hover and on keyboard focus. */}
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-ocean-900/95 px-2.5 py-1 font-poppins text-[10.5px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {tooltip}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={handlePick}
          aria-label={tooltip}
        />
      </div>

      {error && (
        <p className="mt-2 max-w-[200px] text-center font-poppins text-[10px] leading-tight text-red-200 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.35)]">
          {error}
        </p>
      )}

      {pending && <PhotoEditor file={pending} onCancel={() => setPending(null)} onConfirm={handleCropped} />}
    </div>
  )
}
