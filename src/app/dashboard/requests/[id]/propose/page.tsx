'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TimeGridPicker } from '@/app/components/TimeGridPicker'
import {
  buildCalendarDays,
  formatDateLabel,
  formatTimeLabel,
  sameDay,
  startOfMonth,
  toDateInputValue,
} from '@/app/components/calendar-utils'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type RequestProposal = {
  id: string
  proposed_date: string
  proposed_start_time: string
  proposed_end_time: string
  notes: string | null
  proposal_status: string
  created_at: string
}

export default function SuggestAlternateTimePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const requestId = params.id

  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()))
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<string>('initiated')
  const [history, setHistory] = useState<RequestProposal[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be signed in to suggest an alternate time.')
        setLoading(false)
        return
      }

      const { data: requestRow, error: requestError } = await supabase
        .from('requests')
        .select('id, status, requested_date, requested_start_time, requested_end_time')
        .eq('id', requestId)
        .maybeSingle()

      if (requestError || !requestRow) {
        setError('Request not found or inaccessible.')
        setLoading(false)
        return
      }

      setRequestStatus(requestRow.status)
      setSelectedDate(requestRow.requested_date)
      setStartTime(requestRow.requested_start_time ?? '10:00')
      setEndTime(requestRow.requested_end_time ?? '11:00')

      const { data: proposals, error: proposalsError } = await supabase
        .from('request_time_proposals')
        .select('id, proposed_date, proposed_start_time, proposed_end_time, notes, proposal_status, created_at')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })

      if (proposalsError) {
        setError(proposalsError.message)
        setLoading(false)
        return
      }

      setHistory(proposals ?? [])
      setLoading(false)
    }

    load()
  }, [requestId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (requestStatus !== 'initiated') {
      setError('Alternate times can only be suggested while request is initiated.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please sign in again.')
      setSaving(false)
      return
    }

    const { error: supersedeError } = await supabase
      .from('request_time_proposals')
      .update({ proposal_status: 'superseded' })
      .eq('request_id', requestId)
      .eq('proposal_status', 'pending')

    if (supersedeError) {
      setError(supersedeError.message)
      setSaving(false)
      return
    }

    const { error: insertError } = await supabase.from('request_time_proposals').insert({
      request_id: requestId,
      proposed_date: selectedDate,
      proposed_start_time: startTime,
      proposed_end_time: endTime,
      notes: notes.trim() || null,
      proposed_by_user_id: user.id,
      proposal_status: 'pending',
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    const { error: updateRequestError } = await supabase
      .from('requests')
      .update({
        requested_date: selectedDate,
        requested_start_time: startTime,
        requested_end_time: endTime,
      })
      .eq('id', requestId)

    if (updateRequestError) {
      setError(updateRequestError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard/requests')
    router.refresh()
  }

  if (loading) {
    return <p className="text-sm text-stone-500">Loading request...</p>
  }

  const calendarDays = buildCalendarDays(visibleMonth)
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth)
  const selectedDateObject = new Date(`${selectedDate}T00:00:00`)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suggest Alternate Time</h1>
          <p className="mt-1 text-sm text-stone-600">Propose a new date/time window using the same calendar-style picker.</p>
        </div>
        <Link
          href="/dashboard/requests"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          Back to requests
        </Link>
      </div>

      {requestStatus !== 'initiated' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This request is no longer in initiated status, so alternate proposals are disabled.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
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

                return (
                  <button
                    key={dayValue}
                    type="button"
                    onClick={() => setSelectedDate(dayValue)}
                    className={[
                      'min-h-[64px] rounded-xl border px-2 py-2 text-left transition',
                      isSelected ? 'border-brand-400 bg-brand-50 shadow-sm' : 'border-stone-200 bg-white hover:border-brand-300',
                      isCurrentMonth ? 'text-stone-900' : 'text-stone-300',
                    ].join(' ')}
                  >
                    <div className="text-sm font-medium">{day.getDate()}</div>
                  </button>
                )
              })}
            </div>
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
            placeholder="Share why this alternate time works better."
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none ring-brand-500 focus:ring"
          />
        </label>

        {error && <p className="text-sm font-medium text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving || requestStatus !== 'initiated'}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Submitting...' : 'Send alternate proposal'}
        </button>
      </form>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-stone-900">Proposal history</h2>
        {history.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {history.map((proposal) => (
              <li key={proposal.id} className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                <p className="font-medium text-stone-900">
                  {formatDateLabel(proposal.proposed_date)} • {formatTimeLabel(proposal.proposed_start_time)} - {formatTimeLabel(proposal.proposed_end_time)}
                </p>
                <p className="text-xs text-stone-500">{proposal.proposal_status} • {new Date(proposal.created_at).toLocaleString()}</p>
                {proposal.notes && <p className="mt-1 text-xs text-stone-600">{proposal.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">No proposals yet.</p>
        )}
      </div>
    </section>
  )
}
