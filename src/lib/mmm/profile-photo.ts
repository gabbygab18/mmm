import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Profile photo picking + uploading.
 *
 * Bytes live in the `profile-images` Storage bucket (see
 * supabase/migrations/20260730090000_profile_images_storage.sql) under
 * `<auth user id>/…`, which is what the bucket's owner policies key on. The
 * resulting public URL is what goes into `musicians.profile_image_url` /
 * `centers.profile_image_url`.
 */

export const PROFILE_IMAGE_BUCKET = 'profile-images'
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png'] as const
export const ACCEPT_ATTRIBUTE = ACCEPTED_PHOTO_TYPES.join(',')
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/** Returns a human-readable problem with the file, or null when it's fine. */
export function validatePhoto(file: File): string | null {
  if (!(ACCEPTED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return 'Please choose a JPG or PNG image.'
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return `That image is ${mb} MB — please choose one under 5 MB.`
  }
  if (file.size === 0) return 'That file appears to be empty. Please choose another image.'
  return null
}

export type PhotoUploadResult = { url: string; error?: undefined } | { url?: undefined; error: string }

/**
 * Uploads the photo for `userId` and returns its public URL. Requires a signed-in
 * session — the bucket's insert policy checks `auth.uid()` against the folder.
 */
export async function uploadProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<PhotoUploadResult> {
  const problem = validatePhoto(file)
  if (problem) return { error: problem }

  const extension = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/profile-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(path)
  if (!data?.publicUrl) return { error: 'The photo uploaded but no public link came back.' }
  return { url: data.publicUrl }
}

/** Musicians own their photo on `musicians`, coordinators on `centers`. */
export type ProfileTable = 'musicians' | 'centers'

/**
 * Uploads and attaches a photo to the signed-in user's own profile row.
 * `null` clears it. Reports the "no profile row yet" case rather than reporting
 * success for an update that matched nothing.
 */
export async function saveProfilePhoto(
  supabase: SupabaseClient,
  table: ProfileTable,
  file: File | null,
): Promise<{ url: string | null; error?: undefined } | { url?: undefined; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session has expired — please sign in again.' }

  let nextUrl: string | null = null
  if (file) {
    const upload = await uploadProfilePhoto(supabase, user.id, file)
    if (!upload.url) return { error: upload.error ?? 'The photo could not be uploaded. Please try again.' }
    nextUrl = upload.url
  }

  const { data: rows, error } = await supabase
    .from(table)
    .update({ profile_image_url: nextUrl })
    .eq('user_id', user.id)
    .select('user_id')

  if (error) return { error: error.message }
  if (!rows || rows.length === 0) {
    return { error: 'Your profile is not set up yet — finish setting up your profile, then add the photo there.' }
  }
  return { url: nextUrl }
}
