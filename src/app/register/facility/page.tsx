'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import {
  BackButton,
  NextButton,
  StepHeading,
  StepIcon,
  StepTracker,
} from '@/components/mmm/registration-ui'
import { Field, PasswordField, PillGroup, SelectField, TextField, inputClass, labelClass } from '@/components/mmm/form-kit'
import { HumanCheck, type HumanCheckValue } from '@/components/mmm/human-check'
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
 * Facility Registration — 5-step wizard (approved design pack, July 2026):
 * 1 Create Account · 2 Facility Information · 3 Activities Director ·
 * 4 Scheduling Preferences · 5 Complete → Thank-you screen.
 *
 * On completion the account is created through Supabase auth with role
 * `center_coordinator`; every answer is written to user metadata under
 * `registration`, which the database trigger reads to populate the centers and
 * center_locations rows. That trigger is what keeps the answers from being lost
 * between signup and the dashboard.
 */

const STEP_LABELS = [
  ['Create', 'Account'],
  ['Facility', 'Information'],
  ['Activities', 'Director'],
  ['Scheduling', 'Preferences'],
  ['Complete'],
]

export default function FacilityRegistrationPage() {
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

  // Step 2 — Facility Information
  const [facilityName, setFacilityName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Florida')
  const [zip, setZip] = useState('')
  const [facilityPhone, setFacilityPhone] = useState('')
  const [website, setWebsite] = useState('')

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

  // Coming back from the confirmation e-mail lands straight on the thank-you card.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('welcome') === '1') setDone(true)
  }, [])

  const toggleDay = (day: string) =>
    setPreferredDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]))

  const validateStep = (n: number): string | null => {
    if (n === 1) {
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
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const completeRegistration = async () => {
    setError(null)
    if (!confirmAccurate) {
      setError('Please confirm the information above is accurate.')
      return
    }
    for (let n = 1; n <= 4; n++) {
      const problem = validateStep(n)
      if (problem) {
        setError(problem)
        setStep(n)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

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
          registration: {
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
    setDone(true)
    window.history.replaceState(null, '', '/register/facility?welcome=1')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
            Register your memory care community and let us bring meaningful live music to your residents.
          </p>

          {!done && <StepTracker steps={STEP_LABELS} current={step} />}

          <div className="mt-8 rounded-3xl border-2 border-ocean-900 bg-[#faf4e7] px-4 py-8 shadow-2xl sm:px-8 sm:py-10 md:px-12">
            {done ? (
              /* ---------- Thank-you screen ---------- */
              <div className="flex flex-col items-center py-6 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mmm/pages/reg-icon-heart.png" alt="" className="h-28 w-28 object-contain" />
                <h2 className="mt-6 font-garamond text-[36px] font-bold text-ocean-900 sm:text-[50.8px]">Thank you!</h2>
                <p className="mx-auto mt-3 max-w-[520px] font-poppins text-[14px] leading-relaxed text-ocean-900 sm:text-[16.1px]">
                  Your facility has been successfully registered. We&apos;re excited to partner with you to bring the joy
                  of live music to your residents.
                </p>
                {notice && (
                  <p className="mt-3 rounded-lg bg-ocean-100 px-4 py-2 font-poppins text-[12px] font-medium text-ocean-800">{notice}</p>
                )}
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
                      We&apos;ve sent a confirmation e-mail with next steps and helpful information.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 rounded-md bg-ocean-800 px-8 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700"
                >
                  Go to Dashboard
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
                    <div className="mt-8 space-y-5">
                      <TextField label="Facility Name" value={facilityName} onChange={setFacilityName} placeholder="Enter facility name" autoComplete="organization" />
                      <TextField label="Address" value={address} onChange={setAddress} placeholder="Enter street address" autoComplete="street-address" />
                      <div className="grid gap-5 sm:grid-cols-3">
                        <TextField label="City" value={city} onChange={setCity} placeholder="Enter city" autoComplete="address-level2" />
                        <SelectField label="State" value={state} onChange={setState} options={US_STATES} placeholder="Select state" />
                        <TextField label="ZIP Code" value={zip} onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} placeholder="Enter ZIP code" inputMode="numeric" maxLength={5} autoComplete="postal-code" />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField label="Phone Number" value={facilityPhone} onChange={setFacilityPhone} placeholder="(555) 555-5555" inputMode="tel" autoComplete="tel" />
                        <TextField label="Website (Optional)" value={website} onChange={setWebsite} placeholder="https://" inputMode="url" autoComplete="url" />
                      </div>
                    </div>
                    {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
                    <div className="mt-8 flex items-center justify-between">
                      <BackButton onClick={goBack} />
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
                      <TextField label="Phone Number" value={directorPhone} onChange={setDirectorPhone} placeholder="(555) 555-5555" inputMode="tel" />
                      <SelectField
                        label="Preferred Contact Method"
                        value={contactMethod}
                        onChange={setContactMethod}
                        options={CONTACT_METHODS}
                        placeholder="Select contact method"
                      />
                      <SelectField label="Job Title" value={jobTitle} onChange={setJobTitle} options={DIRECTOR_JOB_TITLES} placeholder="Select job title" />
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
                      <SelectField label="Preferred Performance Location" value={performanceLocation} onChange={setPerformanceLocation} options={PERFORMANCE_LOCATIONS} placeholder="Select location" />
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
                        <ReviewRow label="Address" value={[address, city, state, zip].filter(Boolean).join(', ')} />
                        <ReviewRow label="Activities Director" value={`${directorFirstName} ${directorLastName}`.trim()} />
                        <ReviewRow label="Preferred Days" value={preferredDays.join(', ')} />
                        <ReviewRow label="Preferred Time" value={preferredTime} />
                        <ReviewRow label="Frequency" value={frequency} />
                        <ReviewRow label="Preferred Length" value={preferredLength} last />
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
                        onClick={completeRegistration}
                        label={loading ? 'Registering…' : 'Complete Registration'}
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
