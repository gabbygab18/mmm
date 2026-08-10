'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { TextField, PhoneField, SelectField, PillGroup, Field } from '@/components/mmm/form-kit'
import { EditProfileFooter, EditProfileHeader, SectionCard, editInputClass } from './edit-profile-ui'
import {
  CONTACT_METHODS,
  DAYS_OF_WEEK,
  DIRECTOR_JOB_TITLES,
  PERFORMANCE_LENGTH,
  PERFORMANCE_LOCATIONS,
  TIME_OF_DAY,
  VISIT_FREQUENCY,
} from '@/lib/mmm/options'

export type FacilityEditProfileData = {
  id: string
  name: string | null
  phone: string | null
  website: string | null
  director_first_name: string | null
  director_last_name: string | null
  director_email: string | null
  director_phone: string | null
  director_job_title: string | null
  preferred_contact_method: string | null
  preferred_days: string[] | null
  visit_frequency: string | null
  preferred_time: string | null
  performance_location: string | null
  preferred_length: string | null
  scheduling_notes: string | null
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
}: {
  center: FacilityEditProfileData
  location: FacilityLocationEditData | null
  email: string
  firstName: string
  lastName: string
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
  const [facilityPhone, setFacilityPhone] = useState(center.phone ?? '')

  const [directorFirstName, setDirectorFirstName] = useState(center.director_first_name ?? '')
  const [directorLastName, setDirectorLastName] = useState(center.director_last_name ?? '')
  const [directorEmail, setDirectorEmail] = useState(center.director_email ?? '')
  const [directorPhone, setDirectorPhone] = useState(center.director_phone ?? '')
  const [jobTitle, setJobTitle] = useState(center.director_job_title ?? '')
  const [contactMethod, setContactMethod] = useState(center.preferred_contact_method ?? '')

  const [preferredDays, setPreferredDays] = useState<string[]>(center.preferred_days ?? [])
  const [frequency, setFrequency] = useState(center.visit_frequency ?? '')
  const [preferredTime, setPreferredTime] = useState(center.preferred_time ?? '')
  const [performanceLocation, setPerformanceLocation] = useState(center.performance_location ?? '')
  const [preferredLength, setPreferredLength] = useState(center.preferred_length ?? '')
  const [notes, setNotes] = useState(center.scheduling_notes ?? '')

  const toggleDay = (day: string) =>
    setPreferredDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]))

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
      })
      .eq('id', center.id)

    if (centerError) {
      setError(centerError.message)
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
          phone: facilityPhone.trim() || null,
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
      </div>

      <EditProfileFooter onCancel={() => router.push('/dashboard/account')} saving={saving} error={error} />
    </form>
  )
}
