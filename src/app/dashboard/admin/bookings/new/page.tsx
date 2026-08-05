'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { createManualBookingAction } from '../actions'

type MusicianOption = { id: string; name: string; zip_code: string }
type LocationOption = { id: string; name: string; zip_code: string; center_name: string }

/**
 * Admin manual matching — create a booking directly between any approved
 * musician and any approved+confirmed facility location, bypassing the
 * radius-based discovery both sides normally rely on. For cases the
 * automatic matching can't or shouldn't handle on its own.
 */
export default function AdminManualBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const justCreated = searchParams.get('created') === '1'

  const [musicians, setMusicians] = useState<MusicianOption[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)

  const [musicianId, setMusicianId] = useState('')
  const [centerLocationId, setCenterLocationId] = useState('')
  const [requestedDate, setRequestedDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [notes, setNotes] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
      if (userRow?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      const [{ data: musicianRows }, { data: locationRows }] = await Promise.all([
        supabase
          .from('musicians')
          .select('id, name, zip_code')
          .eq('approved', true)
          .eq('profile_complete', true)
          .is('deleted_at', null)
          .order('name', { ascending: true }),
        supabase
          .from('center_locations')
          .select('id, name, zip_code, centers!inner(name, approved, confirmed, deleted_at)')
          .eq('centers.approved', true)
          .eq('centers.confirmed', true)
          .is('centers.deleted_at', null)
          .order('name', { ascending: true }),
      ])

      setMusicians((musicianRows ?? []) as MusicianOption[])
      setLocations(
        ((locationRows ?? []) as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          zip_code: row.zip_code,
          center_name: (Array.isArray(row.centers) ? row.centers[0] : row.centers)?.name ?? 'Facility',
        })),
      )
      setLoading(false)
    }
    load()
  }, [])

  const submitDisabled = !musicianId || !centerLocationId || !requestedDate || !startTime || !endTime || pending

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('musicianId', musicianId)
      formData.set('centerLocationId', centerLocationId)
      formData.set('requestedDate', requestedDate)
      formData.set('startTime', startTime)
      formData.set('endTime', endTime)
      formData.set('notes', notes)
      const result = await createManualBookingAction(formData)
      // A successful call redirects server-side and never resolves here —
      // only a failure returns.
      if (result && !result.ok) setError(result.error ?? 'Failed to create booking.')
    })
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Manual Booking</h1>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            Match a musician and facility directly — skips the automatic radius-based discovery both sides normally
            rely on. The request still lands in each side&apos;s Requests list as usual and either can accept it.
          </p>
        </div>
        <Link
          href="/dashboard/admin/oversight"
          className="shrink-0 rounded-lg border border-ocean-800/50 px-3.5 py-1.5 font-poppins text-[11px] font-semibold text-ocean-900 transition hover:bg-ocean-900/5"
        >
          Back to oversight
        </Link>
      </div>

      {justCreated && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 font-poppins text-[12.5px] font-medium text-emerald-800">
          Booking created and sent to both sides.
        </div>
      )}

      {loading ? (
        <p className="font-poppins text-[12.5px] text-ocean-900/60">Loading musicians and facilities…</p>
      ) : (
        <div className="space-y-5 rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6 shadow-sm">
          <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
            Musician
            <select
              value={musicianId}
              onChange={(e) => setMusicianId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
            >
              <option value="">Select a musician</option>
              {musicians.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (ZIP {m.zip_code})
                </option>
              ))}
            </select>
            {musicians.length === 0 && (
              <span className="mt-1 block font-poppins text-[10.5px] text-ocean-900/60">
                No approved, profile-complete musicians yet.
              </span>
            )}
          </label>

          <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
            Facility location
            <select
              value={centerLocationId}
              onChange={(e) => setCenterLocationId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
            >
              <option value="">Select a facility location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.center_name} — {l.name} (ZIP {l.zip_code})
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <span className="mt-1 block font-poppins text-[10.5px] text-ocean-900/60">
                No approved and confirmed facilities yet — confirm one first under Facilities.
              </span>
            )}
          </label>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
              Date
              <input
                type="date"
                value={requestedDate}
                onChange={(e) => setRequestedDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
              />
            </label>
            <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
              Start time
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
              />
            </label>
            <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
              End time
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
              />
            </label>
          </div>

          <label className="block font-poppins text-[11px] font-semibold text-ocean-900">
            Notes <span className="font-normal text-ocean-900/50">(optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any context for this match..."
              className="mt-1.5 w-full rounded-lg border border-ocean-300 bg-white px-3 py-2.5 font-poppins text-[12px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
            />
          </label>

          {error && <p className="font-poppins text-[11.5px] font-medium text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitDisabled}
            className="rounded-lg bg-ocean-800 px-5 py-2.5 font-poppins text-[12.5px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Creating…' : 'Create Booking'}
          </button>
        </div>
      )}
    </section>
  )
}
