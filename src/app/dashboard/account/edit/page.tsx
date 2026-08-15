import { redirect } from 'next/navigation'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { MusicianEditProfile } from '@/components/mmm/edit-profile/musician-edit-profile'
import { FacilityEditProfile } from '@/components/mmm/edit-profile/facility-edit-profile'

export default async function EditProfilePage() {
  const role = await getCurrentUserRole()
  if (role !== 'musician' && role !== 'center_coordinator') redirect('/dashboard/account')

  const user = await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const reg = (meta.registration ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

  if (role === 'musician') {
    const { data: musician } = await supabase
      .from('musicians')
      .select(
        'id, first_name, last_name, name, bio, phone, zip_code, instruments, music_types, band_size_preference, general_available_days, travel_radius_miles, youtube_channel_url, profile_image_url, profile_complete',
      )
      .eq('user_id', user.id)
      .maybeSingle()

    // Not finished yet — that's the onboarding wizard's job (account-creation
    // step + Volunteer Agreement), not this edit-only page.
    if (!musician || !musician.profile_complete) redirect('/onboarding/musician')

    return (
      <MusicianEditProfile
        musician={musician}
        email={user.email ?? ''}
        registration={{
          years_of_experience: str(reg.years_of_experience),
          preferred_time: str(reg.preferred_time),
          availability_frequency: str(reg.availability_frequency),
          unavailable_dates: list(reg.unavailable_dates),
          availability_notes: str(reg.availability_notes),
        }}
      />
    )
  }

  const { data: center } = await supabase
    .from('centers')
    .select(
      'id, name, phone, website, director_first_name, director_last_name, director_email, director_phone, director_job_title, preferred_contact_method, preferred_days, visit_frequency, preferred_time, performance_location, preferred_length, scheduling_notes, profile_complete, about_description, established_year, community_type, highlights, testimonial_quote, testimonial_author, preferred_music_styles, preferred_performance_types',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!center || !center.profile_complete) redirect('/onboarding/center')

  const { data: location } = await supabase
    .from('center_locations')
    .select('id, address, zip_code')
    .eq('center_id', center.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  return (
    <FacilityEditProfile
      center={center}
      location={location ?? null}
      email={user.email ?? ''}
      firstName={str(meta.first_name)}
      lastName={str(meta.last_name)}
    />
  )
}
