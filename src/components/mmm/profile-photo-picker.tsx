'use client'

import { ChangeEvent, useState } from 'react'
import { PhotoEditor } from '@/components/mmm/photo-editor'
import { ACCEPT_ATTRIBUTE, validatePhoto } from '@/lib/mmm/profile-photo'

/**
 * Circular photo preview + "Upload photo" / "Take photo" buttons, with the
 * crop-and-zoom editor in between. Hands the finished square JPEG to
 * `onPhotoReady` — the caller decides whether to upload it now (profile pages)
 * or hold it until an account exists (registration wizard).
 *
 * "Take photo" only appears on touch devices, where `capture` actually opens
 * the camera; on a desktop it would just be a second file dialog.
 */

const SIZES = {
  sm: { frame: 'h-20 w-20', text: 'text-[9px]' },
  lg: { frame: 'h-28 w-28', text: 'text-[10px]' },
} as const

export function ProfilePhotoPicker({
  currentUrl,
  onPhotoReady,
  busy = false,
  error = null,
  hint = 'JPG or PNG, up to 5 MB.',
  size = 'lg',
  changeLabel = 'Change photo',
}: {
  /** Photo shown in the circle — an uploaded URL or a local preview. */
  currentUrl: string | null
  onPhotoReady: (cropped: File) => void | Promise<void>
  busy?: boolean
  error?: string | null
  hint?: string
  size?: keyof typeof SIZES
  /** Button wording once a photo exists. */
  changeLabel?: string
}) {
  const [pending, setPending] = useState<File | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)

  const handlePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = '' // let the same file be re-picked after an error
    if (!file) return

    const problem = validatePhoto(file)
    if (problem) {
      setPickError(problem)
      return
    }
    setPickError(null)
    setPending(file)
  }

  const shown = error ?? pickError
  const buttonClass =
    'cursor-pointer rounded-full border border-ocean-300 bg-white px-3.5 py-1.5 font-poppins text-[10px] font-bold uppercase tracking-[0.1em] text-ocean-900 transition hover:bg-ocean-50 focus-within:ring-2 focus-within:ring-ocean-500'

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className={`${SIZES[size].frame} shrink-0 overflow-hidden rounded-full border-2 border-ocean-200 bg-ocean-50`}>
          {currentUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={currentUrl} alt="Your profile photo" className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center font-poppins ${SIZES[size].text} text-ocean-900/40`}>
              No photo
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <label className={buttonClass}>
              <input type="file" accept={ACCEPT_ATTRIBUTE} className="sr-only" onChange={handlePick} disabled={busy} />
              {currentUrl ? changeLabel : 'Upload photo'}
            </label>
            <label className={`${buttonClass} hidden [@media(pointer:coarse)]:inline-block`}>
              <input
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                capture="user"
                className="sr-only"
                onChange={handlePick}
                disabled={busy}
              />
              Take photo
            </label>
          </div>
          <p className="mt-1.5 font-poppins text-[10px] text-ocean-900/60">{busy ? 'Uploading…' : hint}</p>
        </div>
      </div>

      {shown && <p className="mt-2 font-poppins text-[10.5px] leading-tight text-red-700">{shown}</p>}

      {pending && (
        <PhotoEditor
          file={pending}
          onCancel={() => setPending(null)}
          onConfirm={async (cropped) => {
            setPending(null)
            await onPhotoReady(cropped)
          }}
        />
      )}
    </div>
  )
}
