'use client'

import { useMemo, useState } from 'react'
import { formatDateLabel, formatTimeLabel, startOfMonth, toDateInputValue } from '@/app/components/calendar-utils'
import { CalendarMonthGrid } from '@/components/mmm/calendar-month-grid'

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

  return (
    <section className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-5 shadow-sm">
      <CalendarMonthGrid
        title="Calendar View"
        subtitle="Visual schedule of scheduled and completed events."
        visibleMonth={visibleMonth}
        onMonthChange={setVisibleMonth}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        renderDayBadge={(iso) => {
          const count = eventsByDate.get(iso)?.length ?? 0
          if (count === 0) return null
          return (
            <span className="rounded-full bg-ocean-100 px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-ocean-700">
              {count}
            </span>
          )
        }}
        renderDayFooter={(iso) => {
          const dayEvents = eventsByDate.get(iso) ?? []
          if (dayEvents.length === 0) return null
          const scheduledCount = dayEvents.filter((event) => event.status === 'accepted').length
          const completedCount = dayEvents.filter((event) => event.status === 'completed').length
          return (
            <div className="mt-2 flex items-center gap-1.5">
              {scheduledCount > 0 && <span className="h-2 w-2 rounded-full bg-emerald-500" title={`${scheduledCount} scheduled`} />}
              {completedCount > 0 && <span className="h-2 w-2 rounded-full bg-ocean-500" title={`${completedCount} completed`} />}
            </div>
          )
        }}
      />

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

