'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import { CalendarMonthGrid } from '@/components/mmm/calendar-month-grid'
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

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
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
        <p className="text-sm text-ocean-900/60">Loading availability dates...</p>
      </section>
    )
  }

  const selectedDateSlots = rows.filter((row) => row.available_date === selectedDate)

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 font-poppins">
      <div>
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Manage Availability Slots</h1>
          <p className="mt-1 text-sm text-ocean-900/70">Pick a date from the calendar, then add the time window you can perform.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
          <CalendarMonthGrid
            title="Availability Calendar"
            subtitle="Pick a date, then add the time window you can perform."
            visibleMonth={visibleMonth}
            onMonthChange={setVisibleMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            renderDayBadge={(iso) => {
              const slotCount = rows.filter((row) => row.available_date === iso).length
              if (slotCount === 0) return null
              return (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-amber-800">
                  {slotCount}
                </span>
              )
            }}
            renderDayFooter={(_iso, day) => {
              const weekdayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(day)
              if (!generalAvailableDays.includes(weekdayLabel)) return null
              return <span className="mt-2 block h-2 w-2 rounded-full bg-sky-500" title="Recurring availability" />
            }}
          />

          <div className="mt-3 flex items-center gap-3 text-xs text-ocean-900/70">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span>Your recurring day-of-week availability</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-ocean-900/60">Selected date</p>
            <p className="mt-1 text-lg font-semibold text-ocean-900">{formatDateLabel(selectedDate)}</p>
          </div>

          <div className="grid gap-4">
            <TimeGridPicker startTime={startTime} endTime={endTime} onChange={(start, end) => {
              setStartTime(start)
              setEndTime(end)
            }} accent="amber" />

            <label className="block text-sm font-medium text-ocean-900">
              Notes <span className="text-xs font-normal text-ocean-900/60">optional</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Morning set, 30-minute visit, piano only, etc."
                className="mt-1 w-full rounded-lg border border-ocean-300 px-3 py-2 outline-none ring-amber-500 focus:ring"
              />
            </label>
          </div>

          <div className="rounded-xl border border-ocean-200/70 bg-ocean-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-900/60">Preview</p>
            <p className="mt-1 text-sm text-ocean-900">{formatDateLabel(selectedDate)} • {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}</p>
          </div>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-ocean-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ocean-900 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Add time slot'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ocean-900/60">Posted Slots</h2>
          <p className="text-xs text-ocean-900/60">{selectedDateSlots.length} on selected day</p>
        </div>

        {rows.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 rounded-lg border border-ocean-200/70 bg-ocean-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ocean-900">{formatDateLabel(row.available_date)}</p>
                  <p className="text-xs text-ocean-900/70">{formatTimeLabel(row.start_time)} - {formatTimeLabel(row.end_time)}</p>
                  {row.notes && <p className="text-xs text-ocean-900/70">{row.notes}</p>}
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
          <p className="mt-3 text-sm text-ocean-900/60">No slots posted yet.</p>
        )}
      </div>
    </section>
  )
}

