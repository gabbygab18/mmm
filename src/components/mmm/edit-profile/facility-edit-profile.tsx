'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { saveOwnPhone } from '@/lib/private-contact'
import { TextField, PhoneField, SelectField, PillGroup, Field } from '@/components/mmm/form-kit'
import { EditProfileFooter, EditProfileHeader, SectionCard, editInputClass } from './edit-profile-ui'
import {
  CONTACT_METHODS,
  DAYS_OF_WEEK,
  DIRECTOR_JOB_TITLES,
  GENRES,
  PERFORMANCE_LENGTH,
  PERFORMANCE_LOCATIONS,
  PERFORMANCE_TYPES,
  TIME_OF_DAY,
  VISIT_FREQUENCY,
} from '@/lib/mmm/options'

const COMMUNITY_TYPES = ['Private Community', 'Public Community'] as const

export type FacilityEditProfileData = {
  id: string
  user_id: string
  name: string | null
  website: string | null
  director_first_name: string | null
  director_last_name: string | null
  director_email: string | null
  director_job_title: string | null
  preferred_contact_method: string | null
  preferred_days: string[] | null
  visit_frequency: string | null
  preferred_time: string | null
  performance_location: string | null
  preferred_length: string | null
  scheduling_notes: string | null
  about_description: string | null
  established_year: number | null
  community_type: string | null
  highlights: string[] | null
  testimonial_quote: string | null
  testimonial_author: string | null
  preferred_music_styles: string[] | null
  preferred_performance_types: string[] | null
}

export type FacilityLocationEditData = {
  id: string
  address: string | null
  zip_code: string | null
}

export function FacilityEditProfile({
  center,
  location,
  email,
  firstName: initialFirstName,
  lastName: initialLastName,
  initialPhone,
  initialDirectorPhone,
}: {
  center: FacilityEditProfileData
  location: FacilityLocationEditData | null
  email: string
  firstName: string
  lastName: string
  /** Both read from private_contacts by the server page — not from the centers
      row, which is readable platform-wide for discovery. */
  initialPhone: string | null
  initialDirectorPhone: string | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)

  const [facilityName, setFacilityName] = useState(center.name ?? '')
  const [address, setAddress] = useState(location?.address ?? '')
  const [zip, setZip] = useState(location?.zip_code ?? '')
  const [website, setWebsite] = useState(center.website ?? '')
  const [facilityPhone, setFacilityPhone] = useState(initialPhone ?? '')

  const [directorFirstName, setDirectorFirstName] = useState(center.director_first_name ?? '')
  const [directorLastName, setDirectorLastName] = useState(center.director_last_name ?? '')
  const [directorEmail, setDirectorEmail] = useState(center.director_email ?? '')
  const [directorPhone, setDirectorPhone] = useState(initialDirectorPhone ?? '')
  const [jobTitle, setJobTitle] = useState(center.director_job_title ?? '')
  const [contactMethod, setContactMethod] = useState(center.preferred_contact_method ?? '')

  const [preferredDays, setPreferredDays] = useState<string[]>(center.preferred_days ?? [])
  const [frequency, setFrequency] = useState(center.visit_frequency ?? '')
  const [preferredTime, setPreferredTime] = useState(center.preferred_time ?? '')
  const [performanceLocation, setPerformanceLocation] = useState(center.performance_location ?? '')
  const [preferredLength, setPreferredLength] = useState(center.preferred_length ?? '')
  const [notes, setNotes] = useState(center.scheduling_notes ?? '')

  const [aboutDescription, setAboutDescription] = useState(center.about_description ?? '')
  const [establishedYear, setEstablishedYear] = useState(center.established_year ? String(center.established_year) : '')
  const [communityType, setCommunityType] = useState(center.community_type ?? '')
  const [preferredMusicStyles, setPreferredMusicStyles] = useState<string[]>(center.preferred_music_styles ?? [])
  const [preferredPerformanceTypes, setPreferredPerformanceTypes] = useState<string[]>(center.preferred_performance_types ?? [])
  const [highlightsText, setHighlightsText] = useState((center.highlights ?? []).join('\n'))
  const [testimonialQuote, setTestimonialQuote] = useState(center.testimonial_quote ?? '')
  const [testimonialAuthor, setTestimonialAuthor] = useState(center.testimonial_author ?? '')

  const toggleDay = (day: string) =>
    setPreferredDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]))
  const toggleInList = (setter: (fn: (cur: string[]) => string[]) => void, value: string) =>
    setter((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.')
      return
    }
    if (!facilityName.trim() || !address.trim() || !/^\d{5}$/.test(zip.trim())) {
      setError('Facility name, address, and a 5-digit ZIP code are required.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()

    await supabase.auth.updateUser({
      data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}` },
    })

    const { error: centerError } = await supabase
      .from('centers')
      .update({
        name: facilityName.trim(),
        website: website.trim() || null,
        director_first_name: directorFirstName.trim() || null,
        director_last_name: directorLastName.trim() || null,
        director_email: directorEmail.trim() || null,
        director_job_title: jobTitle || null,
        preferred_contact_method: contactMethod || null,
        preferred_days: preferredDays,
        visit_frequency: frequency || null,
        preferred_time: preferredTime || null,
        performance_location: performanceLocation || null,
        preferred_length: preferredLength || null,
        scheduling_notes: notes.trim() || null,
        about_description: aboutDescription.trim() || null,
        established_year: establishedYear.trim() ? Number(establishedYear.trim()) : null,
        community_type: communityType || null,
        preferred_music_styles: preferredMusicStyles,
        preferred_performance_types: preferredPerformanceTypes,
        highlights: highlightsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        testimonial_quote: testimonialQuote.trim() || null,
        testimonial_author: testimonialAuthor.trim() || null,
      })
      .eq('id', center.id)

    if (centerError) {
      setError(centerError.message)
      setSaving(false)
      return
    }

    // Numbers live in private_contacts — see the wizard for why the centers
    // row is the wrong place for them.
    const { error: phoneError } = await saveOwnPhone(supabase, center.user_id, facilityPhone, directorPhone)
    if (phoneError) {
      setError(phoneError)
      setSaving(false)
      return
    }

    if (location) {
      const { error: locationError } = await supabase
        .from('center_locations')
        .update({
          name: facilityName.trim() || 'Main Location',
          address: address.trim(),
          zip_code: zip.trim(),
        })
        .eq('id', location.id)

      if (locationError) {
        setError(locationError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    router.push('/dashboard/account')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <EditProfileHeader
        subheading="Update your community information."
        name={facilityName || 'Your Facility'}
        roleLabel="Memory Care Community"
        email={email}
        phone={facilityPhone || 'Contact Number'}
        locationLabel={zip ? `ZIP ${zip}` : 'Location'}
      />

      <div className="mt-6 space-y-8 rounded-2xl border border-ocean-200/70 bg-white px-5 py-6 sm:px-7">
        <SectionCard number={1} title="Getting Started" subtitle="Login and basic account information">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="First Name" value={firstName} onChange={setFirstName} autoComplete="given-name" required />
            <TextField label="Last Name" value={lastName} onChange={setLastName} autoComplete="family-name" required />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="E-mail Address">
              <p className={`${editInputClass} bg-ocean-50 text-ocean-900/70`}>{email}</p>
            </Field>
            <Field label="Password">
              <div className={`${editInputClass} flex items-center justify-between bg-ocean-50`}>
                <span className="text-ocean-900/70">••••••••</span>
                <a href="/dashboard/account" className="font-poppins text-[11px] font-bold text-ocean-700 underline">
                  Change in Account Settings
                </a>
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard number={2} title="Community Profile" subtitle="Tell us about your memory care community.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Facility Name" value={facilityName} onChange={setFacilityName} autoComplete="organization" required />
            <TextField label="ZIP Code" value={zip} onChange={(v) => setZip(v.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" maxLength={5} autoComplete="postal-code" required />
            <TextField label="Website" value={website} onChange={setWebsite} placeholder="https://" inputMode="url" autoComplete="url" />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <TextField label="Address" value={address} onChange={setAddress} autoComplete="address-line1" required />
            <PhoneField label="Phone Number" value={facilityPhone} onChange={setFacilityPhone} autoComplete="tel" />
          </div>
        </SectionCard>

        <SectionCard number={3} title="Activities Director" subtitle="Tell us about the person we'll be working with.">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="First Name" value={directorFirstName} onChange={setDirectorFirstName} />
            <TextField label="E-mail Address" type="email" value={directorEmail} onChange={setDirectorEmail} inputMode="email" />
            <SelectField label="Job Title" value={jobTitle} onChange={setJobTitle} options={DIRECTOR_JOB_TITLES} placeholder="Select job title" />
            <TextField label="Last Name" value={directorLastName} onChange={setDirectorLastName} />
            <PhoneField label="Phone Number" value={directorPhone} onChange={setDirectorPhone} />
            <SelectField label="Preferred Contact Method" value={contactMethod} onChange={setContactMethod} options={CONTACT_METHODS} placeholder="Select contact method" />
          </div>
        </SectionCard>

        <SectionCard number={4} title="Scheduling Preferences" subtitle="Help us understand your community's preferences.">
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <PillGroup label="Preferred Days" options={DAYS_OF_WEEK} selected={preferredDays} onToggle={toggleDay} />
            <SelectField label="Preferred Length" value={preferredLength} onChange={setPreferredLength} options={PERFORMANCE_LENGTH} placeholder="Select duration" />
            <SelectField label="Preferred Time" value={preferredTime} onChange={setPreferredTime} options={TIME_OF_DAY} placeholder="Select time of day" />
            <SelectField label="Ideal Frequency" value={frequency} onChange={setFrequency} options={VISIT_FREQUENCY} placeholder="Select frequency" />
            <SelectField label="Preferred Performance Location" value={performanceLocation} onChange={setPerformanceLocation} options={PERFORMANCE_LOCATIONS} placeholder="Select location" />
            <Field label="Additional Notes (Optional)">
              <textarea
                className={`${editInputClass} min-h-[96px] resize-none`}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share any preferences or special considerations"
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard number={5} title="Facility Profile Page" subtitle="What musicians see when they view your community's public profile.">
          <div className="space-y-5">
            <Field label="About this Community (Optional)">
              <textarea
                className={`${editInputClass} min-h-[96px] resize-none`}
                maxLength={600}
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                placeholder="A short description of your community — shown on your public profile."
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Community Type (Optional)" value={communityType} onChange={setCommunityType} options={COMMUNITY_TYPES} placeholder="Select community type" />
              <TextField
                label="Established Year (Optional)"
                value={establishedYear}
                onChange={(v) => setEstablishedYear(v.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 2018"
              />
            </div>

            <PillGroup label="Preferred Music Styles (Optional)" options={GENRES} selected={preferredMusicStyles} onToggle={(v) => toggleInList(setPreferredMusicStyles, v)} />
            <PillGroup label="Preferred Performance Types (Optional)" options={PERFORMANCE_TYPES} selected={preferredPerformanceTypes} onToggle={(v) => toggleInList(setPreferredPerformanceTypes, v)} />

            <Field label="What Makes Us Special (Optional)">
              <p className="-mt-1 mb-1.5 font-poppins text-[11.5px] text-ocean-900/60">One highlight per line.</p>
              <textarea
                className={`${editInputClass} min-h-[96px] resize-none`}
                maxLength={600}
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                placeholder={'Family-like environment with personalized care\nBeautiful outdoor garden and walking paths'}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Notes from the Community (Optional)">
                <textarea
                  className={`${editInputClass} min-h-[80px] resize-none`}
                  maxLength={300}
                  value={testimonialQuote}
                  onChange={(e) => setTestimonialQuote(e.target.value)}
                  placeholder="A short quote about hosting live music, shown on your public profile."
                />
              </Field>
              <TextField label="Quote Attribution (Optional)" value={testimonialAuthor} onChange={setTestimonialAuthor} placeholder="e.g. Activities Team" />
            </div>
          </div>
        </SectionCard>
      </div>

      <EditProfileFooter onCancel={() => router.push('/dashboard/account')} saving={saving} error={error} />
    </form>
  )
}
