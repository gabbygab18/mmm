'use client'

import type { ReactNode } from 'react'
import { buildCalendarDays, sameDay, toDateInputValue } from '@/app/components/calendar-utils'

/**
 * The shared month grid every dashboard calendar renders.
 *
 * There were separate hand-rolled copies of this markup behind Scheduled
 * Events, the slot calendar, availability, and the request forms. They drifted
 * — different arrow buttons, different weekday header weights, different cell
 * heights — because nothing tied them together. Anything common to all of them
 * (month header, weekday row, day cells, selection) lives here now; callers
 * supply only what is genuinely specific to their calendar, through the two
 * render props.
 */
export function CalendarMonthGrid({
  title,
  subtitle,
  visibleMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  renderDayBadge,
  renderDayFooter,
  headerRight,
}: {
  title: string
  subtitle?: string
  visibleMonth: Date
  onMonthChange: (next: Date) => void
  /** ISO yyyy-mm-dd. */
  selectedDate: string
  onSelectDate: (iso: string) => void
  /** Small badge in the cell's top-right — typically an item count. */
  renderDayBadge?: (iso: string, day: Date) => ReactNode
  /** Anything below the date number — status dots, and so on. */
  renderDayFooter?: (iso: string, day: Date) => ReactNode
  /** Extra controls beside the month stepper. */
  headerRight?: ReactNode
}) {
  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  const step = (delta: number) =>
    onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + delta, 1))

  return (
    <>
      {/* Title and the month stepper stack below sm — side by side, the
          stepper left so little room on a phone that the heading wrapped
          one word per line. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-garamond text-lg font-bold text-ocean-900">{title}</h2>
          {subtitle && <p className="font-poppins text-[12.5px] text-ocean-900/70">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {headerRight}
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean-900 transition hover:bg-ocean-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <p className="min-w-[110px] text-center font-garamond text-[17px] font-bold text-ocean-900 sm:min-w-[130px]">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-100 text-ocean-900 transition hover:bg-ocean-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center font-poppins text-xs font-bold uppercase tracking-wide text-ocean-900">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth()
          const isSelected = sameDay(day, selectedDateObject)
          const dayValue = toDateInputValue(day)

          return (
            <button
              key={dayValue}
              type="button"
              onClick={() => onSelectDate(dayValue)}
              aria-pressed={isSelected}
              className={[
                // Kept short on phones: at seven columns a tall cell plus
                // rounded-xl renders as an elongated pill rather than the
                // squarish box the design calls for.
                'min-h-[60px] rounded-xl border px-2 py-1.5 text-left transition sm:min-h-[76px] sm:py-2',
                isSelected
                  ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                  : 'border-ocean-200/70 bg-white hover:border-emerald-300',
                isCurrentMonth ? 'text-ocean-900' : 'text-ocean-900/30',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-sm font-medium">{day.getDate()}</span>
                {renderDayBadge?.(dayValue, day)}
              </div>
              {renderDayFooter?.(dayValue, day)}
            </button>
          )
        })}
      </div>
    </>
  )
}
