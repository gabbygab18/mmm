'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { notifyRequestInitiatedAction, checkNewRequestConflictAction } from './actions'

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

    // The calendar lets you page back into previous months, and nothing
    // stopped a request being booked into a date that has already passed.
    if (selectedDate < toDateInputValue(new Date())) {
      setError('Please choose a date that has not already passed.')
      return
    }

    const musicianId = role === 'musician' ? ownMusicianId : selectedMusicianId
    if (!musicianId || !selectedCenterLocationId) {
      setError('Please select both a musician and a center location.')
      return
    }

    setSaving(true)

    // Guard before writing anything: the musician may already be booked in
    // this window, or have blocked the date out. Nothing checked this before,
    // so overlapping requests could be created and even accepted.
    const conflictMessage = await checkNewRequestConflictAction(musicianId, selectedDate, startTime, endTime)
    if (conflictMessage) {
      setError(conflictMessage)
      setSaving(false)
      return
    }

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

    // Awaited: navigating away right after firing this would abort the
    // in-flight server action before the email/alert send completes.
    await notifyRequestInitiatedAction(insertedRequest.id).catch(() => {})

    router.push('/dashboard/requests?status=created')
    router.refresh()
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  return (
    <section className="mx-auto max-w-[1200px] space-y-6">
      <div
        className="flex items-center justify-between gap-4 rounded-2xl px-7 py-6"
        style={{ background: 'linear-gradient(90deg, #dbe8f6 0%, #f5f8fc 100%)' }}
      >
        <div>
          <h1 className="font-garamond text-[26px] font-bold text-ocean-900 sm:text-[32px]">Request a Performance</h1>
          <p className="mt-1 max-w-md font-poppins text-[12.5px] text-ocean-900/70">
            Fill out the form below to request a live music performance for your residents. We&apos;ll connect you
            with a volunteer musician.
          </p>
        </div>
        <Link
          href="/dashboard/requests"
          className="shrink-0 rounded-lg border border-ocean-800/50 bg-white/70 px-3.5 py-1.5 font-poppins text-[11px] font-semibold text-ocean-900 transition hover:bg-white"
        >
          Back to requests
        </Link>
      </div>

      {loading ? (
        <p className="font-poppins text-[12.5px] text-ocean-900/60">Loading request form...</p>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-5 rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6 shadow-sm">
            <div>
              <h2 className="font-garamond text-[22px] font-bold text-ocean-900">Performance Details</h2>
              <p className="mt-0.5 font-poppins text-[12px] text-ocean-900/70">
                Please provide the details of your requested performance.
              </p>
            </div>

            {role === 'musician' && (
              <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
                Your location
                <select
                  value={selectedCenterLocationId}
                  onChange={(event) => setSelectedCenterLocationId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
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
                {/* Most facilities only ever have the one location their
                    account represents — asking them to pick it is a
                    pointless extra step. Only show the picker for the rare
                    facility that's actually added more than one. */}
                {centerLocationOptions.length > 1 ? (
                  <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
                    Your location
                    <select
                      value={selectedCenterLocationId}
                      onChange={(event) => setSelectedCenterLocationId(event.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
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
                ) : (
                  centerLocationOptions[0] && (
                    <p className="font-poppins text-[11px] text-ocean-900/60">
                      Location: <span className="font-semibold text-ocean-900">{centerLocationOptions[0].name}</span>{' '}
                      (ZIP {centerLocationOptions[0].zip_code})
                    </p>
                  )
                )}

                <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
                  Musician
                  <select
                    value={selectedMusicianId}
                    onChange={(event) => {
                      setSelectedMusicianId(event.target.value)
                      const selected = musicianOptions.find((m) => m.id === event.target.value)
                      setSelectedMusicianGeneralDays((selected?.general_available_days as string[] | null) ?? [])
                    }}
                    className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-ocean-200/70 bg-white p-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
                    className="rounded-md border border-ocean-800/40 px-2.5 py-1 font-poppins text-[10.5px] text-ocean-900 transition hover:bg-ocean-900/5"
                  >
                    Prev
                  </button>
                  <h3 className="font-poppins text-[12.5px] font-bold text-ocean-900">{monthLabel}</h3>
                  <button
                    type="button"
                    onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
                    className="rounded-md border border-ocean-800/40 px-2.5 py-1 font-poppins text-[10.5px] text-ocean-900 transition hover:bg-ocean-900/5"
                  >
                    Next
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center font-poppins text-[8.5px] font-bold uppercase tracking-wide text-ocean-900/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="mt-1.5 grid grid-cols-7 gap-1">
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
                        className={`min-h-[34px] rounded-md border px-1 py-1 text-left font-poppins text-[10.5px] transition ${
                          isSelected
                            ? 'border-ocean-500 bg-ocean-100 shadow-sm'
                            : isGeneralAvailabilityDay
                              ? 'border-ocean-300 bg-ocean-50 hover:border-ocean-400'
                              : 'border-ocean-100 bg-white hover:border-ocean-300'
                        } ${isCurrentMonth ? 'text-ocean-900' : 'text-ocean-900/30'}`}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })}
                </div>

                {selectedMusicianGeneralDays.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 font-poppins text-[9.5px] text-ocean-900/60">
                    <span className="inline-block h-2.5 w-2.5 rounded bg-ocean-50 border border-ocean-300" />
                    <span>Musician&apos;s recurring availability</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-xl border border-ocean-200/70 bg-white p-4">
                <div>
                  <p className="font-poppins text-[9px] font-bold uppercase tracking-wide text-ocean-900/50">Selected date</p>
                  <p className="mt-0.5 font-poppins text-[13px] font-bold text-ocean-900">{formatDateLabel(selectedDate)}</p>
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

                <div className="rounded-lg border border-ocean-200/70 bg-ocean-50/60 p-2.5">
                  <p className="font-poppins text-[9px] font-bold uppercase tracking-wide text-ocean-900/50">Preview</p>
                  <p className="mt-0.5 font-poppins text-[11px] text-ocean-900">
                    {formatDateLabel(selectedDate)} · {formatTimeLabel(startTime)} - {formatTimeLabel(endTime)}
                  </p>
                </div>
              </div>
            </div>

            <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
              Notes <span className="font-normal text-ocean-900/50">(optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Any details for this request..."
                className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
              />
            </label>

            {error && <p className="font-poppins text-[11.5px] font-medium text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitDisabled || saving}
              className="rounded-lg bg-ocean-800 px-5 py-2.5 font-poppins text-[12.5px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>

          <BookingStatusPanel />
        </form>
      )}
    </section>
  )
}

const STATUS_STEPS = [
  { key: 'requested', label: 'Requested', body: 'Your performance request has been submitted.', icon: '/mmm/icons/status-requested.png' },
  { key: 'accepted', label: 'Accepted', body: 'A volunteer musician has accepted your request.', icon: '/mmm/icons/status-accepted.png' },
  { key: 'scheduled', label: 'Scheduled', body: 'The performance is confirmed on the calendar.', icon: '/mmm/icons/status-scheduled.png' },
  { key: 'completed', label: 'Completed', body: 'The performance has been completed.', icon: '/mmm/icons/status-completed.png' },
]

/** Static reference panel — the lifecycle every request moves through, shown
    beside the form so a first-time requester knows what happens next.
    Icons are cropped straight from the approved mockup (page 17), not
    redrawn — see public/mmm/icons/status-*.png. */
function BookingStatusPanel() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'linear-gradient(180deg, #dbe8f6 0%, #c3d9ef 100%)' }}
    >
      <h2 className="font-garamond text-[22px] font-bold text-ocean-900">Booking Status</h2>
      <p className="mt-0.5 font-poppins text-[12px] text-ocean-900/70">Track your request from start to finish.</p>

      <div className="relative mt-6">
        <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-white/50" aria-hidden="true" />
        <ul className="relative space-y-6">
          {STATUS_STEPS.map((s) => (
            <li key={s.key} className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.icon} alt="" className="h-10 w-10 shrink-0 rounded-full" />
              <div>
                <p className="font-poppins text-[12.5px] font-bold text-ocean-900">{s.label}</p>
                <p className="mt-0.5 font-poppins text-[11px] leading-snug text-ocean-900/80">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <hr className="my-6 border-t border-white/50" />

      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mmm/icons/status-cancelled.png" alt="" className="h-10 w-10 shrink-0 rounded-full" />
        <div>
          <p className="font-poppins text-[12.5px] font-bold text-ocean-900">Cancelled</p>
          <p className="mt-0.5 font-poppins text-[11px] leading-snug text-ocean-900/80">The performance request was cancelled.</p>
        </div>
      </div>
    </div>
  )
}

