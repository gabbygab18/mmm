'use client'

import { useEffect, useMemo, useState } from 'react'

type Accent = 'amber' | 'brand'

type Props = {
  startTime: string
  endTime: string
  onChange: (startTime: string, endTime: string) => void
  accent?: Accent
  minHour?: number
  maxHour?: number
}

const ACCENT_STYLES: Record<Accent, { selected: string; anchor: string; hover: string }> = {
  amber: {
    selected: 'bg-amber-500/80 border-amber-500',
    anchor: 'ring-2 ring-amber-400 ring-offset-1',
    hover: 'hover:bg-amber-100',
  },
  brand: {
    selected: 'bg-brand-600/85 border-brand-600',
    anchor: 'ring-2 ring-brand-400 ring-offset-1',
    hover: 'hover:bg-brand-100',
  },
}

function normalizeTime(value: string) {
  return value.slice(0, 5)
}

function toMinutes(value: string) {
  const normalized = normalizeTime(value)
  const [hoursString, minutesString] = normalized.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0
  return hours * 60 + minutes
}

function toTimeString(totalMinutes: number) {
  const clamped = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 30)
  const hours = Math.floor(clamped / 60)
  const minutes = clamped % 60
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}`
}

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

export function TimeGridPicker({
  startTime,
  endTime,
  onChange,
  accent = 'brand',
  minHour = 8,
  maxHour = 22,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragAnchor, setDragAnchor] = useState<number | null>(null)
  const [dragCurrent, setDragCurrent] = useState<number | null>(null)

  const slots = useMemo(() => {
    const items: number[] = []
    for (let minute = minHour * 60; minute < maxHour * 60; minute += 30) {
      items.push(minute)
    }
    return items
  }, [minHour, maxHour])

  const persistedStart = toMinutes(startTime)
  const persistedEnd = toMinutes(endTime)

  const draftRange = useMemo(() => {
    if (!isDragging || dragAnchor == null || dragCurrent == null) return null
    const start = Math.min(dragAnchor, dragCurrent)
    const end = Math.max(dragAnchor, dragCurrent) + 30
    return { start, end }
  }, [isDragging, dragAnchor, dragCurrent])

  const activeRange = draftRange ?? {
    start: persistedStart,
    end: persistedEnd > persistedStart ? persistedEnd : persistedStart + 30,
  }

  const styles = ACCENT_STYLES[accent]

  function commitRange() {
    if (!isDragging || dragAnchor == null || dragCurrent == null) return
    const start = Math.min(dragAnchor, dragCurrent)
    const end = Math.max(dragAnchor, dragCurrent) + 30
    onChange(toTimeString(start), toTimeString(end))
    setIsDragging(false)
    setDragAnchor(null)
    setDragCurrent(null)
  }

  useEffect(() => {
    if (!isDragging) return

    function handlePointerUp() {
      commitRange()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, dragAnchor, dragCurrent])

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Time grid picker</p>
        <p className="text-xs text-stone-600">
          {formatTimeLabel(toTimeString(activeRange.start))} - {formatTimeLabel(toTimeString(activeRange.end))}
        </p>
      </div>

      <div className="max-h-[360px] overflow-y-auto rounded-lg border border-stone-200 bg-white p-2">
        <div className="space-y-1">
          {slots.map((slotMinute) => {
            const timeLabel = toTimeString(slotMinute)
            const inRange = slotMinute >= activeRange.start && slotMinute < activeRange.end
            const isAnchor = dragAnchor === slotMinute

            return (
              <button
                key={slotMinute}
                type="button"
                onPointerDown={() => {
                  setIsDragging(true)
                  setDragAnchor(slotMinute)
                  setDragCurrent(slotMinute)
                }}
                onPointerEnter={() => {
                  if (!isDragging) return
                  setDragCurrent(slotMinute)
                }}
                onPointerUp={() => commitRange()}
                className={[
                  'flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition select-none',
                  inRange ? `${styles.selected} text-white` : `border-stone-200 bg-white text-stone-700 ${styles.hover}`,
                  isAnchor ? styles.anchor : '',
                ].join(' ')}
              >
                <span className="font-medium">{formatTimeLabel(timeLabel)}</span>
                <span className="text-[10px] opacity-80">30 min</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-stone-500">Drag across blocks to select a continuous window in 30-minute increments.</p>
    </div>
  )
}
