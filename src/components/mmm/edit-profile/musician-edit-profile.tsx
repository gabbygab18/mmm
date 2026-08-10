'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AvatarPhotoButton } from '@/components/mmm/avatar-photo-button'
import { TextField, PhoneField, SelectField, PillGroup } from '@/components/mmm/form-kit'
import {
  CheckPill,
  EditField,
  EditProfileFooter,
  EditProfileHeader,
  SectionCard,
  UnavailableCalendar,
  editInputClass,
  editLabelClass,
} from './edit-profile-ui'
import { GENRES, INSTRUMENTS, TRAVEL_DISTANCES, YEARS_EXPERIENCE } from '@/lib/mmm/options'

/** Stored abbreviated in `musicians.general_available_days` (matches the
    onboarding wizard and the RPCs that filter on it) — displayed here as
    full names to match the approved design, without changing the stored
    format anywhere else that reads this column. */
const DAY_OPTIONS = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
  { full: 'Sunday', short: 'Sun' },
] as const

const TIMES = ['Morning', 'Afternoon', 'Evening'] as const
const FREQUENCIES = ['Weekly', 'Every 2 weeks', 'Monthly', 'Flexible'] as const
const STEP2_PERFORMANCE_TYPES = ['Solo', 'Duo', 'Small Group', 'Large Group'] as const
/** Larger than any real point-to-point distance within the continental US. */
const NATIONWIDE_RADIUS_MILES = 5000

export type MusicianEditProfileData = {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  bio: string | null
  phone: string | null
  zip_code: string | null
  instruments: string[] | null
  music_types: string[] | null
  band_size_preference: string | null
  general_available_days: string[] | null
  travel_radius_miles: number | null
  youtube_channel_url: string | null
  profile_image_url: string | null
}

export function MusicianEditProfile({
  musician,
  email,
  registration,
}: {
  musician: MusicianEditProfileData
  email: string
  /** Metadata-only extras the onboarding wizard also keeps outside the
      `musicians` table (no matching/search logic depends on them, so they
      have never needed real columns) — years of experience, preferred time
      of day, volunteering frequency, unavailable dates, availability notes. */
  registration: {
    years_of_experience?: string
    preferred_time?: string
    availability_frequency?: string
    unavailable_dates?: string[]
    availability_notes?: string
  }
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(musician.first_name ?? '')
  const [lastName, setLastName] = useState(musician.last_name ?? '')
  const [bio, setBio] = useState(musician.bio ?? '')
  const [phone, setPhone] = useState(musician.phone ?? '')
  const [zip, setZip] = useState(musician.zip_code ?? '')
  const [performanceTypes, setPerformanceTypes] = useState<string[]>(
    musician.band_size_preference ? [musician.band_size_preference] : [],
  )

  const initialInstruments = musician.instruments ?? []
  const [primaryInstrument, setPrimaryInstrument] = useState(initialInstruments[0] ?? '')
  const [otherInstruments, setOtherInstruments] = useState(initialInstruments.slice(1).join(', '))
  const [yearsExperience, setYearsExperience] = useState(registration.years_of_experience ?? '')
  const [genres, setGenres] = useState<string[]>(musician.music_types ?? [])
  const [experience, setExperience] = useState('')

  const [preferredDays, setPreferredDays] = useState<string[]>(musician.general_available_days ?? [])
  const [preferredTime, setPreferredTime] = useState(registration.preferred_time ?? '')
  const [frequency, setFrequency] = useState(registration.availability_frequency ?? '')
  const [maxDistance, setMaxDistance] = useState(() => {
    const miles = musician.travel_radius_miles
    if (!miles) return ''
    if (miles >= NATIONWIDE_RADIUS_MILES) return 'Any distance'
    return TRAVEL_DISTANCES.find((d) => d.startsWith(`Within ${miles} `)) ?? ''
  })
  const [unavailableDates, setUnavailableDates] = useState<string[]>(registration.unavailable_dates ?? [])
  const [availabilityNotes, setAvailabilityNotes] = useState(registration.availability_notes ?? '')

  const toggleInList = (setter: (fn: (cur: string[]) => string[]) => void, value: string) =>
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))
  const toggleDay = (short: string) => toggleInList(setPreferredDays, short)
  const togglePerformanceType = (t: string) =>
    setPerformanceTypes((cur) => (cur.includes(t) ? cur.filter((v) => v !== t) : [...cur, t]))

  const bioPreview = useMemo(() => (bio.trim() ? bio.trim() : 'Add a short bio so facilities get to know you.'), [bio])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    if (!/^\d{5}$/.test(zip.trim())) {
      setError('Enter a 5-digit ZIP code so nearby communities can find you.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()

    const instruments = [primaryInstrument, ...otherInstruments.split(',').map((v) => v.trim())].filter(Boolean)
    const radius = /any distance/i.test(maxDistance)
      ? NATIONWIDE_RADIUS_MILES
      : Number(maxDistance.replace(/\D/g, '')) || 15

    const { error: updateError } = await supabase
      .from('musicians')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        zip_code: zip.trim(),
        instruments,
        music_types: genres,
        band_size_preference: performanceTypes[0] ?? null,
        willing_to_travel: radius > 0,
        travel_radius_miles: radius,
        general_available_days: preferredDays,
      })
      .eq('id', musician.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Metadata-only extras — same place the onboarding wizard keeps them,
    // since nothing else in the app queries these off the musicians row.
    await supabase.auth.updateUser({
      data: {
        registration: {
          years_of_experience: yearsExperience,
          musical_experience: experience.trim(),
          preferred_time: preferredTime,
          availability_frequency: frequency,
          unavailable_dates: unavailableDates,
          availability_notes: availabilityNotes.trim(),
        },
      },
    })

    setSaving(false)
    router.push('/dashboard/account')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <EditProfileHeader
        subheading="Update your information below."
        name={firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Your Name'}
        roleLabel="Volunteer Musician"
        bioLine={bioPreview}
        email={email}
        phone={phone || 'Contact Number'}
        locationLabel={zip ? `ZIP ${zip}` : 'Location'}
      />

      <div className="mt-6 space-y-8 rounded-2xl border border-ocean-200/70 bg-white px-5 py-6 sm:px-7">
        <SectionCard number={1} title="Getting Started" subtitle="Login and basic account information">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="First Name" value={firstName} onChange={setFirstName} autoComplete="given-name" required />
            <TextField label="Last Name" value={lastName} onChange={setLastName} autoComplete="family-name" required />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <EditField label="E-mail Address">
              <p className={`${editInputClass} bg-ocean-50 text-ocean-900/70`}>{email}</p>
            </EditField>
            <EditField label="Password">
              <div className={`${editInputClass} flex items-center justify-between bg-ocean-50`}>
                <span className="text-ocean-900/70">••••••••</span>
                <a href="/dashboard/account" className="font-poppins text-[11px] font-bold text-ocean-700 underline">
                  Change in Account Settings
                </a>
              </div>
            </EditField>
          </div>
        </SectionCard>

        <SectionCard number={2} title="Musician Profile" subtitle="Tell us a little about yourself.">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-2">
              <span className={editLabelClass}>Profile Photo</span>
              <AvatarPhotoButton
                url={musician.profile_image_url}
                table="musicians"
                size={140}
                tooltip="Change profile picture"
              />
            </div>
            <div className="space-y-5">
              <EditField label="Short Bio">
                <textarea
                  className={`${editInputClass} min-h-[96px] resize-none`}
                  maxLength={250}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and why you want to volunteer with MMM."
                />
              </EditField>
              <div className="grid gap-5 sm:grid-cols-2">
                <PhoneField label="Phone Number" value={phone} onChange={setPhone} autoComplete="tel" />
                <TextField
                  label="ZIP Code"
                  value={zip}
                  onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))}
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  required
                />
              </div>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className={editLabelClass}>Performance Type</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STEP2_PERFORMANCE_TYPES.map((t) => (
                <CheckPill key={t} label={t} checked={performanceTypes.includes(t)} onChange={() => togglePerformanceType(t)} />
              ))}
            </div>
          </fieldset>
        </SectionCard>

        <SectionCard number={3} title="Musician Background" subtitle="Your music, experience, and style.">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div className="space-y-5">
              <SelectField label="Primary Instrument" value={primaryInstrument} onChange={setPrimaryInstrument} options={INSTRUMENTS} placeholder="Select your primary instrument" />
              <EditField label="Other Instruments (Optional)">
                <input className={editInputClass} value={otherInstruments} onChange={(e) => setOtherInstruments(e.target.value)} placeholder="e.g. Ukulele, Harmonica" />
              </EditField>
              <SelectField label="Years of Experience" value={yearsExperience} onChange={setYearsExperience} options={YEARS_EXPERIENCE} placeholder="Select years of experience" />
            </div>
            <div className="space-y-5">
              <PillGroup label="Genres You Play" options={GENRES} selected={genres} onToggle={(v) => toggleInList(setGenres, v)} />
              <EditField label="Experience / Bio">
                <textarea
                  className={`${editInputClass} min-h-[136px] resize-none`}
                  maxLength={500}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Share your musical journey, training, performances, and anything you'd like us to know."
                />
              </EditField>
            </div>
          </div>
        </SectionCard>

        <SectionCard number={4} title="Availability" subtitle="When you're available to share your music.">
          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
            <div>
              <h3 className="font-poppins text-[13px] font-bold text-ocean-900">Recurring Availability</h3>
              <div className="mt-3">
                <span className={editLabelClass}>Preferred Days</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DAY_OPTIONS.map((d) => (
                    <CheckPill key={d.short} label={d.full} checked={preferredDays.includes(d.short)} onChange={() => toggleDay(d.short)} />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <span className={editLabelClass}>Preferred Time</span>
                <div className="grid grid-cols-3 gap-2">
                  {TIMES.map((t) => (
                    <CheckPill key={t} label={t} checked={preferredTime === t} onChange={() => setPreferredTime((cur) => (cur === t ? '' : t))} />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <span className={editLabelClass}>How often would you like to volunteer?</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {FREQUENCIES.map((f) => (
                    <label key={f} className="flex cursor-pointer select-none items-center gap-2 font-poppins text-[12.5px] text-ocean-900">
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
              <div className="mt-4">
                <EditField label="Maximum Travel Distance">
                  <select className={`${editInputClass} ${maxDistance ? '' : 'text-ocean-900/40'}`} value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)}>
                    <option value="">Select distance</option>
                    {TRAVEL_DISTANCES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </EditField>
              </div>
            </div>

            <div>
              <h3 className="font-poppins text-[13px] font-bold text-ocean-900">Unavailable Dates</h3>
              <p className="mt-0.5 font-poppins text-[12.5px] text-ocean-900/70">Select any dates you are unavailable</p>
              <div className="mt-3">
                <UnavailableCalendar selected={unavailableDates} onToggle={(iso) => toggleInList(setUnavailableDates, iso)} />
              </div>
              <div className="mt-4">
                <EditField label="Additional Notes (Optional)">
                  <p className="-mt-1 mb-1.5 font-poppins text-[11.5px] text-ocean-900/60">
                    Share anything else we should know about your availability?
                  </p>
                  <textarea
                    className={`${editInputClass} min-h-[96px] resize-none`}
                    maxLength={250}
                    value={availabilityNotes}
                    onChange={(e) => setAvailabilityNotes(e.target.value)}
                    placeholder="e.g. Available after work, prefer piano performances, only available weekends, etc."
                  />
                </EditField>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <EditProfileFooter onCancel={() => router.push('/dashboard/account')} saving={saving} error={error} />
    </form>
  )
}
