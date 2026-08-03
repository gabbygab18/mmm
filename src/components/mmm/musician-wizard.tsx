'use client'

import Link from 'next/link'
import { ChangeEvent, ReactNode, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PasswordField, PhoneField, PillGroup, SelectField, TextField } from '@/components/mmm/form-kit'
import { BackButton, NextButton, StepHeading, StepTracker } from '@/components/mmm/registration-ui'
import { HumanCheck, type HumanCheckValue } from '@/components/mmm/human-check'
import { friendlyAuthError } from '@/lib/mmm/auth-errors'
import { notifyApplicationReceivedAction } from '@/app/register/actions'
import {
  GENRES,
  INSTRUMENTS,
  PERFORMANCE_TYPES as PERFORMANCE_TYPE_OPTIONS,
  YEARS_EXPERIENCE,
} from '@/lib/mmm/options'
import { ACCEPT_ATTRIBUTE, uploadProfilePhoto, validatePhoto } from '@/lib/mmm/profile-photo'
import { PhotoEditor } from '@/components/mmm/photo-editor'

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

const STEP2_PERFORMANCE_TYPES = ['Solo', 'Duo', 'Small Group', 'Large Group'] as const

/**
 * Lists an admin curates under Categories. Passed in from the server so the
 * wizard stays a client component; the constants above are the fallback, so a
 * call site that does not pass them behaves exactly as before.
 */
export type WizardOptionLists = Record<string, string[]>

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

const normalizeUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

type HandleStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken'

export function MusicianWizard({
  mode,
  optionLists,
}: {
  mode: 'register' | 'onboarding'
  optionLists?: WizardOptionLists
}) {
  const instrumentOptions = optionLists?.instrument?.length ? optionLists.instrument : [...INSTRUMENTS]
  const genreOptions = optionLists?.genre?.length ? optionLists.genre : [...GENRES]
  const isOnboarding = mode === 'onboarding'
  const firstStep = isOnboarding ? 2 : 1

  const [step, setStep] = useState(firstStep)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(isOnboarding)

  // Onboarding-only fields — everything the old plain form collected that the
  // approved registration design does not ask a new visitor for.
  const [handle, setHandle] = useState('')
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle')
  const [compensation, setCompensation] = useState('free')
  const [hasOwnTransport, setHasOwnTransport] = useState(false)
  const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('')
  const [savedPhotoUrl, setSavedPhotoUrl] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)

  // Step 1 — Create Account
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTos, setAgreeTos] = useState(false)
  const [human, setHuman] = useState<HumanCheckValue>({ verified: false, token: null })

  // Step 2 — Profile
  // The chosen file is held here and uploaded once the account exists (Storage
  // writes need a session), then written to musicians.profile_image_url.
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Raw pick waiting in the crop/zoom editor.
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
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
    if (!isOnboarding && new URLSearchParams(window.location.search).get('welcome') === '1') setDone(true)
  }, [isOnboarding])

  // ---- Onboarding: prefill from the account and any saved profile ----
  useEffect(() => {
    if (!isOnboarding) return

    const load = async () => {
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in again to finish setting up your profile.')
        setInitializing(false)
        return
      }

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      const reg = (meta.registration ?? {}) as Record<string, unknown>
      const str = (v: unknown) => (typeof v === 'string' ? v : '')
      const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

      setEmail(user.email ?? '')
      setFirstName(str(meta.first_name))
      setLastName(str(meta.last_name))

      // Answers from a half-finished registration still live on the account.
      setBio(str(reg.bio))
      setPhone(str(reg.phone))
      setZip(str(reg.zip_code))
      setPerformanceTypes(list(reg.performance_types))
      setPrimaryInstrument(str(reg.primary_instrument))
      setOtherInstruments(str(reg.other_instruments))
      setYearsExperience(str(reg.years_of_experience))
      setGenres(list(reg.genres))
      setExperience(str(reg.musical_experience))
      if (str(reg.preferred_days)) setPreferredDays(str(reg.preferred_days).split(',').map((v) => v.trim()).filter(Boolean))
      if (str(reg.preferred_time)) setPreferredTimes(str(reg.preferred_time).split(',').map((v) => v.trim()).filter(Boolean))
      setFrequency(str(reg.availability_frequency))
      setMaxDistance(str(reg.max_travel_distance))
      setUnavailableDates(list(reg.unavailable_dates))
      setAvailabilityNotes(str(reg.availability_notes))
      setSavedPhotoUrl(str(reg.profile_image_url))

      const { data: musician } = await supabase
        .from('musicians')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (musician) {
        if (musician.first_name) setFirstName(musician.first_name)
        if (musician.last_name) setLastName(musician.last_name)
        setBio(musician.bio ?? '')
        setPhone(musician.phone ?? '')
        setZip(musician.zip_code ?? '')
        if (musician.band_size_preference) setPerformanceTypes([musician.band_size_preference])
        const instruments: string[] = musician.instruments ?? []
        if (instruments.length > 0) {
          setPrimaryInstrument(instruments[0])
          setOtherInstruments(instruments.slice(1).join(', '))
        }
        setGenres(musician.music_types ?? [])
        setPreferredDays(musician.general_available_days ?? [])
        if (musician.travel_radius_miles) setMaxDistance(`Within ${musician.travel_radius_miles} miles`)
        setCompensation(musician.compensation_preference ?? 'free')
        setHasOwnTransport(musician.has_own_transport ?? false)
        setYoutubeChannelUrl(musician.youtube_channel_url ?? '')
        if (musician.profile_image_url) setSavedPhotoUrl(musician.profile_image_url)
        // A `u_…` handle is the provisional one the database assigns at signup —
        // leave the box empty so they can pick a real one.
        if (musician.username && !/^u_[0-9a-f]{12}$/.test(musician.username)) setHandle(musician.username)
      }

      setInitializing(false)
    }

    load()
  }, [isOnboarding])

  // ---- Onboarding: is the chosen handle free? ----
  useEffect(() => {
    if (!isOnboarding) return
    const normalized = normalizeUsername(handle)

    if (!normalized) {
      setHandleStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setHandleStatus('invalid')
      return
    }

    let active = true
    setHandleStatus('checking')

    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error: rpcError } = await supabase.rpc('is_profile_username_available', {
        p_username: normalized,
        p_profile_type: 'musician',
      })
      if (!active) return
      if (rpcError) {
        setHandleStatus('idle')
        return
      }
      setHandleStatus(data ? 'available' : 'taken')
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [handle, isOnboarding])

  const toggleInList = (setter: (fn: (cur: string[]) => string[]) => void, value: string) =>
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))

  // Step 5 — Agreement
  const [agreeVolunteer, setAgreeVolunteer] = useState(false)

  const togglePerformanceType = (t: string) =>
    setPerformanceTypes((cur) => (cur.includes(t) ? cur.filter((v) => v !== t) : [...cur, t]))

  const goNext = () => {
    setError(null)
    if (step === 2 && isOnboarding) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.')
        return
      }
      if (!/^\d{5}$/.test(zip.trim())) {
        setError('Please enter a 5-digit ZIP code so nearby communities can find you.')
        return
      }
      if (handleStatus === 'invalid') {
        setError('The profile link must be 3-30 characters, using lowercase letters, numbers, or underscores.')
        return
      }
      if (handleStatus === 'taken') {
        setError('That profile link is already taken. Please choose another.')
        return
      }
    }
    if (step === 1 && !isOnboarding) {
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
    setStep((s) => Math.max(firstStep, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    // Let the same file be re-picked after a rejection.
    e.target.value = ''

    if (!file) return

    const problem = validatePhoto(file)
    if (problem) {
      setPhotoError(problem)
      return
    }

    // Crop and zoom first — the wizard keeps the finished square.
    setPhotoError(null)
    setPendingPhoto(file)
  }

  const acceptCroppedPhoto = async (cropped: File) => {
    setPendingPhoto(null)
    setPhotoFile(cropped)
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return URL.createObjectURL(cropped)
    })

    // Onboarding has a session, so the photo can go up straight away rather
    // than waiting for an account that already exists.
    if (!isOnboarding) return

    setPhotoBusy(true)
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setPhotoError('Your session has expired — please sign in again.')
      setPhotoBusy(false)
      return
    }
    const upload = await uploadProfilePhoto(supabase, user.id, cropped)
    if (upload.url) setSavedPhotoUrl(upload.url)
    else setPhotoError(upload.error ?? 'The photo could not be uploaded. Please try again.')
    setPhotoBusy(false)
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoError(null)
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
  }

  // Release the preview blob when the wizard unmounts.
  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  /** onboarding mode — the account exists, so write the profile row directly. */
  const saveProfile = async () => {
    setError(null)
    if (!agreeVolunteer) {
      setError('Please read and agree to the Volunteer Agreement to continue.')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.')
      setStep(2)
      return
    }
    if (!/^\d{5}$/.test(zip.trim())) {
      setError('Please enter a 5-digit ZIP code so nearby communities can find you.')
      setStep(2)
      return
    }
    if (handleStatus === 'taken' || handleStatus === 'invalid') {
      setError('Please choose a different profile link.')
      setStep(2)
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Your session has expired — please sign in again.')
      setLoading(false)
      return
    }

    const instruments = [primaryInstrument, ...otherInstruments.split(',').map((v) => v.trim())].filter(Boolean)
    const radius = Number(maxDistance.replace(/\D/g, '')) || 15

    await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        registration: {
          bio: bio.trim(),
          phone: phone.trim(),
          zip_code: zip.trim(),
          performance_types: performanceTypes,
          performance_type: performanceTypes[0] ?? '',
          primary_instrument: primaryInstrument,
          instruments,
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
          profile_image_url: savedPhotoUrl,
        },
      },
    })

    const normalizedHandle = normalizeUsername(handle)
    const row: Record<string, unknown> = {
      user_id: user.id,
      name: `${firstName.trim()} ${lastName.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bio: bio.trim() || null,
      zip_code: zip.trim(),
      phone: phone.trim() || null,
      instruments,
      music_types: genres,
      band_size_preference: performanceTypes[0] ?? null,
      compensation_preference: compensation,
      willing_to_travel: radius > 0,
      travel_radius_miles: radius,
      has_own_transport: hasOwnTransport,
      general_available_days: preferredDays,
      youtube_channel_url: youtubeChannelUrl.trim() || null,
      profile_complete: true,
    }
    // Leave both columns alone when empty, so the provisional handle and any
    // photo saved earlier are not wiped.
    if (normalizedHandle) row.username = normalizedHandle
    if (savedPhotoUrl.trim()) row.profile_image_url = savedPhotoUrl.trim()

    const { error: saveError } = await supabase.from('musicians').upsert(row, { onConflict: 'user_id' })

    if (saveError) {
      setError(saveError.message)
      setLoading(false)
      return
    }

    // Onboarding's account was created via the plain /signup form, which never
    // gets a chance to fire this — this profile-completion step is the first
    // point they're both authenticated and have a name to put in the email.
    if (isOnboarding) {
      notifyApplicationReceivedAction(user.id, `${firstName.trim()} ${lastName.trim()}`.trim(), 'musician').catch(() => {})
    }

    setLoading(false)
    setDone(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const completeRegistration = async () => {
    setError(null)
    if (!agreeVolunteer) {
      setError('Please read and agree to the Volunteer Agreement to continue.')
      return
    }
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const registration = {
      bio: bio.trim(),
      phone: phone.trim(),
      zip_code: zip.trim(),
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
    }

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
          registration,
        },
        // Where the confirmation link lands. /auth/confirm sets the session
        // server-side, so they arrive signed in and carry on into onboarding.
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Fonboarding%2Fmusician`,
      },
    })

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message))
      setLoading(false)
      return
    }

    // ---- Profile photo ----
    // Storage writes are owner-checked against auth.uid(), so this only works
    // once a session exists. When the project requires e-mail confirmation
    // signUp returns no session, and the photo has to wait for the profile page.
    let photoNotice: string | null = null
    if (photoFile) {
      if (data.session && data.user) {
        const upload = await uploadProfilePhoto(supabase, data.user.id, photoFile)
        if (upload.url) {
          // Carry the URL on the signup metadata as well. The musicians row may
          // not exist yet — its NOT NULL `username` is only chosen during
          // onboarding — so metadata is what reliably survives, and onboarding
          // reads it back. When the row *is* there, update it straight away.
          await supabase.auth.updateUser({
            data: { registration: { ...registration, profile_image_url: upload.url } },
          })

          const { data: updated, error: saveError } = await supabase
            .from('musicians')
            .update({ profile_image_url: upload.url })
            .eq('user_id', data.user.id)
            .select('user_id')

          if (saveError) {
            photoNotice = `Your account is ready, but the photo could not be attached to your profile (${saveError.message}). You can add it from your profile page.`
          } else if (!updated || updated.length === 0) {
            photoNotice = 'Your photo is saved and will appear on your profile as soon as you finish setting it up.'
          }
        } else {
          photoNotice = `Your account is ready, but the photo did not upload (${upload.error}). You can add it from your profile page.`
        }
      } else {
        photoNotice = 'Your photo still needs uploading — add it from your profile page after you confirm your e-mail and sign in.'
      }
    }

    const notices = [
      data.session ? null : 'Check your e-mail to confirm your account, then sign in.',
      photoNotice,
    ].filter(Boolean)
    if (notices.length > 0) setNotice(notices.join(' '))

    // Only reachable with a live session — without one, requireAuthenticatedUser
    // in the action would fail anyway, and they haven't confirmed yet.
    if (data.session && data.user) {
      notifyApplicationReceivedAction(data.user.id, `${firstName.trim()} ${lastName.trim()}`.trim(), 'musician').catch(() => {})
    }

    setLoading(false)
    // Account created → go to the last page (Welcome screen). The ?welcome=1
    // flag keeps them on it even after a refresh or middleware round-trip.
    setDone(true)
    window.history.replaceState(null, '', '/register/musician?welcome=1')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (initializing) {
    return (
      <main className="flex min-h-screen flex-col bg-ocean-900 font-sans">
        <MarketingHeader />
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="font-poppins text-[13px] text-white">Loading your profile…</p>
        </div>
        <MarketingFooter />
      </main>
    )
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
            {isOnboarding
              ? 'Your account is ready — pick up where you left off and finish your musician profile.'
              : 'Join our community of volunteer musicians and bring the joy of live music to memory care residents.'}
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
                <h2 className="mt-6 font-garamond text-[36px] font-bold text-ocean-900 sm:text-[50.8px]">
                  Application Received!
                </h2>
                <p className="mx-auto mt-3 max-w-[480px] font-poppins text-[13.2px] leading-relaxed text-ocean-900">
                  Thank you for registering as a volunteer musician with Margaret&apos;s Memorycare Music.
                  <br />
                  <br />
                  Your application is currently being reviewed. We&apos;ll notify you by email as soon as
                  it&apos;s approved so you can complete your volunteer onboarding and begin making a difference.
                </p>
                {notice && (
                  <p className="mt-3 rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[12px] font-medium text-ocean-800">{notice}</p>
                )}
                <div
                  className="mt-7 max-w-[440px] rounded-2xl px-6 py-5 text-left shadow"
                  style={{ background: 'linear-gradient(100deg, #d9e8f7 0%, #b3d0ee 100%)' }}
                >
                  <h3 className="font-garamond text-[20px] font-bold text-ocean-900">Next Steps</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-4 font-poppins text-[10.5px] font-bold leading-relaxed text-ocean-900">
                    <li>Application review</li>
                    <li>Approval notification by email</li>
                    <li>Complete the Education section</li>
                    <li>Start accepting performance requests</li>
                  </ul>
                </div>
                <Link
                  href="/"
                  className="mt-8 rounded-md bg-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700"
                >
                  Go to Homepage
                </Link>
              </div>
            ) : (
              <>
                {/* ---------- Step 1 — Create Account ---------- */}
                {step === 1 && !isOnboarding && (
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
                    <div className="flex items-start gap-4 sm:items-center sm:gap-6">
                      <div className="shrink-0">
                        <label className="flex h-[132px] w-[120px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-ocean-300 bg-white/70 px-2 text-center transition hover:border-ocean-500 focus-within:border-ocean-500 sm:h-[168px] sm:w-[164px]">
                          <input
                            type="file"
                            accept={ACCEPT_ATTRIBUTE}
                            className="sr-only"
                            onChange={handlePhoto}
                            aria-label="Upload a profile photo (JPG or PNG, up to 5 MB)"
                          />
                          {photoPreview || savedPhotoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={photoPreview ?? savedPhotoUrl}
                              alt="Your profile photo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/mmm/pages/upload-photo.png" alt="" className="h-11 w-11 object-contain sm:h-14 sm:w-14" />
                              <span className="font-poppins text-[10px] font-bold text-ocean-900 sm:text-[12px]">Upload Photo</span>
                              <span className="font-poppins text-[8px] leading-tight text-ocean-900/50 sm:text-[10px]">
                                JPG, PNG (max 5MB)
                              </span>
                            </>
                          )}
                        </label>
                        {/* Phones and tablets: straight to the camera. */}
                        <label className="mt-1.5 hidden w-[120px] cursor-pointer font-poppins text-[9px] font-bold text-ocean-700 underline [@media(pointer:coarse)]:block sm:w-[164px] sm:text-[10px]">
                          <input
                            type="file"
                            accept={ACCEPT_ATTRIBUTE}
                            capture="user"
                            className="sr-only"
                            onChange={handlePhoto}
                          />
                          Take a photo instead
                        </label>
                        {photoFile && (
                          <div className="mt-1.5 w-[120px] sm:w-[164px]">
                            <p className="truncate font-poppins text-[9px] text-ocean-900/70 sm:text-[10px]" title={photoFile.name}>
                              {photoFile.name}
                            </p>
                            <button
                              type="button"
                              onClick={clearPhoto}
                              className="mt-0.5 font-poppins text-[9px] font-bold text-ocean-700 underline transition hover:text-ocean-900 sm:text-[10px]"
                            >
                              Remove photo
                            </button>
                          </div>
                        )}
                        {photoBusy && (
                          <p className="mt-1.5 w-[120px] font-poppins text-[9px] text-ocean-900/60 sm:w-[164px] sm:text-[10px]">
                            Uploading…
                          </p>
                        )}
                        {photoError && (
                          <p className="mt-1.5 w-[120px] font-poppins text-[9px] leading-tight text-red-700 sm:w-[164px] sm:text-[10px]">
                            {photoError}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-poppins text-[11px] text-ocean-900 sm:text-[13px]">Step 2 of 5</p>
                        <h2 className="font-garamond text-[26px] font-bold leading-none text-ocean-900 sm:text-[44px] lg:text-[50.8px]">
                          Profile
                        </h2>
                        <p className="mt-1 font-poppins text-[11.5px] text-ocean-900 sm:text-[14px] lg:text-[16.1px]">
                          Tell us a little a bit about yourself.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-5 sm:mt-8">
                      {isOnboarding && (
                        <>
                          <p className="rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[11px] font-medium text-ocean-800">
                            Your account is already set up{email ? ` as ${email}` : ''} — step 1 is done.
                          </p>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <TextField label="First Name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
                            <TextField label="Last Name" value={lastName} onChange={setLastName} autoComplete="family-name" />
                          </div>
                          <div>
                            <TextField
                              label="Public Profile Link (Optional)"
                              value={handle}
                              onChange={(v) => setHandle(normalizeUsername(v))}
                              placeholder="maria_guitar"
                            />
                            <p
                              className={`mt-1 font-poppins text-[9.5px] ${
                                handleStatus === 'taken' || handleStatus === 'invalid' ? 'text-red-600' : 'text-ocean-900/60'
                              }`}
                            >
                              {handleStatus === 'checking'
                                ? 'Checking…'
                                : handleStatus === 'available'
                                  ? 'That link is available.'
                                  : handleStatus === 'taken'
                                    ? 'That link is already taken.'
                                    : handleStatus === 'invalid'
                                      ? 'Use 3-30 lowercase letters, numbers, or underscores.'
                                      : 'Leave blank and we will assign one you can change later.'}
                            </p>
                          </div>
                        </>
                      )}

                      <Field label="Short Bio">
                        <div className="relative">
                          <textarea
                            className={`${inputClass} min-h-[96px] resize-none pb-7`}
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
                        <PhoneField label="Phone Number" value={phone} onChange={setPhone} autoComplete="tel" />
                        <TextField
                          label="ZIP Code"
                          value={zip}
                          onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))}
                          inputMode="numeric"
                          maxLength={5}
                          autoComplete="postal-code"
                        />
                      </div>

                      {/* Four equal tiles across, on phones as well as desktop,
                          matching both mockups. */}
                      <fieldset>
                        <legend className={labelClass}>Performance Types</legend>
                        <div className="mt-1 grid grid-cols-4 gap-2 sm:gap-3">
                          {STEP2_PERFORMANCE_TYPES.map((t) => {
                            const checked = performanceTypes.includes(t)
                            return (
                              <label
                                key={t}
                                className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-1.5 py-2.5 text-center font-poppins text-[8.5px] font-bold leading-tight text-ocean-900 transition sm:gap-2 sm:px-3 sm:text-[10.7px] ${
                                  checked ? 'border-ocean-700 bg-ocean-100' : 'border-ocean-300 bg-white hover:border-ocean-500'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePerformanceType(t)}
                                  className="h-3 w-3 shrink-0 rounded-sm border-ocean-400 text-ocean-700 focus:ring-ocean-500 sm:h-3.5 sm:w-3.5"
                                />
                                {t}
                              </label>
                            )
                          })}
                        </div>
                      </fieldset>
                    </div>

                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

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
                          options={instrumentOptions}
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
                          options={genreOptions}
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
                        {isOnboarding && (
                          <>
                            <SelectField
                              label="Compensation Preference"
                              value={compensation}
                              onChange={setCompensation}
                              options={['free', 'tips welcome', 'paid']}
                              placeholder="Select preference"
                            />
                            <TextField
                              label="YouTube Channel (Optional)"
                              value={youtubeChannelUrl}
                              onChange={setYoutubeChannelUrl}
                              placeholder="https://youtube.com/@yourchannel"
                              inputMode="url"
                            />
                          </>
                        )}
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

                        {isOnboarding && (
                          <label className="mt-5 flex items-start gap-2 font-poppins text-[10.7px] text-ocean-900">
                            <input
                              type="checkbox"
                              checked={hasOwnTransport}
                              onChange={(e) => setHasOwnTransport(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                            />
                            <span>I have my own transport to get to performances.</span>
                          </label>
                        )}
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
                      <NextButton
                        onClick={isOnboarding ? saveProfile : completeRegistration}
                        label={
                          loading
                            ? isOnboarding
                              ? 'Saving…'
                              : 'Submitting…'
                            : isOnboarding
                              ? 'Complete Profile'
                              : 'Complete Registration'
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <MarketingFooter />

      {pendingPhoto && (
        <PhotoEditor file={pendingPhoto} onCancel={() => setPendingPhoto(null)} onConfirm={acceptCroppedPhoto} />
      )}
    </main>
  )
}
