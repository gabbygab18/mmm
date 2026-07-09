'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type Role = 'musician' | 'center_coordinator' | 'admin'

type CenterLocationOption = {
  id: string
  name: string
  zip_code: string
  center_name: string
}

type MusicianOption = {
  id: string
  name: string
  zip_code: string
  general_available_days?: string[]
}

type NearbyCenterRow = {
  location_id: string
  location_name: string
  location_zip_code: string
  center_name: string
}

type NearbyMusicianRow = {
  musician_id: string
  musician_name: string
  musician_zip_code: string
  general_available_days?: string[] | null
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

export default function NewRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMusicianId = searchParams.get('musicianId') ?? ''
  const initialCenterLocationId = searchParams.get('centerLocationId') ?? ''

  const [role, setRole] = useState<Role | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [ownMusicianId, setOwnMusicianId] = useState<string | null>(null)
  const [selectedMusicianId, setSelectedMusicianId] = useState(initialMusicianId)
  const [selectedCenterLocationId, setSelectedCenterLocationId] = useState(initialCenterLocationId)

  const [centerLocationOptions, setCenterLocationOptions] = useState<CenterLocationOption[]>([])
  const [musicianOptions, setMusicianOptions] = useState<MusicianOption[]>([])

  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMusicianGeneralDays, setSelectedMusicianGeneralDays] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be signed in to create a request.')
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: userRow, error: roleError } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()

      if (roleError || !userRow) {
        setError('Could not determine your account role.')
        setLoading(false)
        return
      }

      setRole(userRow.role as Role)

      if (userRow.role === 'musician') {
        const [meResult, nearbyResult] = await Promise.all([
          supabase
            .from('musicians')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.rpc('get_nearby_centers_for_musician', { result_limit: 100 }),
        ])

        const { data: me, error: meError } = meResult

        if (meError || !me) {
          setError('Complete your musician profile before creating requests.')
          setLoading(false)
          return
        }

        setOwnMusicianId(me.id)

        const { data: nearby, error: nearbyError } = nearbyResult

        if (nearbyError) {
          setError(nearbyError.message)
          setLoading(false)
          return
        }

        const dedupedLocations = new Map<string, CenterLocationOption>()
        for (const row of (nearby ?? []) as NearbyCenterRow[]) {
          dedupedLocations.set(row.location_id, {
            id: row.location_id,
            name: row.location_name,
            zip_code: row.location_zip_code,
            center_name: row.center_name,
          })
        }
        setCenterLocationOptions(Array.from(dedupedLocations.values()))
      }

      if (userRow.role === 'center_coordinator') {
        const { data: ownCenter, error: ownCenterError } = await supabase
          .from('centers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (ownCenterError || !ownCenter) {
          setError('Complete your center profile before creating requests.')
          setLoading(false)
          return
        }

        const { data: ownLocations, error: ownLocationsError } = await supabase
          .from('center_locations')
          .select('id, name, zip_code, centers!inner(name)')
          .eq('center_id', ownCenter.id)
          .order('name', { ascending: true })

        if (ownLocationsError) {
          setError(ownLocationsError.message)
          setLoading(false)
          return
        }

        const options = (ownLocations ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          zip_code: row.zip_code,
          center_name: (row.centers as { name?: string } | null)?.name ?? 'My center',
        }))
        setCenterLocationOptions(options)

        const preselectedLocation = initialCenterLocationId
        const locationToUse = preselectedLocation || options[0]?.id || ''
        if (!selectedCenterLocationId && locationToUse) {
          setSelectedCenterLocationId(locationToUse)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    async function refreshNearbyMusicians() {
      if (role !== 'center_coordinator' || !selectedCenterLocationId) return

      const supabase = createSupabaseBrowserClient()
      const { data: nearbyMusicians, error: nearbyMusiciansError } = await supabase.rpc('get_nearby_musicians_for_center', {
        target_location_id: selectedCenterLocationId,
        result_limit: 100,
      })

      if (nearbyMusiciansError) {
        setError(nearbyMusiciansError.message)
        return
      }

      const options = (nearbyMusicians ?? []).map((row: NearbyMusicianRow) => ({
        id: row.musician_id,
        name: row.musician_name,
        zip_code: row.musician_zip_code,
        general_available_days: row.general_available_days,
      }))
      setMusicianOptions(options)
      
      const preselected = initialMusicianId
      if (preselected) {
        const preselectedMusician = options.find((m: MusicianOption) => m.id === preselected)
        if (preselectedMusician) {
          setSelectedMusicianGeneralDays((preselectedMusician.general_available_days as string[] | null) ?? [])
        }
      }
    }

    refreshNearbyMusicians()
  }, [role, selectedCenterLocationId])

  const submitDisabled = useMemo(() => {
    if (!role) return true
    if (!selectedCenterLocationId) return true
    if (role === 'musician' && !ownMusicianId) return true
    if (role === 'center_coordinator' && !selectedMusicianId) return true
    return false
  }, [role, selectedCenterLocationId, ownMusicianId, selectedMusicianId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!role || !userId) {
      setError('Role or user session missing.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    const musicianId = role === 'musician' ? ownMusicianId : selectedMusicianId
    if (!musicianId || !selectedCenterLocationId) {
      setError('Please select both a musician and a center location.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()

    const { data: insertedRequest, error: insertError } = await supabase
      .from('requests')
      .insert({
        musician_id: musicianId,
        center_location_id: selectedCenterLocationId,
        requested_date: selectedDate,
        requested_start_time: startTime,
        requested_end_time: endTime,
        status: 'initiated',
        initiator_role: role,
        notes: notes.trim() || null,
      })
      .select('id')
      .single()

    if (insertError || !insertedRequest) {
      setError(insertError?.message ?? 'Failed to create request.')
      setSaving(false)
      return
    }

    const { error: proposalError } = await supabase.from('request_time_proposals').insert({
      request_id: insertedRequest.id,
      proposed_date: selectedDate,
      proposed_start_time: startTime,
      proposed_end_time: endTime,
      notes: notes.trim() || null,
      proposed_by_user_id: userId,
      proposal_status: 'pending',
    })

    if (proposalError) {
      setError(`Request created, but initial proposal write failed: ${proposalError.message}`)
      setSaving(false)
      return
    }

    const { error: historyError } = await supabase.from('request_status_history').insert({
      request_id: insertedRequest.id,
      old_status: null,
      new_status: 'initiated',
      changed_by_user_id: userId,
      reason: notes.trim() || null,
    })

    if (historyError) {
      setError(`Request created, but history write failed: ${historyError.message}`)
      setSaving(false)
      return
    }

    router.push('/dashboard/requests?created=1')
    router.refresh()
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Request</h1>
          <p className="mt-1 text-sm text-stone-600">Start a request with a calendar-style date and time window, like availability slots.</p>
        </div>
        <Link
          href="/dashboard/requests"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          Back to requests
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-stone-500">Loading request form...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {role === 'musician' && (
            <label className="block text-sm font-medium text-stone-800">
              Center location
              <select
                value={selectedCenterLocationId}
                onChange={(event) => setSelectedCenterLocationId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-amber-500 focus:ring"
                required
              >
                <option value="">Select a nearby center location</option>
                {centerLocationOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.center_name} — {option.name} (ZIP {option.zip_code})
                  </option>
                ))}
              </select>
            </label>
          )}

          {role === 'center_coordinator' && (
            <>
              <label className="block text-sm font-medium text-stone-800">
                Your location
                <select
                  value={selectedCenterLocationId}
                  onChange={(event) => setSelectedCenterLocationId(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-500 focus:ring"
                  required
                >
                  <option value="">Select your location</option>
                  {centerLocationOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} (ZIP {option.zip_code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-stone-800">
                Musician
                <select
                  value={selectedMusicianId}
                  onChange={(event) => {
                    setSelectedMusicianId(event.target.value)
                    const selected = musicianOptions.find((m) => m.id === event.target.value)
                    setSelectedMusicianGeneralDays((selected?.general_available_days as string[] | null) ?? [])
                  }}
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none ring-brand-500 focus:ring"
                  required
                >
                  <option value="">Select a nearby musician</option>
                  {musicianOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} (ZIP {option.zip_code})
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

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
                  const weekdayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(day)
                  const isGeneralAvailabilityDay = selectedMusicianGeneralDays.includes(weekdayLabel)

                  return (
                    <button
                      key={dayValue}
                      type="button"
                      onClick={() => setSelectedDate(dayValue)}
                      className={`min-h-[64px] rounded-xl border px-2 py-2 text-left transition ${
                        isSelected
                          ? 'border-amber-400 bg-amber-50 shadow-sm'
                          : isGeneralAvailabilityDay
                            ? 'border-sky-400 bg-sky-200 hover:border-sky-500'
                            : 'border-stone-200 bg-white hover:border-amber-300'
                      } ${isCurrentMonth ? 'text-stone-900' : 'text-stone-300'}`}
                    >
                      <div className="text-sm font-medium">{day.getDate()}</div>
                    </button>
                  )
                })}
              </div>

              {selectedMusicianGeneralDays.length > 0 && (
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-600">
                  <span className="inline-block h-3 w-3 rounded bg-sky-100 border border-sky-300" />
                  <span>Soft highlight = musician's recurring day-of-week availability</span>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
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

              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Preview</p>
                <p className="mt-1 text-sm text-stone-800">{formatDateLabel(selectedDate)} • {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}</p>
              </div>
            </div>
          </div>

          <label className="block text-sm font-medium text-stone-800">
            Notes <span className="text-xs font-normal text-stone-500">optional</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Any details for this request..."
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
            />
          </label>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitDisabled || saving}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create request'}
          </button>
        </form>
      )}
    </section>
  )
}

