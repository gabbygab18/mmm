'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type AvailabilityRow = {
  id: string
  available_date: string
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

function formatDateLabel(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
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

export default function MusicianAvailabilityPage() {
  const router = useRouter()
  const [musicianId, setMusicianId] = useState<string | null>(null)
  const [generalAvailableDays, setGeneralAvailableDays] = useState<string[]>([])
  const [rows, setRows] = useState<AvailabilityRow[]>([])
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
        setError('You must be signed in to manage availability.')
        setLoading(false)
        return
      }

      const { data: musician, error: musicianError } = await supabase
        .from('musicians')
        .select('id, general_available_days')
        .eq('user_id', user.id)
        .maybeSingle()

      if (musicianError || !musician) {
        setError('Musician profile not found. Complete onboarding first.')
        setLoading(false)
        return
      }

      setMusicianId(musician.id)
  setGeneralAvailableDays((musician.general_available_days as string[] | null) ?? [])

      const { data: dates, error: datesError } = await supabase
        .from('musician_availability_dates')
        .select('id, available_date, start_time, end_time, notes')
        .eq('musician_id', musician.id)
        .order('available_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (datesError) {
        setError(datesError.message)
      } else {
        setRows(dates ?? [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!musicianId) return

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createSupabaseBrowserClient()
    const { error: insertError } = await supabase.from('musician_availability_dates').insert({
      musician_id: musicianId,
      available_date: selectedDate,
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
      .from('musician_availability_dates')
      .select('id, available_date, start_time, end_time, notes')
      .eq('musician_id', musicianId)
      .order('available_date', { ascending: true })
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
    const { error: deleteError } = await supabase
      .from('musician_availability_dates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setRows((current) => current.filter((row) => row.id !== id))
    router.refresh()
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-stone-500">Loading availability dates...</p>
      </section>
    )
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)
  const selectedDateSlots = rows.filter((row) => row.available_date === selectedDate)

  return (
    <section className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Availability Slots</h1>
          <p className="mt-1 text-sm text-stone-600">Pick a date from the calendar, then add the time window you can perform.</p>
        </div>
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
              const slotCount = rows.filter((row) => row.available_date === dayValue).length
              const weekdayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(day)
              const isGeneralAvailabilityDay = generalAvailableDays.includes(weekdayLabel)

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => setSelectedDate(dayValue)}
                  className={`min-h-[74px] rounded-xl border px-2 py-2 text-left transition ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50 shadow-sm'
                      : isGeneralAvailabilityDay
                        ? 'border-sky-400 bg-sky-200 hover:border-sky-500'
                        : 'border-stone-200 bg-white hover:border-amber-300'
                  } ${isCurrentMonth ? 'text-stone-900' : 'text-stone-300'}`}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  {slotCount > 0 && (
                    <div className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      {slotCount} slot{slotCount === 1 ? '' : 's'}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-stone-600">
            <span className="inline-block h-3 w-3 rounded bg-sky-100 border border-sky-300" />
            <span>Soft highlight = your recurring day-of-week availability</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Selected date</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{formatDateLabel(selectedDate)}</p>
          </div>

          <div className="grid gap-4">
            <TimeGridPicker startTime={startTime} endTime={endTime} onChange={(start, end) => {
              setStartTime(start)
              setEndTime(end)
            }} accent="amber" />

            <label className="block text-sm font-medium text-stone-800">
              Notes <span className="text-xs font-normal text-stone-500">optional</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Morning set, 30-minute visit, piano only, etc."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Preview</p>
            <p className="mt-1 text-sm text-stone-800">{formatDateLabel(selectedDate)} • {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}</p>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add time slot'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Posted Slots</h2>
          <p className="text-xs text-stone-500">{selectedDateSlots.length} on selected day</p>
        </div>

        {rows.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-stone-900">{formatDateLabel(row.available_date)}</p>
                  <p className="text-xs text-stone-600">{formatTimeLabel(row.start_time)} - {formatTimeLabel(row.end_time)}</p>
                  {row.notes && <p className="text-xs text-stone-600">{row.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-stone-500">No slots posted yet.</p>
        )}
      </div>
    </section>
  )
}

