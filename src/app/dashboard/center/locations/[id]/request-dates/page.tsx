'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type RequestDateRow = {
  id: string
  requested_date: string
  start_time: string
  end_time: string
  notes: string | null
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month)
  const firstWeekday = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - firstWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatTimeLabel(value: string) {
  const [hoursString, minutesString] = value.split(':')
  const hours = Number(hoursString)
  const minutes = Number(minutesString)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${`${minutes}`.padStart(2, '0')} ${period}`
}

export default function CenterLocationRequestDatesPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const locationId = params.id

  const [locationName, setLocationName] = useState('')
  const [rows, setRows] = useState<RequestDateRow[]>([])
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError('You must be signed in to manage request slots.')
        setLoading(false)
        return
      }

      const { data: center, error: centerError } = await supabase
        .from('centers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (centerError || !center) {
        setError('Center profile not found. Complete onboarding first.')
        setLoading(false)
        return
      }

      const { data: location, error: locationError } = await supabase
        .from('center_locations')
        .select('id, name')
        .eq('id', locationId)
        .eq('center_id', center.id)
        .maybeSingle()

      if (locationError || !location) {
        setError('Location not found or not owned by your account.')
        setLoading(false)
        return
      }

      setLocationName(location.name)

      const { data: existingDates, error: datesError } = await supabase
        .from('center_request_dates')
        .select('id, requested_date, start_time, end_time, notes')
        .eq('center_location_id', locationId)
        .order('requested_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (datesError) {
        setError(datesError.message)
      } else {
        setRows(existingDates ?? [])
      }

      setLoading(false)
    }

    loadData()
  }, [locationId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setSaving(true)

    const supabase = createSupabaseBrowserClient()
    const { error: insertError } = await supabase.from('center_request_dates').insert({
      center_location_id: locationId,
      requested_date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      notes: notes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    const { data: refreshed, error: refreshError } = await supabase
      .from('center_request_dates')
      .select('id, requested_date, start_time, end_time, notes')
      .eq('center_location_id', locationId)
      .order('requested_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (refreshError) {
      setError(refreshError.message)
      setSaving(false)
      return
    }

    setRows(refreshed ?? [])
    setNotes('')
    setSaving(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: deleteError } = await supabase.from('center_request_dates').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setRows((current) => current.filter((row) => row.id !== id))
    router.refresh()
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Loading request slots...</p>
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)
  const selectedDateSlots = rows.filter((row) => row.requested_date === selectedDate)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request Slots</h1>
          <p className="mt-1 text-sm text-stone-600">Post open date/time slots for {locationName || 'this location'} using a calendar picker.</p>
        </div>
        <Link
          href="/dashboard/center"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
              className="rounded-md border border-stone-200 px-2.5 py-1 text-sm text-stone-600 transition hover:bg-stone-50"
            >
              Prev
            </button>
            <h2 className="text-base font-semibold text-stone-900">{monthLabel}</h2>
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
              className="rounded-md border border-stone-200 px-2.5 py-1 text-sm text-stone-600 transition hover:bg-stone-50"
            >
              Next
            </button>
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
              const slotCount = rows.filter((row) => row.requested_date === dayValue).length

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => setSelectedDate(dayValue)}
                  className={[
                    'min-h-[74px] rounded-xl border px-2 py-2 text-left transition',
                    isSelected ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-stone-200 bg-white hover:border-brand-300',
                    isCurrentMonth ? 'text-stone-900' : 'text-stone-300',
                  ].join(' ')}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  {slotCount > 0 && (
                    <div className="mt-2 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                      {slotCount} slot{slotCount === 1 ? '' : 's'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Selected date</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{formatDateLabel(selectedDate)}</p>
          </div>

          <TimeGridPicker
            startTime={startTime}
            endTime={endTime}
            onChange={(start, end) => {
              setStartTime(start)
              setEndTime(end)
            }}
            accent="brand"
          />

          <label className="block text-sm font-medium text-stone-800">
            Notes <span className="text-xs font-normal text-stone-500">optional</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Afternoon program, piano welcome, etc."
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
            />
          </label>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Preview</p>
            <p className="mt-1 text-sm text-stone-800">{formatDateLabel(selectedDate)} • {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}</p>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add request slot'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Slots on {formatDateLabel(selectedDate)}</h2>
        {selectedDateSlots.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {selectedDateSlots.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-stone-900">{formatTimeLabel(row.start_time)} - {formatTimeLabel(row.end_time)}</p>
                  {row.notes && <p className="text-xs text-stone-600">{row.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No slots posted for this date yet.</p>
        )}
      </div>
    </section>
  )
}
