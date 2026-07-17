'use client'

import Link from 'next/link'
import { ChangeEvent, ReactNode, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

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

const PERFORMANCE_TYPES = ['Solo', 'Duo', 'Small Group', 'Large Group'] as const

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

function StepTracker({ current }: { current: number }) {
  return (
    <div
      className="relative mx-auto mt-10 max-w-[840px] overflow-hidden rounded-2xl bg-[#faf4e7]/90 px-6 py-6 shadow-lg sm:px-10"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundRepeat: 'no-repeat', backgroundSize: '760px auto', backgroundPosition: 'left -30px center' }}
        aria-hidden="true"
      />
      <ol className="relative flex items-start justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNo = i + 1
          const done = stepNo < current
          const active = stepNo === current
          return (
            <li key={label.join(' ')} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <span className="absolute right-1/2 top-6 -z-0 hidden h-[2px] w-full -translate-y-1/2 bg-ocean-700/50 sm:block" aria-hidden="true" style={{ right: '50%', width: '100%' }} />
              )}
              <span
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 font-poppins text-[20px] font-bold sm:h-14 sm:w-14 ${
                  active
                    ? 'border-ocean-900 bg-ocean-900 text-white'
                    : 'border-ocean-900 bg-[#faf4e7] text-ocean-900'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg className="h-6 w-6 text-ocean-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNo
                )}
              </span>
              <span className="mt-2 text-center font-poppins text-[11px] leading-tight text-ocean-900 sm:text-[13px]">
                {label.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StepHeading({ step, title, subtitle, icon }: { step: number; title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ocean-900 text-white sm:h-24 sm:w-24">
        {icon}
      </div>
      <div>
        <p className="font-poppins text-[13px] text-ocean-900">Step {step} of 5</p>
        <h2 className="font-garamond text-[34px] font-bold leading-none text-ocean-900 sm:text-[50.8px]">{title}</h2>
        <p className="mt-1 font-poppins text-[13px] text-ocean-900 sm:text-[16.1px]">{subtitle}</p>
      </div>
    </div>
  )
}

function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] border-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
    >
      {label === 'Back' ? <>&larr; {label}</> : label}
    </button>
  )
}

function NextButton({ onClick, label = 'Next', disabled = false }: { onClick: () => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
    >
      {label === 'Next' ? <>{label} &rarr;</> : label}
    </button>
  )
}

export default function MusicianRegistrationPage() {
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Step 1 — Create Account
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTos, setAgreeTos] = useState(false)

  // Step 2 — Profile
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [languages, setLanguages] = useState('')
  const [performanceTypes, setPerformanceTypes] = useState<string[]>([])

  // Step 3 — Musical Background
  const [primaryInstruments, setPrimaryInstruments] = useState('')
  const [otherInstruments, setOtherInstruments] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [genres, setGenres] = useState('')
  const [experience, setExperience] = useState('')

  // Step 4 — Availability
  const [preferredDays, setPreferredDays] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [frequency, setFrequency] = useState('')
  const [availabilityNotes, setAvailabilityNotes] = useState('')

  // Step 5 — Agreement
  const [agreeVolunteer, setAgreeVolunteer] = useState(false)

  const togglePerformanceType = (t: string) =>
    setPerformanceTypes((cur) => (cur.includes(t) ? cur.filter((v) => v !== t) : [...cur, t]))

  const goNext = () => {
    setError(null)
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in your name, e-mail address, and password.')
        return
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (!agreeTos) {
        setError('Please agree to the Terms of Service and Privacy Policy.')
        return
      }
    }
    setStep((s) => Math.min(5, s + 1))
  }

  const goBack = () => {
    setError(null)
    setStep((s) => Math.max(1, s - 1))
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
          full_name: name.trim(),
          registration: {
            bio: bio.trim(),
            phone: phone.trim(),
            zip_code: zip.trim(),
            languages: languages.trim(),
            performance_types: performanceTypes,
            primary_instruments: primaryInstruments.trim(),
            other_instruments: otherInstruments.trim(),
            years_of_experience: yearsExperience.trim(),
            genres: genres.trim(),
            musical_experience: experience.trim(),
            preferred_days: preferredDays.trim(),
            preferred_time: preferredTime.trim(),
            availability_frequency: frequency.trim(),
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
    setDone(true)
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

        <div className="relative mx-auto max-w-[900px] px-5 pb-20 pt-14 sm:px-8">
          <h1 className="text-center font-garamond text-[42px] font-semibold leading-tight text-white drop-shadow-md sm:text-[56px] lg:text-[65.9px]">
            Musician Registration
          </h1>
          <p className="mx-auto mt-3 max-w-[640px] text-center font-poppins text-[14px] leading-relaxed text-white drop-shadow sm:text-[16.1px]">
            Join our community of volunteer musicians and bring the joy of live music to memory care residents.
          </p>

          {!done && <StepTracker current={step} />}

          {/* ============ Card ============ */}
          <div className="mt-8 rounded-3xl border-2 border-ocean-900 bg-[#faf4e7] px-6 py-10 shadow-2xl sm:px-12">
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
                      <Field label="Name">
                        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" autoComplete="name" />
                      </Field>
                      <Field label="E-mail Address">
                        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your e-mail address" autoComplete="email" />
                      </Field>
                      <Field label="Password">
                        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="new-password" />
                      </Field>
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
                        <Field label="Languages You Speak">
                          <input className={inputClass} value={languages} onChange={(e) => setLanguages(e.target.value)} />
                        </Field>
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
                        <Field label="Primary Instrument/s">
                          <input className={inputClass} value={primaryInstruments} onChange={(e) => setPrimaryInstruments(e.target.value)} placeholder="e.g. Guitar, Piano, Vocals" />
                        </Field>
                        <Field label="Other Instruments (Optional)">
                          <input className={inputClass} value={otherInstruments} onChange={(e) => setOtherInstruments(e.target.value)} placeholder="e.g. Ukulele, Harmonica" />
                        </Field>
                        <Field label="Years of Experience">
                          <input className={inputClass} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} inputMode="numeric" />
                        </Field>
                      </div>
                      <div className="space-y-5">
                        <Field label="Genres You Play">
                          <input className={inputClass} value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="e.g. Folk, Classical, Pop, Gospel" />
                        </Field>
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

                {/* ---------- Step 4 — Availability ---------- */}
                {step === 4 && (
                  <div>
                    <StepHeading
                      step={4}
                      title="Availability"
                      subtitle="When are you available to share your music?"
                      icon={
                        <svg className="h-12 w-12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm-2 8h14v10H5V10zm3 2v2h2v-2H8zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm-8 4v2h2v-2H8zm4 0v2h2v-2h-2z" />
                        </svg>
                      }
                    />
                    <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      <div className="space-y-5">
                        <Field label="Preferred Days">
                          <input className={inputClass} value={preferredDays} onChange={(e) => setPreferredDays(e.target.value)} />
                        </Field>
                        <Field label="Preferred Time">
                          <input className={inputClass} value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
                        </Field>
                        <Field label="How often are you available?">
                          <input className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                        </Field>
                      </div>
                      <Field label="Additional Notes (Optional)">
                        <textarea
                          className={`${inputClass} min-h-[210px] resize-none`}
                          value={availabilityNotes}
                          onChange={(e) => setAvailabilityNotes(e.target.value)}
                        />
                      </Field>
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
