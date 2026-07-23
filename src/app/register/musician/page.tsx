'use client'

import Link from 'next/link'
import { ChangeEvent, ReactNode, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PasswordField, PillGroup, SelectField, TextField } from '@/components/mmm/form-kit'
import { BackButton, NextButton, StepHeading, StepTracker } from '@/components/mmm/registration-ui'
import { HumanCheck, type HumanCheckValue } from '@/components/mmm/human-check'
import {
  GENRES,
  INSTRUMENTS,
  LANGUAGES,
  PERFORMANCE_TYPES as PERFORMANCE_TYPE_OPTIONS,
  YEARS_EXPERIENCE,
} from '@/lib/mmm/options'

/**
 * Musician Registration — 5-step wizard (approved design):
 * 1 Create Account · 2 Create Profile · 3 Musical Background · 4 Availability · 5 Agreement → Welcome screen.
 *
 * On completion the account is created via Supabase auth (role: musician) and the
 * remaining answers are stored in the user's metadata so the dashboard/onboarding
 * flow can pick them up.
 */

const STEP_LABELS = [
  ['Create', 'Account'],
  ['Create', 'Profile'],
  ['Musical', 'Background'],
  ['Availability'],
  ['Agreement'],
]

const PERFORMANCE_TYPES = PERFORMANCE_TYPE_OPTIONS

// ---------- Step 4 (Availability) — updated layout ----------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const TIMES = ['Morning', 'Afternoon', 'Evening'] as const
const FREQUENCIES = ['Weekly', 'Every 2 weeks', 'Monthly', 'Flexible'] as const
const DISTANCES = ['Within 5 miles', 'Within 10 miles', 'Within 15 miles', 'Within 25 miles', 'Within 50 miles', 'Any distance'] as const
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const

function CheckPill({ label, checked, onChange, className = '' }: { label: string; checked: boolean; onChange: () => void; className?: string }) {
  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 font-poppins text-[10.7px] font-bold text-ocean-900 transition ${
        checked ? 'border-ocean-800 bg-ocean-100' : 'border-ocean-300 bg-white hover:border-ocean-500'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
      />
      {label}
    </label>
  )
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Month calendar for picking unavailable dates (updated Step 4 design). */
function UnavailableCalendar({ selected, onToggle }: { selected: string[]; onToggle: (iso: string) => void }) {
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const daysInPrev = new Date(view.y, view.m, 0).getDate()
  const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate())

  const cells: { day: number; iso: string; inMonth: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    cells.push({ day: d, iso: isoDate(view.m === 0 ? view.y - 1 : view.y, (view.m + 11) % 12, d), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, iso: isoDate(view.y, view.m, d), inMonth: true })
  let trailing = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing, iso: isoDate(view.m === 11 ? view.y + 1 : view.y, (view.m + 1) % 12, trailing), inMonth: false })
    trailing++
  }

  const changeMonth = (delta: number) =>
    setView(({ y, m }) => {
      const next = m + delta
      if (next < 0) return { y: y - 1, m: 11 }
      if (next > 11) return { y: y + 1, m: 0 }
      return { y, m: next }
    })

  return (
    <div className="rounded-xl border border-ocean-300 bg-white px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ocean-900 transition hover:bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <p className="font-poppins text-[12px] font-bold text-ocean-900">
          {MONTH_NAMES[view.m]} {view.y}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ocean-900 transition hover:bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="py-1 font-poppins text-[10.7px] font-bold text-ocean-900">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          const isSelected = selected.includes(cell.iso)
          const isPast = cell.iso < todayIso
          const disabled = !cell.inMonth || isPast
          return (
            <button
              key={`${cell.iso}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(cell.iso)}
              aria-pressed={isSelected}
              aria-label={`${cell.iso}${isSelected ? ' — unavailable' : ''}`}
              className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full font-poppins text-[10.7px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                isSelected
                  ? 'bg-ocean-800 font-bold text-white'
                  : disabled
                    ? 'cursor-default text-ocean-300'
                    : 'text-ocean-700 hover:bg-ocean-100'
              }`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-ocean-300 bg-white px-4 py-2.5 font-poppins text-[12px] text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400'
const labelClass = 'mb-1.5 block font-poppins text-[10.7px] font-bold text-ocean-900'

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  )
}

export default function MusicianRegistrationPage() {
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1 — Create Account
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTos, setAgreeTos] = useState(false)
  const [human, setHuman] = useState<HumanCheckValue>({ verified: false, token: null })

  // Step 2 — Profile
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [performanceTypes, setPerformanceTypes] = useState<string[]>([])

  // Step 3 — Musical Background
  const [primaryInstrument, setPrimaryInstrument] = useState('')
  const [otherInstruments, setOtherInstruments] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [genres, setGenres] = useState<string[]>([])
  const [experience, setExperience] = useState('')

  // Step 4 — Availability (updated layout)
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [preferredTimes, setPreferredTimes] = useState<string[]>([])
  const [frequency, setFrequency] = useState('')
  const [maxDistance, setMaxDistance] = useState('')
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [availabilityNotes, setAvailabilityNotes] = useState('')

  // Arriving from /signup after the account was created → land on the last page.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('welcome') === '1') setDone(true)
  }, [])

  const toggleInList = (setter: (fn: (cur: string[]) => string[]) => void, value: string) =>
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))

  // Step 5 — Agreement
  const [agreeVolunteer, setAgreeVolunteer] = useState(false)

  const togglePerformanceType = (t: string) =>
    setPerformanceTypes((cur) => (cur.includes(t) ? cur.filter((v) => v !== t) : [...cur, t]))

  const goNext = () => {
    setError(null)
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.')
        return
      }
      if (!email.trim() || !password) {
        setError('Please fill in your e-mail address and password.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (!human.verified) {
        setError('Please complete the human verification check.')
        return
      }
      if (!agreeTos) {
        setError('Please agree to the Terms of Service and Privacy Policy.')
        return
      }
    }
    setStep((s) => Math.min(5, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPhotoName(file ? file.name : null)
  }

  const completeRegistration = async () => {
    setError(null)
    if (!agreeVolunteer) {
      setError('Please read and agree to the Volunteer Agreement to continue.')
      return
    }
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'musician',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          human_verification_token: human.token,
          registration: {
            bio: bio.trim(),
            phone: phone.trim(),
            zip_code: zip.trim(),
            languages,
            performance_types: performanceTypes,
            performance_type: performanceTypes[0] ?? '',
            primary_instrument: primaryInstrument,
            instruments: [primaryInstrument, ...otherInstruments.split(',').map((v) => v.trim())].filter(Boolean),
            other_instruments: otherInstruments.trim(),
            years_of_experience: yearsExperience,
            genres,
            musical_experience: experience.trim(),
            preferred_days: preferredDays.join(', '),
            preferred_time: preferredTimes.join(', '),
            availability_frequency: frequency,
            max_travel_distance: maxDistance,
            unavailable_dates: unavailableDates,
            availability_notes: availabilityNotes.trim(),
            agreed_to_volunteer_agreement: true,
          },
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setNotice('Check your e-mail to confirm your account, then sign in.')
    }
    setLoading(false)
    // Account created → go to the last page (Welcome screen). The ?welcome=1
    // flag keeps them on it even after a refresh or middleware round-trip.
    setDone(true)
    window.history.replaceState(null, '', '/register/musician?welcome=1')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="flex min-h-screen flex-col bg-ocean-900 font-sans">
      <MarketingHeader />

      <section className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: "url('/mmm/gs-bg.png')" }} aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(127,168,216,0.10) 0%, rgba(72,130,191,0.35) 60%, rgba(217,232,247,0.65) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[900px] px-4 pb-20 pt-12 sm:px-8 sm:pt-14">
          <h1 className="text-center font-garamond text-[36px] font-semibold leading-tight text-white drop-shadow-md sm:text-[56px] lg:text-[65.9px]">
            Musician Registration
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-center font-poppins text-[14px] leading-relaxed text-white drop-shadow sm:text-[16.1px]">
            Join our community of volunteer musicians and bring the joy of live music to memory care residents.
          </p>

          {!done && <StepTracker steps={STEP_LABELS} current={step} />}

          {/* ============ Card ============ */}
          <div className="mt-8 rounded-3xl border-2 border-ocean-900 bg-[#faf4e7] px-4 py-8 shadow-2xl sm:px-8 sm:py-10 md:px-12">
            {done ? (
              /* ---------- Success screen ---------- */
              <div className="flex flex-col items-center py-6 text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-ocean-900">
                  <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
                    <g stroke="#fff" strokeWidth={3} strokeLinecap="round">
                      <line x1="32" y1="6" x2="32" y2="14" />
                      <line x1="14" y1="14" x2="20" y2="20" />
                      <line x1="50" y1="14" x2="44" y2="20" />
                      <line x1="8" y1="32" x2="16" y2="32" />
                      <line x1="56" y1="32" x2="48" y2="32" />
                    </g>
                    <path
                      d="M32 52s-13-8.35-13-17a7.5 7.5 0 0 1 13-5.13A7.5 7.5 0 0 1 45 35c0 8.65-13 17-13 17z"
                      fill="#7fa8d8"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h2 className="mt-6 font-garamond text-[36px] font-bold text-ocean-900 sm:text-[48px]">Welcome to MMM!</h2>
                <p className="mx-auto mt-3 max-w-[480px] font-poppins text-[14px] leading-relaxed text-ocean-900 sm:text-[16.1px]">
                  Thank you for registering as a volunteer musician. You&apos;re now part of a community that brings joy,
                  connection, and meaningful moments to memory care residents.
                </p>
                {notice && (
                  <p className="mt-3 rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[12px] font-medium text-ocean-800">{notice}</p>
                )}
                <div
                  className="mt-7 flex max-w-[440px] items-start gap-4 rounded-xl px-6 py-5 text-left shadow"
                  style={{ background: 'linear-gradient(100deg, #d9e8f7 0%, #b3d0ee 100%)' }}
                >
                  <svg className="mt-0.5 h-9 w-9 shrink-0 text-ocean-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25c-1.6-1.3-3.7-1.75-6-1.75v12c2.3 0 4.4.45 6 1.75 1.6-1.3 3.7-1.75 6-1.75v-12c-2.3 0-4.4.45-6 1.75zm0 0v12" />
                    <path strokeLinecap="round" d="M3 20.5h18" />
                  </svg>
                  <div>
                    <h3 className="font-garamond text-[20px] font-bold text-ocean-900">What&apos;s Next?</h3>
                    <p className="mt-1 font-poppins text-[11.5px] leading-relaxed text-ocean-900">
                      You can now complete the Education section to learn more about MMM (Margaret&apos;s Memorycare Music)
                      and get started.
                    </p>
                  </div>
                </div>
                <Link
                  href="/education"
                  className="mt-8 rounded-md bg-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700"
                >
                  Continue to Education
                </Link>
              </div>
            ) : (
              <>
                {/* ---------- Step 1 — Create Account ---------- */}
                {step === 1 && (
                  <div>
                    <StepHeading
                      step={1}
                      title="Create Account"
                      subtitle="Let’s get started by creating your account."
                      icon={
                        <svg className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" />
                        </svg>
                      }
                    />
                    <div className="mx-auto mt-8 max-w-[520px] space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField label="First Name" value={firstName} onChange={setFirstName} placeholder="Enter your first name" autoComplete="given-name" />
                        <TextField label="Last Name" value={lastName} onChange={setLastName} placeholder="Enter your last name" autoComplete="family-name" />
                      </div>
                      <p className="font-poppins text-[10px] text-ocean-900/60">
                        Facilities see your first name and last initial — for example, Maria S.
                      </p>
                      <TextField label="E-mail Address" type="email" value={email} onChange={setEmail} placeholder="Enter your e-mail address" autoComplete="email" inputMode="email" />
                      <PasswordField value={password} onChange={setPassword} hint="At least 8 characters." />
                      <HumanCheck onChange={setHuman} />
                      <label className="flex items-start justify-center gap-2 pt-1 font-poppins text-[10.7px] text-ocean-900">
                        <input
                          type="checkbox"
                          checked={agreeTos}
                          onChange={(e) => setAgreeTos(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                        />
                        <span>
                          I agree to the{' '}
                          <Link href="/terms" className="font-bold hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="font-bold hover:underline">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                    </div>
                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <Link
                        href="/get-started"
                        className="rounded-full border-[1.5px] border-ocean-800 px-8 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
                      >
                        Cancel
                      </Link>
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 2 — Profile ---------- */}
                {step === 2 && (
                  <div>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      <label className="flex h-40 w-40 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-ocean-300 bg-white text-center transition hover:border-ocean-500">
                        <input type="file" accept="image/jpeg,image/png" className="sr-only" onChange={handlePhoto} />
                        <svg className="h-9 w-9 text-ocean-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M9 3l-1.8 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5A2.5 2.5 0 1 0 12 10a2.5 2.5 0 0 0 0 5.5z" />
                        </svg>
                        <span className="font-poppins text-[11px] font-bold text-ocean-900">Upload Photo</span>
                        <span className="px-2 font-poppins text-[9.5px] text-ocean-900/50">
                          {photoName ?? 'JPG, PNG (max 5MB)'}
                        </span>
                      </label>
                      <div>
                        <p className="font-poppins text-[13px] text-ocean-900">Step 2 of 5</p>
                        <h2 className="font-garamond text-[34px] font-bold leading-none text-ocean-900 sm:text-[50.8px]">Profile</h2>
                        <p className="mt-1 font-poppins text-[13px] text-ocean-900 sm:text-[16.1px]">Tell us a little a bit about yourself.</p>
                      </div>
                    </div>

                    <div className="mt-8 space-y-5">
                      <Field label="Short Bio">
                        <div className="relative">
                          <textarea
                            className={`${inputClass} min-h-[88px] resize-none pb-6`}
                            maxLength={250}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself and why you want to volunteer with MMM (Margaret Memorycare Music)."
                          />
                          <span className="pointer-events-none absolute bottom-2.5 right-3 font-poppins text-[10px] text-ocean-900/60">
                            {bio.length}/250
                          </span>
                        </div>
                      </Field>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Phone Number">
                          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                        </Field>
                        <Field label="ZIP Code">
                          <input className={inputClass} value={zip} onChange={(e) => setZip(e.target.value)} inputMode="numeric" autoComplete="postal-code" />
                        </Field>
                        <PillGroup
                          label="Languages You Speak"
                          options={LANGUAGES}
                          selected={languages}
                          onToggle={(v) => toggleInList(setLanguages, v)}
                        />
                        <Field label="Performance Types">
                          <div className="flex flex-wrap gap-2.5">
                            {PERFORMANCE_TYPES.map((t) => {
                              const checked = performanceTypes.includes(t)
                              return (
                                <label
                                  key={t}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 font-poppins text-[10.7px] font-bold transition ${
                                    checked ? 'border-ocean-700 bg-ocean-100 text-ocean-900' : 'border-ocean-300 bg-white text-ocean-900'
                                  }`}
                                >
                                  <input type="checkbox" checked={checked} onChange={() => togglePerformanceType(t)} className="h-3.5 w-3.5 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500" />
                                  {t}
                                </label>
                              )
                            })}
                          </div>
                        </Field>
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 3 — Musical Background ---------- */}
                {step === 3 && (
                  <div>
                    <StepHeading
                      step={3}
                      title="Musical Background"
                      subtitle="Tell us about your music and experience."
                      icon={
                        <svg className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M9 19V6l12-3v13a3 3 0 1 1-2-2.83V7.4L11 9.9v11.1a3 3 0 1 1-2-2.83z" />
                        </svg>
                      }
                    />
                    <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-5">
                        <SelectField
                          label="Primary Instrument"
                          value={primaryInstrument}
                          onChange={setPrimaryInstrument}
                          options={INSTRUMENTS}
                          placeholder="Select your primary instrument"
                        />
                        <Field label="Other Instruments (Optional)">
                          <input className={inputClass} value={otherInstruments} onChange={(e) => setOtherInstruments(e.target.value)} placeholder="e.g. Ukulele, Harmonica" />
                        </Field>
                        <SelectField
                          label="Years of Experience"
                          value={yearsExperience}
                          onChange={setYearsExperience}
                          options={YEARS_EXPERIENCE}
                          placeholder="Select years of experience"
                        />
                      </div>
                      <div className="space-y-5">
                        <PillGroup
                          label="Genres You Play"
                          options={GENRES}
                          selected={genres}
                          onToggle={(v) => toggleInList(setGenres, v)}
                        />
                        <Field label="Tell us about your musical experience">
                          <div className="relative">
                            <textarea
                              className={`${inputClass} min-h-[136px] resize-none pb-6`}
                              maxLength={500}
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              placeholder="Share your musical journey, training, performances, and anything you’d like us to know."
                            />
                            <span className="pointer-events-none absolute bottom-2.5 right-3 font-poppins text-[10px] text-ocean-900/60">
                              {experience.length}/500
                            </span>
                          </div>
                        </Field>
                      </div>
                    </div>
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 4 — Availability (updated layout) ---------- */}
                {step === 4 && (
                  <div>
                    <StepHeading
                      step={4}
                      title="Availability"
                      subtitle="When are you available to share your music?"
                      icon={
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src="/mmm/availability-icon.png" alt="" className="h-full w-full rounded-full object-cover" />
                      }
                    />

                    <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-2">
                      {/* -------- Left column — recurring availability -------- */}
                      <div>
                        <h3 className="font-poppins text-[12px] font-bold text-ocean-900">Recurring Availability</h3>

                        <div className="mt-4">
                          <span className={labelClass}>Preferred Days</span>
                          <div className="grid grid-cols-3 gap-2.5 min-[400px]:grid-cols-4">
                            {DAYS.map((d) => (
                              <CheckPill
                                key={d}
                                label={d}
                                checked={preferredDays.includes(d)}
                                onChange={() => toggleInList(setPreferredDays, d)}
                                className="justify-start"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="mt-5">
                          <span className={labelClass}>Preferred Time</span>
                          <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-3">
                            {TIMES.map((t) => (
                              <CheckPill
                                key={t}
                                label={t}
                                checked={preferredTimes.includes(t)}
                                onChange={() => toggleInList(setPreferredTimes, t)}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="mt-5">
                          <span className={labelClass}>How often would you like to volunteer?</span>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {FREQUENCIES.map((f) => (
                              <label key={f} className="flex cursor-pointer select-none items-center gap-2 font-poppins text-[10.7px] text-ocean-900">
                                <input
                                  type="checkbox"
                                  checked={frequency === f}
                                  onChange={() => setFrequency((cur) => (cur === f ? '' : f))}
                                  className="h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                                />
                                {f}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5">
                          <span className={labelClass}>Maximum Travel Distance</span>
                          <select
                            className={`${inputClass} ${maxDistance ? '' : 'text-ocean-900/40'}`}
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                          >
                            <option value="">Select distance</option>
                            {DISTANCES.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* -------- Right column — unavailable dates + notes -------- */}
                      <div>
                        <h3 className="font-poppins text-[12px] font-bold text-ocean-900">Unavailable Dates</h3>
                        <p className="mt-0.5 font-poppins text-[10.7px] text-ocean-900">Select any dates you are unavailable</p>
                        <div className="mt-3">
                          <UnavailableCalendar
                            selected={unavailableDates}
                            onToggle={(iso) => toggleInList(setUnavailableDates, iso)}
                          />
                        </div>

                        <div className="mt-5">
                          <span className={labelClass}>Additional Notes (Optional)</span>
                          <p className="-mt-0.5 mb-1.5 font-poppins text-[10.7px] text-ocean-900">
                            Share anything else we should know about your availability?
                          </p>
                          <div className="relative">
                            <textarea
                              className={`${inputClass} min-h-[96px] resize-none pb-6`}
                              maxLength={250}
                              value={availabilityNotes}
                              onChange={(e) => setAvailabilityNotes(e.target.value)}
                              placeholder="e.g. Available after work, prefer piano performances, only available weekends, etc."
                            />
                            <span className="pointer-events-none absolute bottom-2.5 right-3 font-poppins text-[10px] text-ocean-900/60">
                              {availabilityNotes.length}/250
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 5 — Agreement ---------- */}
                {step === 5 && (
                  <div>
                    <StepHeading
                      step={5}
                      title="Agreement"
                      subtitle="Please review and agree to continue."
                      icon={
                        <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l-4 3 4 3 3-2m4-4l4-3-4-3-3 2m-4 4l4 4m0-8l4 4" />
                          <circle cx="17" cy="6" r="3.4" fill="currentColor" stroke="none" />
                          <path d="M15.7 6l1 1 1.6-1.8" stroke="#0a2f5a" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      }
                    />
                    <div className="mt-8">
                      <h3 className="font-poppins text-[14px] font-bold text-ocean-900">Volunteer Agreement</h3>
                      <p className="mt-2 font-poppins text-[13px] text-ocean-900">
                        As a volunteer musician with Margaret&apos;s Memorycare Music, I agree to:
                      </p>
                      <ul className="mt-3 list-disc space-y-1.5 pl-6 font-poppins text-[13px] text-ocean-900">
                        <li>Provide live music performances in a respectful and professional manner.</li>
                        <li>Follow all guidelines and policies of Margaret&apos;s Memorycare Music.</li>
                        <li>Respect the privacy and dignity of all residents and staff.</li>
                        <li>Commit to creating a positive and uplifting experience through music.</li>
                      </ul>

                      <div
                        className="mx-auto mt-6 flex max-w-[560px] items-start gap-4 rounded-xl px-6 py-4"
                        style={{ background: 'linear-gradient(100deg, #d9e8f7 0%, #b3d0ee 100%)' }}
                      >
                        <svg className="mt-0.5 h-9 w-9 shrink-0 text-ocean-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 3v6c0 5-3.5 9.2-8 11-4.5-1.8-8-6-8-11V5l8-3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4.5" />
                        </svg>
                        <div>
                          <h4 className="font-poppins text-[12px] font-bold text-ocean-900">Future Background Check</h4>
                          <p className="mt-0.5 font-poppins text-[11.5px] leading-relaxed text-ocean-900">
                            As part of our commitment to safety, a background check may be required for all volunteer musicians.
                          </p>
                        </div>
                      </div>

                      <label className="mx-auto mt-4 flex max-w-[560px] items-start justify-center gap-2 font-poppins text-[10.7px] text-ocean-900">
                        <input
                          type="checkbox"
                          checked={agreeVolunteer}
                          onChange={(e) => setAgreeVolunteer(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                        />
                        <span>
                          I have read and agree to the <span className="font-bold">Volunteer Agreement</span> and understand
                          that a background check may be required.
                        </span>
                      </label>
                    </div>
                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={completeRegistration} label={loading ? 'Submitting…' : 'Complete Registration'} disabled={loading} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
