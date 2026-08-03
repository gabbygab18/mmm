'use client'

import { useMemo, useState } from 'react'
import {
  buildCalendarDays,
  formatDateLabel,
  formatTimeLabel,
  sameDay,
  startOfMonth,
  toDateInputValue,
} from '@/app/components/calendar-utils'

type CalendarEvent = {
  id: string
  status: 'accepted' | 'completed'
  requested_date: string
  requested_start_time: string | null
  requested_end_time: string | null
  musician_name: string
  center_name: string
  location_name: string
}

type Props = {
  events: CalendarEvent[]
}

export function ScheduleCalendar({ events }: Props) {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const collection = map.get(event.requested_date) ?? []
      collection.push(event)
      map.set(event.requested_date, collection)
    }
    return map
  }, [events])

  const selectedEvents = (eventsByDate.get(selectedDate) ?? []).sort((a, b) => {
    const left = a.requested_start_time ?? '00:00'
    const right = b.requested_start_time ?? '00:00'
    return left.localeCompare(right)
  })

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  return (
    <section className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-garamond text-lg font-bold text-ocean-900">Calendar View</h2>
            <p className="font-poppins text-[12.5px] text-ocean-900/70">Visual schedule of scheduled and completed events.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
            className="rounded-md border border-ocean-800/50 px-2.5 py-1 font-poppins text-[12.5px] text-ocean-900 transition hover:bg-ocean-900/5"
          >
            Prev
          </button>
          <p className="min-w-[130px] text-center font-poppins text-[12.5px] font-semibold text-ocean-900">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
            className="rounded-md border border-ocean-800/50 px-2.5 py-1 font-poppins text-[12.5px] text-ocean-900 transition hover:bg-ocean-900/5"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center font-poppins text-xs font-semibold uppercase tracking-wide text-ocean-900/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
          const isSelected = sameDay(day, selectedDateObject)
          const dayValue = toDateInputValue(day)
          const dayEvents = eventsByDate.get(dayValue) ?? []
          const scheduledCount = dayEvents.filter((event) => event.status === 'accepted').length
          const completedCount = dayEvents.filter((event) => event.status === 'completed').length
          const totalCount = dayEvents.length

          return (
            <button
              key={dayValue}
              type="button"
              onClick={() => setSelectedDate(dayValue)}
              className={[
                'min-h-[84px] rounded-xl border px-2 py-2 text-left transition',
                isSelected ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-ocean-200/70 bg-white hover:border-emerald-300',
                isCurrentMonth ? 'text-ocean-900' : 'text-ocean-900/30',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-sm font-medium">{day.getDate()}</span>
                {totalCount > 0 && (
                  <span className="rounded-full bg-ocean-100 px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-ocean-700">{totalCount}</span>
                )}
              </div>

              {totalCount > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  {scheduledCount > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500" title={`${scheduledCount} scheduled`} />}
                  {completedCount > 0 && <span className="h-2 w-2 rounded-full bg-ocean-500" title={`${completedCount} completed`} />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-ocean-200/70 bg-ocean-50/60 px-3 py-2 font-poppins text-xs text-ocean-900/80">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Scheduled events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ocean-500" />
          <span>Completed events</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-ocean-200/70 bg-ocean-50/60 p-3">
        <p className="font-poppins text-sm font-semibold text-ocean-900">{formatDateLabel(selectedDate)}</p>
        {selectedEvents.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {selectedEvents.map((event) => (
              <li key={event.id} className="rounded-lg border border-ocean-200/70 bg-white px-3 py-2 font-poppins text-sm text-ocean-900/80">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ocean-900">{event.center_name} · {event.location_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${event.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-ocean-100 text-ocean-700'}`}>
                    {event.status === 'accepted' ? 'scheduled' : event.status}
                  </span>
                </div>
                <p className="mt-1 font-poppins text-xs text-ocean-900/60">
                  {event.requested_start_time && event.requested_end_time
                    ? `${formatTimeLabel(event.requested_start_time)} - ${formatTimeLabel(event.requested_end_time)}`
                    : 'Time not set'}
                  {' · '}
                  {event.musician_name}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-poppins text-sm text-ocean-900/50">No scheduled events on this date.</p>
        )}
      </div>
    </section>
  )
}

