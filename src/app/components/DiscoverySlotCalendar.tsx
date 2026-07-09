'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  buildCalendarDays,
  formatDateLabel,
  formatTimeLabel,
  sameDay,
  startOfMonth,
  toDateInputValue,
} from './calendar-utils'

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

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{heading}</h2>
          <p className="text-sm text-stone-600">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            className="rounded-md border border-stone-200 px-2.5 py-1 text-sm text-stone-600 transition hover:bg-stone-50"
          >
            Prev
          </button>
          <p className="min-w-[130px] text-center text-sm font-semibold text-stone-900">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            className="rounded-md border border-stone-200 px-2.5 py-1 text-sm text-stone-600 transition hover:bg-stone-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
          const isSelected = sameDay(day, selectedDateObject)
          const dayValue = toDateInputValue(day)
          const daySlots = slotsByDate.get(dayValue) ?? []

          return (
            <button
              key={dayValue}
              type="button"
              onClick={() => setSelectedDate(dayValue)}
              className={[
                'min-h-[84px] rounded-xl border px-2 py-2 text-left transition',
                isSelected ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-stone-200 bg-white hover:border-brand-300',
                isCurrentMonth ? 'text-stone-900' : 'text-stone-300',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{day.getDate()}</span>
                {daySlots.length > 0 && (
                  <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">{daySlots.length}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-3">
        <p className="text-sm font-semibold text-stone-900">{formatDateLabel(selectedDate)}</p>
        {selectedSlots.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {selectedSlots.map((slot) => (
              <li key={slot.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">{slot.title}</p>
                    <p className="mt-0.5 text-xs text-stone-600">{slot.subtitle}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {formatTimeLabel(slot.startTime)} - {formatTimeLabel(slot.endTime)} · {slot.distanceLabel}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Link
                      href={slot.profileHref}
                      className="rounded-md border border-stone-300 px-2 py-1 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                      View profile
                    </Link>
                    <Link
                      href={slot.requestHref}
                      className="rounded-md border border-brand-300 bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      {slot.requestLabel}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

