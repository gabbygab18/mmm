'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { BackButton, NextButton, StepHeading, StepIcon, StepTracker } from '@/components/mmm/registration-ui'
import { Field, PasswordField, PhoneField, PillGroup, SelectField, TextField, inputClass } from '@/components/mmm/form-kit'
import { HumanCheck, type HumanCheckValue } from '@/components/mmm/human-check'
import { friendlyAuthError } from '@/lib/mmm/auth-errors'
import { notifyApplicationReceivedAction } from '@/app/register/actions'
import { ProfilePhotoPicker } from '@/components/mmm/profile-photo-picker'
import { uploadProfilePhoto } from '@/lib/mmm/profile-photo'
import {
  CONTACT_METHODS,
  DAYS_OF_WEEK,
  DIRECTOR_JOB_TITLES,
  PERFORMANCE_LENGTH,
  PERFORMANCE_LOCATIONS,
  TIME_OF_DAY,
  US_STATES,
  VISIT_FREQUENCY,
} from '@/lib/mmm/options'

/**
 * The facility flow, in two modes so both routes stay one implementation:
 *
 *  - `register`   (/register/facility) — the approved 5-step design for a
 *    visitor with no account. Step 5 creates the account; the signup trigger
 *    fills in centers / center_locations from the metadata.
 *  - `onboarding` (/onboarding/center) — someone who already made an account
 *    through Get Started / Sign In. Step 1 is already behind them, so the
 *    tracker shows it ticked and the wizard opens on step 2, prefilled from
 *    whatever their profile already holds. Step 5 saves straight to the tables.
 *
 * Onboarding also carries the fields the old plain form collected and the
 * approved registration design does not ask for: public profile handle,
 * resident count, transport, and the community photo.
 */

type Mode = 'register' | 'onboarding'

const STEP_LABELS = [
  ['Create', 'Account'],
  ['Facility', 'Information'],
  ['Activities', 'Director'],
  ['Scheduling', 'Preferences'],
  ['Complete'],
]

const normalizeUsername = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30)

export function FacilityWizard({
  mode,
  optionLists,
}: {
  mode: Mode
  /** Lists curated by an admin under Categories; the constants are the fallback. */
  optionLists?: Record<string, string[]>
}) {
  const jobTitleOptions = optionLists?.director_job_title?.length
    ? optionLists.director_job_title
    : [...DIRECTOR_JOB_TITLES]
  const performanceLocationOptions = optionLists?.performance_location?.length
    ? optionLists.performance_location
    : [...PERFORMANCE_LOCATIONS]
  const isOnboarding = mode === 'onboarding'
  const firstStep = isOnboarding ? 2 : 1

  const [step, setStep] = useState(firstStep)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  /** True only when signUp left no session, i.e. a confirmation e-mail is pending. */
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(isOnboarding)
  /** True when they arrived here with a profile already saved — editing, not
      applying for the first time, so the done screen must not re-claim
      "awaiting approval" on an account that's already been approved. */
  const [wasAlreadyComplete, setWasAlreadyComplete] = useState(false)

  // Step 1 — Create Account (register mode only)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTos, setAgreeTos] = useState(false)
  const [human, setHuman] = useState<HumanCheckValue>({ verified: false, token: null })

  // Step 2 — Facility Information
  const [facilityName, setFacilityName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Florida')
  const [zip, setZip] = useState('')
  const [facilityPhone, setFacilityPhone] = useState('')
  const [website, setWebsite] = useState('')

  // Step 2 extras — onboarding only
  const [handle, setHandle] = useState('')
  const [handleStatus, setHandleStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle')
  const [residentCount, setResidentCount] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [locationHandle, setLocationHandle] = useState('')
  const [locationHandleStatus, setLocationHandleStatus] = useState<'idle' | 'invalid' | 'checking' | 'available' | 'taken'>('idle')
  const [locationPhotoUrl, setLocationPhotoUrl] = useState('')
  const [locationPhotoBusy, setLocationPhotoBusy] = useState(false)
  const [locationPhotoError, setLocationPhotoError] = useState<string | null>(null)

  // Step 3 — Activities Director
  const [directorFirstName, setDirectorFirstName] = useState('')
  const [directorLastName, setDirectorLastName] = useState('')
  const [directorEmail, setDirectorEmail] = useState('')
  const [directorPhone, setDirectorPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [contactMethod, setContactMethod] = useState('')

  // Step 4 — Scheduling Preferences
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [frequency, setFrequency] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [performanceLocation, setPerformanceLocation] = useState('')
  const [preferredLength, setPreferredLength] = useState('')
  const [notes, setNotes] = useState('')

  // Step 5 — Complete
  const [confirmAccurate, setConfirmAccurate] = useState(false)

  // Existing rows, so onboarding edits rather than duplicates.
  const [locationId, setLocationId] = useState<string | null>(null)

  // Coming back from the confirmation e-mail lands straight on the thank-you card.
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
        setError('Please sign in again to finish setting up your community.')
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

      // Anything typed into a half-finished registration is still on the account.
      setFacilityName(str(reg.facility_name))
      setAddress(str(reg.address))
      setCity(str(reg.city))
      if (str(reg.state)) setState(str(reg.state))
      setZip(str(reg.zip_code))
      setFacilityPhone(str(reg.phone))
      setWebsite(str(reg.website))
      setDirectorFirstName(str(reg.director_first_name))
      setDirectorLastName(str(reg.director_last_name))
      setDirectorEmail(str(reg.director_email))
      setDirectorPhone(str(reg.director_phone))
      setJobTitle(str(reg.director_job_title))
      setContactMethod(str(reg.preferred_contact_method))
      setPreferredDays(list(reg.preferred_days))
      setFrequency(str(reg.visit_frequency))
      setPreferredTime(str(reg.preferred_time))
      setPerformanceLocation(str(reg.performance_location))
      setPreferredLength(str(reg.preferred_length))
      setNotes(str(reg.scheduling_notes))

      const { data: center } = await supabase
        .from('centers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (center) {
        setWasAlreadyComplete(Boolean(center.profile_complete))
        setFacilityName(center.name ?? '')
        setFacilityPhone(center.phone ?? '')
        setWebsite(center.website ?? '')
        setDirectorFirstName(center.director_first_name ?? '')
        setDirectorLastName(center.director_last_name ?? '')
        setDirectorEmail(center.director_email ?? '')
        setDirectorPhone(center.director_phone ?? '')
        setJobTitle(center.director_job_title ?? '')
        setContactMethod(center.preferred_contact_method ?? '')
        setPreferredDays(center.preferred_days ?? [])
        setFrequency(center.visit_frequency ?? '')
        setPreferredTime(center.preferred_time ?? '')
        setPerformanceLocation(center.performance_location ?? '')
        setPreferredLength(center.preferred_length ?? '')
        setNotes(center.scheduling_notes ?? '')
        setPhotoUrl(center.profile_image_url ?? '')
        // A `u_…` handle is the provisional one the database assigns at signup —
        // leave the box empty so they can pick a real one.
        if (center.username && !/^u_[0-9a-f]{12}$/.test(center.username)) setHandle(center.username)

        const { data: location } = await supabase
          .from('center_locations')
          .select('*')
          .eq('center_id', center.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (location) {
          setLocationId(location.id)
          setAddress(location.address ?? '')
          setCity(location.city ?? '')
          if (location.state) setState(location.state)
          setZip(location.zip_code ?? '')
          setResidentCount(location.resident_count != null ? String(location.resident_count) : '')
          setLocationHandle(location.username ?? '')
          setLocationPhotoUrl(location.location_image_url ?? '')
          if (!center.phone && location.phone) setFacilityPhone(location.phone)
        }
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
        p_profile_type: 'center',
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

  // ---- Onboarding: is the location's own link free? ----
  useEffect(() => {
    if (!isOnboarding) return
    const normalized = normalizeUsername(locationHandle)

    if (!normalized) {
      setLocationHandleStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
      setLocationHandleStatus('invalid')
      return
    }

    let active = true
    setLocationHandleStatus('checking')

    const timer = setTimeout(async () => {
      const supabase = createSupabaseBrowserClient()
      const { data, error: rpcError } = await supabase.rpc('is_location_username_available', {
        p_username: normalized,
        p_exclude_location_id: locationId,
      })
      if (!active) return
      if (rpcError) {
        setLocationHandleStatus('idle')
        return
      }
      setLocationHandleStatus(data ? 'available' : 'taken')
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [locationHandle, locationId, isOnboarding])

  const toggleDay = (day: string) =>
    setPreferredDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]))

  const handleCenterPhoto = async (file: File) => {
    setPhotoError(null)
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

    const upload = await uploadProfilePhoto(supabase, user.id, file)
    if (upload.url) setPhotoUrl(upload.url)
    else setPhotoError(upload.error ?? 'The photo could not be uploaded. Please try again.')
    setPhotoBusy(false)
  }

  const handleLocationPhoto = async (file: File) => {
    setLocationPhotoError(null)
    setLocationPhotoBusy(true)

    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLocationPhotoError('Your session has expired — please sign in again.')
      setLocationPhotoBusy(false)
      return
    }

    const upload = await uploadProfilePhoto(supabase, user.id, file)
    if (upload.url) setLocationPhotoUrl(upload.url)
    else setLocationPhotoError(upload.error ?? 'The photo could not be uploaded. Please try again.')
    setLocationPhotoBusy(false)
  }

  const validateStep = (n: number): string | null => {
    if (n === 1 && !isOnboarding) {
      if (!firstName.trim() || !lastName.trim()) return 'Please enter your first and last name.'
      if (!email.trim()) return 'Please enter an e-mail address.'
      if (!password) return 'Please choose a password.'
      if (password.length < 8) return 'Password must be at least 8 characters.'
      if (!agreeTos) return 'Please agree to the Terms of Service and Privacy Policy.'
      if (!human.verified) return 'Please complete the human verification check.'
    }
    if (n === 2) {
      if (!facilityName.trim()) return 'Please enter your facility name.'
      if (!address.trim() || !city.trim() || !state) return 'Please enter the full facility address.'
      if (!/^\d{5}$/.test(zip.trim())) return 'Please enter a 5-digit ZIP code.'
      if (!facilityPhone.trim()) return 'Please enter a phone number for the facility.'
      if (isOnboarding && handleStatus === 'invalid') {
        return 'The profile link must be 3-30 characters, using lowercase letters, numbers, or underscores.'
      }
      if (isOnboarding && handleStatus === 'taken') return 'That profile link is already taken. Please choose another.'
      if (isOnboarding && locationHandleStatus === 'invalid') {
        return 'The location link must be 3-30 characters, using lowercase letters, numbers, or underscores.'
      }
      if (isOnboarding && locationHandleStatus === 'taken') return 'That location link is already taken. Please choose another.'
    }
    if (n === 3) {
      if (!directorFirstName.trim() || !directorLastName.trim()) return "Please enter the director's first and last name."
      if (!directorEmail.trim()) return "Please enter the director's e-mail address."
      if (!contactMethod) return 'Please choose a preferred contact method.'
    }
    if (n === 4) {
      if (preferredDays.length === 0) return 'Please choose at least one preferred day.'
      if (!frequency) return 'Please choose how often you would like performances.'
      if (!preferredTime) return 'Please choose a preferred time of day.'
    }
    return null
  }

  const goNext = () => {
    const problem = validateStep(step)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setStep((s) => Math.min(5, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setError(null)
    setStep((s) => Math.max(firstStep, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Everything the account carries for the signup trigger / for later reads. */
  const registrationPayload = () => ({
    facility_name: facilityName.trim(),
    address: address.trim(),
    city: city.trim(),
    state,
    zip_code: zip.trim(),
    phone: facilityPhone.trim(),
    website: website.trim(),
    director_first_name: directorFirstName.trim(),
    director_last_name: directorLastName.trim(),
    director_email: directorEmail.trim(),
    director_phone: directorPhone.trim(),
    director_job_title: jobTitle,
    preferred_contact_method: contactMethod,
    preferred_days: preferredDays,
    visit_frequency: frequency,
    preferred_time: preferredTime,
    performance_location: performanceLocation,
    preferred_length: preferredLength,
    scheduling_notes: notes.trim(),
  })

  const guardBeforeFinish = (): boolean => {
    if (!confirmAccurate) {
      setError('Please confirm the information above is accurate.')
      return false
    }
    for (let n = firstStep; n <= 4; n++) {
      const problem = validateStep(n)
      if (problem) {
        setError(problem)
        setStep(n)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return false
      }
    }
    return true
  }

  /** register mode — create the account; the signup trigger fills the tables. */
  const completeRegistration = async () => {
    setError(null)
    if (!guardBeforeFinish()) return

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: 'center_coordinator',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          human_verification_token: human.token,
          registration: registrationPayload(),
        },
        // Where the confirmation link lands. /auth/confirm sets the session
        // server-side, so they arrive signed in and carry on into onboarding.
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Fonboarding%2Fcenter`,
      },
    })

    if (signUpError) {
      setError(friendlyAuthError(signUpError.message))
      setLoading(false)
      return
    }

    if (!data.session) {
      setAwaitingConfirmation(true)
      setNotice('Check your e-mail to confirm your account, then sign in.')
    } else if (data.user) {
      notifyApplicationReceivedAction(data.user.id, facilityName.trim(), 'facility').catch(() => {})
    }
    setLoading(false)
    setDone(true)
    window.history.replaceState(null, '', '/register/facility?welcome=1')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** onboarding mode — the account exists, so write the profile rows directly. */
  const saveProfile = async () => {
    setError(null)
    if (!guardBeforeFinish()) return

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

    // Keep the account metadata in step with the answers.
    await supabase.auth.updateUser({ data: { registration: registrationPayload() } })

    const normalizedHandle = normalizeUsername(handle)
    const centerRow: Record<string, unknown> = {
      user_id: user.id,
      name: facilityName.trim(),
      phone: facilityPhone.trim() || null,
      website: website.trim() || null,
      director_first_name: directorFirstName.trim() || null,
      director_last_name: directorLastName.trim() || null,
      director_email: directorEmail.trim() || null,
      director_phone: directorPhone.trim() || null,
      director_job_title: jobTitle || null,
      preferred_contact_method: contactMethod || null,
      preferred_days: preferredDays,
      visit_frequency: frequency || null,
      preferred_time: preferredTime || null,
      performance_location: performanceLocation || null,
      preferred_length: preferredLength || null,
      scheduling_notes: notes.trim() || null,
      profile_complete: true,
    }
    // Leave the column alone when they kept the provisional handle, so the
    // database default is not overwritten with an empty value.
    if (normalizedHandle) centerRow.username = normalizedHandle
    if (photoUrl.trim()) centerRow.profile_image_url = photoUrl.trim()

    const { data: savedCenter, error: centerError } = await supabase
      .from('centers')
      .upsert(centerRow, { onConflict: 'user_id' })
      .select('id')
      .single()

    if (centerError || !savedCenter) {
      setError(centerError?.message ?? 'Your community profile could not be saved.')
      setLoading(false)
      return
    }

    const normalizedLocationHandle = normalizeUsername(locationHandle)
    const locationRow: Record<string, unknown> = {
      center_id: savedCenter.id,
      name: facilityName.trim() || 'Main Location',
      address: address.trim(),
      city: city.trim() || null,
      state: state || null,
      zip_code: zip.trim(),
      phone: facilityPhone.trim() || null,
      resident_count: residentCount.trim() ? Number(residentCount.trim()) : null,
    }
    // Both are nullable, so only write them when there is something to write —
    // an empty box must not wipe a link or photo saved earlier.
    if (normalizedLocationHandle) locationRow.username = normalizedLocationHandle
    if (locationPhotoUrl.trim()) locationRow.location_image_url = locationPhotoUrl.trim()

    const { error: locationError } = locationId
      ? await supabase.from('center_locations').update(locationRow).eq('id', locationId)
      : await supabase.from('center_locations').insert(locationRow)

    if (locationError) {
      setError(locationError.message)
      setLoading(false)
      return
    }

    // Onboarding's account was created via the plain /signup form, which never
    // gets a chance to fire this — this profile-completion step is the first
    // point they're both authenticated and have a name to put in the email.
    notifyApplicationReceivedAction(user.id, facilityName.trim(), 'facility').catch(() => {})

    setLoading(false)
    setDone(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hintFor = (status: typeof handleStatus, blank: string) => {
    if (status === 'checking') return 'Checking…'
    if (status === 'available') return 'That link is available.'
    if (status === 'taken') return 'That link is already taken.'
    if (status === 'invalid') return 'Use 3-30 lowercase letters, numbers, or underscores.'
    return blank
  }
  const badHandle = (status: typeof handleStatus) => status === 'taken' || status === 'invalid'

  if (initializing) {
    return (
      <main className="flex min-h-screen flex-col bg-ocean-900 font-sans">
        <MarketingHeader />
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="font-poppins text-[13px] text-white">Loading your community profile…</p>
        </div>
        <MarketingFooter />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-ocean-900 font-sans">
      <MarketingHeader />

      <section className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: "url('/mmm/pages/reg-bg.png')" }} aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(127,168,216,0.10) 0%, rgba(72,130,191,0.35) 60%, rgba(217,232,247,0.65) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[900px] px-4 pb-20 pt-12 sm:px-8 sm:pt-14">
          <h1 className="text-center font-garamond text-[36px] font-semibold leading-tight text-white drop-shadow-md sm:text-[56px] lg:text-[65.9px]">
            Facility Registration
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-center font-poppins text-[14px] leading-relaxed text-white drop-shadow sm:text-[16.1px]">
            {isOnboarding
              ? 'Your account is ready — pick up where you left off and finish your community profile.'
              : 'Register your memory care community and let us bring meaningful live music to your residents.'}
          </p>

          {!done && <StepTracker steps={STEP_LABELS} current={step} />}

          <div className="mt-8 rounded-3xl border-2 border-ocean-900 bg-[#faf4e7] px-4 py-8 shadow-2xl sm:px-8 sm:py-10 md:px-12">
            {done ? (
              /* ---------- Thank-you screen ---------- */
              <div className="flex flex-col items-center py-6 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mmm/pages/reg-icon-heart.png" alt="" className="h-28 w-28 object-contain" />
                <h2 className="mt-6 font-garamond text-[36px] font-bold text-ocean-900 sm:text-[50.8px]">
                  {wasAlreadyComplete ? 'Profile Updated!' : 'Application Received!'}
                </h2>
                <p className="mx-auto mt-3 max-w-[520px] font-poppins text-[13.2px] leading-relaxed text-ocean-900">
                  {wasAlreadyComplete ? (
                    "Your community's details have been saved."
                  ) : (
                    <>
                      Thank you for registering your memory care community with Margaret&apos;s Memorycare Music.
                      <br />
                      <br />
                      Your registration has been successfully submitted and is now awaiting approval. We&apos;ll review
                      your information and notify you by email once your account has been approved.
                    </>
                  )}
                </p>
                {notice && (
                  <p className="mt-3 rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[12px] font-medium text-ocean-800">{notice}</p>
                )}
                {/* Only claim an e-mail was sent when one really was — Supabase
                    sends the confirmation only when e-mail confirmation is on,
                    which is what leaves signUp without a session. Otherwise show
                    the approved Next Steps card. Editing an already-complete
                    profile skips both — there's nothing left to await. */}
                {wasAlreadyComplete ? null : awaitingConfirmation ? (
                  <div
                    className="mt-7 flex max-w-[500px] items-center gap-5 rounded-2xl px-6 py-5 text-left shadow"
                    style={{ background: 'linear-gradient(100deg, #b3d0ee 0%, #d9e8f7 100%)' }}
                  >
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ocean-900">
                      <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                        <rect x="2.5" y="5" width="19" height="14" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-garamond text-[20px] font-bold text-ocean-900">Check your e-mail!</h3>
                      <p className="mt-1 font-poppins text-[10.5px] font-bold leading-relaxed text-ocean-900">
                        We&apos;ve sent a confirmation e-mail — open it to activate your account, then sign in.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mt-7 max-w-[500px] rounded-2xl px-6 py-5 text-left shadow"
                    style={{ background: 'linear-gradient(100deg, #d9e8f7 0%, #b3d0ee 100%)' }}
                  >
                    <h3 className="font-garamond text-[20px] font-bold text-ocean-900">Next Steps</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-4 font-poppins text-[10.5px] font-bold leading-relaxed text-ocean-900">
                      <li>Application review</li>
                      <li>Approval email</li>
                      <li>Dashboard access</li>
                      <li>Request your first performance</li>
                    </ul>
                  </div>
                )}
                <Link
                  href={wasAlreadyComplete ? '/dashboard/account' : '/'}
                  className="mt-8 rounded-md bg-ocean-800 px-8 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700"
                >
                  {wasAlreadyComplete ? 'Back to Account Settings' : 'Go to Homepage'}
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
                      icon={<StepIcon src="/mmm/pages/reg-icon-account.png" />}
                    />
                    <div className="mx-auto mt-8 max-w-[520px] space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField label="First Name" value={firstName} onChange={setFirstName} placeholder="Enter your first name" autoComplete="given-name" />
                        <TextField label="Last Name" value={lastName} onChange={setLastName} placeholder="Enter your last name" autoComplete="family-name" />
                      </div>
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

                {/* ---------- Step 2 — Facility Information ---------- */}
                {step === 2 && (
                  <div>
                    <StepHeading
                      step={2}
                      title="Facility Information"
                      subtitle="Tell us about your memory care community."
                      icon={<StepIcon src="/mmm/pages/reg-icon-facility.png" />}
                    />

                    {isOnboarding && (
                      <p className="mt-4 rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[11px] font-medium text-ocean-800">
                        Your account is already set up{email ? ` as ${email}` : ''} — step 1 is done.
                      </p>
                    )}

                    <div className="mt-8 space-y-5">
                      <TextField label="Facility Name" value={facilityName} onChange={setFacilityName} placeholder="Enter facility name" autoComplete="organization" />
                      {/* address-line1, not street-address: Chrome fills the whole
                          formatted address into a street-address field, which then
                          repeats the city, state and ZIP collected below it. */}
                      <TextField label="Address" value={address} onChange={setAddress} placeholder="Enter street address" autoComplete="address-line1" />
                      <div className="grid gap-5 sm:grid-cols-3">
                        <TextField label="City" value={city} onChange={setCity} placeholder="Enter city" autoComplete="address-level2" />
                        <SelectField label="State" value={state} onChange={setState} options={US_STATES} placeholder="Select state" />
                        <TextField label="ZIP Code" value={zip} onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} placeholder="Enter ZIP code" inputMode="numeric" maxLength={5} autoComplete="postal-code" />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <PhoneField label="Phone Number" value={facilityPhone} onChange={setFacilityPhone} autoComplete="tel" />
                        <TextField label="Website (Optional)" value={website} onChange={setWebsite} placeholder="https://" inputMode="url" autoComplete="url" />
                      </div>

                      {isOnboarding && (
                        <>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                              <TextField
                                label="Public Profile Link (Optional)"
                                value={handle}
                                onChange={(v) => setHandle(normalizeUsername(v))}
                                placeholder="sunrise_memory_care"
                              />
                              <p className={`mt-1 font-poppins text-[9.5px] ${badHandle(handleStatus) ? 'text-red-600' : 'text-ocean-900/60'}`}>
                                {hintFor(handleStatus, 'Leave blank and we will assign one you can change later.')}
                              </p>
                            </div>
                            <TextField
                              label="Number of Residents (Optional)"
                              value={residentCount}
                              onChange={(v) => setResidentCount(v.replace(/\D/g, '').slice(0, 4))}
                              placeholder="e.g. 48"
                              inputMode="numeric"
                            />
                          </div>

                          <div>
                            <TextField
                              label="Location Link (Optional)"
                              value={locationHandle}
                              onChange={(v) => setLocationHandle(normalizeUsername(v))}
                              placeholder="sunrise_jupiter"
                            />
                            <p
                              className={`mt-1 font-poppins text-[9.5px] ${
                                badHandle(locationHandleStatus) ? 'text-red-600' : 'text-ocean-900/60'
                              }`}
                            >
                              {hintFor(
                                locationHandleStatus,
                                'A separate link for this address — useful once you add more locations.',
                              )}
                            </p>
                          </div>

                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Community Photo (Optional)">
                              <ProfilePhotoPicker
                                currentUrl={photoUrl.trim() || null}
                                onPhotoReady={handleCenterPhoto}
                                busy={photoBusy}
                                error={photoError}
                                size="sm"
                                hint="JPG or PNG, up to 5 MB. Crop it before it saves."
                              />
                            </Field>
                            <Field label="Photo of This Location (Optional)">
                              <ProfilePhotoPicker
                                currentUrl={locationPhotoUrl.trim() || null}
                                onPhotoReady={handleLocationPhoto}
                                busy={locationPhotoBusy}
                                error={locationPhotoError}
                                size="sm"
                                hint="Shown to musicians browsing nearby communities."
                              />
                            </Field>
                          </div>
                        </>
                      )}
                    </div>

                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      {isOnboarding ? (
                        <Link
                          href="/dashboard/center"
                          className="rounded-full border-[1.5px] border-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
                        >
                          Finish later
                        </Link>
                      ) : (
                        <BackButton onClick={goBack} />
                      )}
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 3 — Activities Director ---------- */}
                {step === 3 && (
                  <div>
                    <StepHeading
                      step={3}
                      title="Activities Director"
                      subtitle="Tell us about the person we’ll be working with."
                      icon={<StepIcon src="/mmm/pages/reg-icon-director.png" />}
                    />
                    <div className="mt-8 space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField label="First Name" value={directorFirstName} onChange={setDirectorFirstName} placeholder="Enter first name" />
                        <TextField label="Last Name" value={directorLastName} onChange={setDirectorLastName} placeholder="Enter last name" />
                      </div>
                      <TextField label="E-mail Address" type="email" value={directorEmail} onChange={setDirectorEmail} placeholder="Enter e-mail address" inputMode="email" />
                      <PhoneField label="Phone Number" value={directorPhone} onChange={setDirectorPhone} />
                      <SelectField
                        label="Preferred Contact Method"
                        value={contactMethod}
                        onChange={setContactMethod}
                        options={CONTACT_METHODS}
                        placeholder="Select contact method"
                      />
                      <SelectField label="Job Title" value={jobTitle} onChange={setJobTitle} options={jobTitleOptions} placeholder="Select job title" />
                    </div>
                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 4 — Scheduling Preferences ---------- */}
                {step === 4 && (
                  <div>
                    <StepHeading
                      step={4}
                      title="Scheduling Preferences"
                      subtitle="Help us understand your community’s preferences."
                      icon={
                        <svg className="h-12 w-12 sm:h-16 sm:w-16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm12 8H5v9h14v-9zM8 12.5h2.5V15H8v-2.5zm4.75 0h2.5V15h-2.5v-2.5z" />
                        </svg>
                      }
                    />
                    <div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-2">
                      <PillGroup label="Preferred Days" options={DAYS_OF_WEEK} selected={preferredDays} onToggle={toggleDay} />
                      <SelectField label="Ideal Frequency" value={frequency} onChange={setFrequency} options={VISIT_FREQUENCY} placeholder="Select frequency" />
                      <SelectField label="Preferred Time" value={preferredTime} onChange={setPreferredTime} options={TIME_OF_DAY} placeholder="Select time of day" />
                      <SelectField label="Preferred Performance Location" value={performanceLocation} onChange={setPerformanceLocation} options={performanceLocationOptions} placeholder="Select location" />
                      <SelectField label="Preferred Length" value={preferredLength} onChange={setPreferredLength} options={PERFORMANCE_LENGTH} placeholder="Select duration" />
                      <Field label="Additional Notes (Optional)" htmlFor="facility-notes">
                        <textarea
                          id="facility-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                          rows={4}
                          placeholder="Share any preferences or special considerations"
                          className={`${inputClass} resize-y`}
                        />
                        <p className="mt-1 text-right font-poppins text-[9.1px] text-ocean-900/60">{notes.length}/500</p>
                      </Field>
                    </div>
                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton onClick={goNext} />
                    </div>
                  </div>
                )}

                {/* ---------- Step 5 — Complete ---------- */}
                {step === 5 && (
                  <div>
                    <StepHeading
                      step={5}
                      title="Complete"
                      subtitle="Review your information before we finish."
                      icon={<StepIcon src="/mmm/pages/reg-icon-review.png" />}
                    />

                    <div className="mt-8 rounded-2xl border border-ocean-300 bg-white/70 px-5 py-5 sm:px-7">
                      <h3 className="font-garamond text-[24px] font-bold text-ocean-900">Review Your Information</h3>
                      <dl className="mt-4 overflow-hidden rounded-lg border border-ocean-400/70">
                        <ReviewRow label="Facility Name" value={facilityName} />
                        <ReviewRow label="Address" value={formatAddress(address, city, state, zip)} />
                        <ReviewRow label="Activities Director" value={`${directorFirstName} ${directorLastName}`.trim()} />
                        <ReviewRow label="Preferred Days" value={preferredDays.join(', ')} />
                        <ReviewRow label="Preferred Time" value={preferredTime} />
                        <ReviewRow label="Frequency" value={frequency} />
                        <ReviewRow label="Preferred Length" value={preferredLength} last={!isOnboarding} />
                        {isOnboarding && <ReviewRow label="Residents" value={residentCount} last />}
                      </dl>
                      <p className="mt-4 font-poppins text-[10px] text-ocean-900/70">
                        Need to change something? Use Back to return to any step — your answers are kept.
                      </p>
                    </div>

                    <label className="mt-6 flex items-start gap-2 font-poppins text-[10.7px] text-ocean-900">
                      <input
                        type="checkbox"
                        checked={confirmAccurate}
                        onChange={(e) => setConfirmAccurate(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                      />
                      <span>
                        I confirm the information above is accurate and I&apos;m authorized to register this community with
                        Margaret&apos;s Memorycare Music.
                      </span>
                    </label>

                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
                      <NextButton
                        onClick={isOnboarding ? saveProfile : completeRegistration}
                        label={
                          loading
                            ? isOnboarding
                              ? 'Saving…'
                              : 'Registering…'
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
    </main>
  )
}

/**
 * Joins the address parts, skipping any the street line already contains — a
 * pasted or autofilled "138 Lands End Way, Jupiter, Florida 33458" would
 * otherwise be followed by the same city, state and ZIP all over again.
 */
function formatAddress(street: string, city: string, state: string, zip: string) {
  const line = street.trim()
  const haystack = line.toLowerCase()
  const extras = [city, state, zip]
    .map((part) => part.trim())
    .filter((part) => part && !haystack.includes(part.toLowerCase()))
  return [line, ...extras].filter(Boolean).join(', ')
}

function ReviewRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(96px,38%)_1fr] ${last ? '' : 'border-b border-ocean-400/70'}`}>
      <dt className="border-r border-ocean-400/70 px-3 py-3 font-poppins text-[10.7px] font-bold text-ocean-900">
        {label}
      </dt>
      <dd className="px-3 py-3 font-poppins text-[11.5px] text-ocean-900">
        {value || <span className="text-ocean-900/40">Not provided</span>}
      </dd>
    </div>
  )
}
