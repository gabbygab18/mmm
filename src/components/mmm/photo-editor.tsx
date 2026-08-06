'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Profile photo cropper — drag to position, slider (or wheel) to zoom, then
 * export a square JPEG.
 *
 * Geometry, shared by the preview and the export so what you see is what you
 * get: the image is first scaled to *cover* a square viewport of VIEWPORT px,
 * then multiplied by `zoom`, then nudged by `pan`. Export redraws the exact
 * same rectangle onto a canvas scaled by `outputSize / VIEWPORT`.
 *
 * Panning is clamped so the image can never be dragged off the crop area.
 * No third-party cropper — the project ships no image libraries.
 */

const VIEWPORT = 260 // css px; fits a 320px-wide phone with margin
const MIN_ZOOM = 1
const MAX_ZOOM = 4

type Geometry = { left: number; top: number; width: number; height: number }

function geometryFor(naturalWidth: number, naturalHeight: number, zoom: number, panX: number, panY: number): Geometry {
  const cover = Math.max(VIEWPORT / naturalWidth, VIEWPORT / naturalHeight)
  const width = naturalWidth * cover * zoom
  const height = naturalHeight * cover * zoom
  return {
    width,
    height,
    left: (VIEWPORT - width) / 2 + panX,
    top: (VIEWPORT - height) / 2 + panY,
  }
}

/** Keeps the crop area fully covered by the image. */
function clampPan(naturalWidth: number, naturalHeight: number, zoom: number, panX: number, panY: number) {
  const { width, height } = geometryFor(naturalWidth, naturalHeight, zoom, 0, 0)
  const maxX = Math.max(0, (width - VIEWPORT) / 2)
  const maxY = Math.max(0, (height - VIEWPORT) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, panX)),
    y: Math.min(maxY, Math.max(-maxY, panY)),
  }
}

export function PhotoEditor({
  file,
  onCancel,
  onConfirm,
  outputSize = 512,
  title = 'Position your photo',
}: {
  file: File
  onCancel: () => void
  /** Receives the cropped square JPEG. */
  onConfirm: (cropped: File) => void
  outputSize?: number
  title?: string
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [exporting, setExporting] = useState(false)
  const [failed, setFailed] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null)

  // Load the chosen file and read its real dimensions.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setFailed(false)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Escape closes the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const applyZoom = useCallback(
    (next: number) => {
      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next))
      setZoom(clampedZoom)
      if (natural) {
        setPan((current) => {
          const { x, y } = clampPan(natural.width, natural.height, clampedZoom, current.x, current.y)
          return { x, y }
        })
      }
    },
    [natural],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!natural) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || !natural || drag.pointerId !== e.pointerId) return
    const next = clampPan(
      natural.width,
      natural.height,
      zoom,
      drag.panX + (e.clientX - drag.startX),
      drag.panY + (e.clientY - drag.startY),
    )
    setPan({ x: next.x, y: next.y })
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null
  }

  const nudge = (dx: number, dy: number) => {
    if (!natural) return
    const next = clampPan(natural.width, natural.height, zoom, pan.x + dx, pan.y + dy)
    setPan({ x: next.x, y: next.y })
  }

  const onKeyDownViewport = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 6
    if (e.key === 'ArrowLeft') nudge(step, 0)
    else if (e.key === 'ArrowRight') nudge(-step, 0)
    else if (e.key === 'ArrowUp') nudge(0, step)
    else if (e.key === 'ArrowDown') nudge(0, -step)
    else if (e.key === '+' || e.key === '=') applyZoom(zoom + 0.2)
    else if (e.key === '-' || e.key === '_') applyZoom(zoom - 0.2)
    else return
    e.preventDefault()
  }

  const confirm = async () => {
    const image = imageRef.current
    if (!image || !natural) return
    setExporting(true)

    const geometry = geometryFor(natural.width, natural.height, zoom, pan.x, pan.y)
    const ratio = outputSize / VIEWPORT

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setFailed(true)
      setExporting(false)
      return
    }

    // JPEG has no alpha — fill first so transparent PNGs don't come out black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, geometry.left * ratio, geometry.top * ratio, geometry.width * ratio, geometry.height * ratio)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) {
      setFailed(true)
      setExporting(false)
      return
    }

    onConfirm(new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' }))
    setExporting(false)
  }

  const geometry = natural ? geometryFor(natural.width, natural.height, zoom, pan.x, pan.y) : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/70 px-4 py-6"
    >
      <div className="max-h-full w-full max-w-[360px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-poppins text-[14px] font-bold text-ocean-900">{title}</h2>
        <p className="mt-1 font-poppins text-[11px] text-ocean-900/70">
          Drag the photo to move it, and use the slider to zoom. The circle is what people will see.
        </p>

        {/* ---- Crop area ---- */}
        <div
          role="application"
          aria-label="Photo position — drag, or use the arrow keys"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDownViewport}
          onWheel={(e) => {
            e.preventDefault()
            applyZoom(zoom + (e.deltaY < 0 ? 0.12 : -0.12))
          }}
          style={{ width: VIEWPORT, height: VIEWPORT }}
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-full border-2 border-ocean-300 bg-ocean-50 active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          {objectUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imageRef}
              src={objectUrl}
              alt=""
              draggable={false}
              onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
              onError={() => setFailed(true)}
              // Tailwind's Preflight sets `img { max-width: 100% }` — that
              // clamps the crop geometry's intended width to the 260px
              // viewport while height (no max-height rule) scales freely,
              // squashing any image wider than it is tall. max-w-none
              // overrides the clamp so the inline geometry renders as computed.
              className="max-w-none"
              style={
                geometry
                  ? { position: 'absolute', left: geometry.left, top: geometry.top, width: geometry.width, height: geometry.height }
                  : { position: 'absolute', opacity: 0 }
              }
            />
          )}
        </div>

        {/* ---- Zoom ---- */}
        <div className="mt-4 flex items-center gap-3">
          <span aria-hidden="true" className="font-poppins text-[12px] text-ocean-900/60">
            −
          </span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ocean-200 accent-ocean-700"
          />
          <span aria-hidden="true" className="font-poppins text-[15px] text-ocean-900/60">
            +
          </span>
        </div>

        {failed && (
          <p className="mt-3 font-poppins text-[11px] text-red-700">
            That image could not be prepared. Please try a different photo.
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-ocean-300 px-4 py-2 font-poppins text-[10px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!natural || exporting || failed}
            className="rounded-full bg-ocean-800 px-5 py-2 font-poppins text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-ocean-700 disabled:opacity-50"
          >
            {exporting ? 'Saving…' : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  )
}
