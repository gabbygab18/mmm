'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatDateLabel, formatTimeLabel, startOfMonth, toDateInputValue } from './calendar-utils'
import { CalendarMonthGrid } from '@/components/mmm/calendar-month-grid'

type DiscoverySlot = {
  id: string
  date: string
  startTime: string
  endTime: string
  title: string
  subtitle: string
  distanceLabel: string
  profileHref: string
  requestHref: string
  requestLabel: string
}

type Props = {
  heading: string
  description: string
  emptyMessage: string
  slots: DiscoverySlot[]
}

export function DiscoverySlotCalendar({ heading, description, emptyMessage, slots }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))

  const slotsByDate = useMemo(() => {
    const map = new Map<string, DiscoverySlot[]>()
    for (const slot of slots) {
      const collection = map.get(slot.date) ?? []
      collection.push(slot)
      map.set(slot.date, collection)
    }
    return map
  }, [slots])

  const selectedSlots = (slotsByDate.get(selectedDate) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <section className="rounded-2xl border border-ocean-200/70 bg-white p-5 font-poppins shadow-sm">
      <CalendarMonthGrid
        title={heading}
        subtitle={description}
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        renderDayBadge={(iso) => {
          const count = slotsByDate.get(iso)?.length ?? 0
          if (count === 0) return null
          return (
            <span className="rounded-full bg-ocean-100 px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-ocean-700">
              {count}
            </span>
          )
        }}
      />

      <div className="mt-5 rounded-xl border border-ocean-200/70 bg-ocean-50 p-3">
        <p className="text-sm font-semibold text-ocean-900">{formatDateLabel(selectedDate)}</p>
        {selectedSlots.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {selectedSlots.map((slot) => (
              <li key={slot.id} className="rounded-lg border border-ocean-200/70 bg-white px-3 py-2 text-sm text-ocean-900">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ocean-900">{slot.title}</p>
                    <p className="mt-0.5 text-xs text-ocean-900/70">{slot.subtitle}</p>
                    <p className="mt-1 text-xs text-ocean-900/70">
                      {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)} · {slot.distanceLabel}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={slot.profileHref}
                      className="rounded-md border border-ocean-300 px-2 py-1 text-[11px] font-semibold text-ocean-900 transition hover:bg-ocean-50"
                    >
                      View profile
                    </Link>
                    <Link
                      href={slot.requestHref}
                      className="rounded-md border border-ocean-300 bg-ocean-50 px-2 py-1 text-[11px] font-semibold text-ocean-700 transition hover:bg-ocean-100"
                    >
                      {slot.requestLabel}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ocean-900/60">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

