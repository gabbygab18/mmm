'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

async function ownCenterId(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('centers').select('id').eq('user_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function addCenterNoteAction(formData: FormData) {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') return

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return
  const body = String(formData.get('body') ?? '').trim()

  const user = await requireAuthenticatedUser()
  const centerId = await ownCenterId(user.id)
  if (!centerId) return

  const supabase = await createSupabaseServerClient()
  await supabase.from('center_notes').insert({
    center_id: centerId,
    created_by_user_id: user.id,
    title,
    body: body || null,
  })

  revalidatePath('/dashboard/center')
}

export async function deleteCenterNoteAction(formData: FormData) {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') return

  const noteId = String(formData.get('noteId') ?? '')
  if (!noteId) return

  const supabase = await createSupabaseServerClient()
  await supabase.from('center_notes').delete().eq('id', noteId)

  revalidatePath('/dashboard/center')
}

export async function toggleFavoriteMusicianAction(formData: FormData) {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') return

  const musicianId = String(formData.get('musicianId') ?? '')
  const favorited = String(formData.get('favorited') ?? '') === 'true'
  if (!musicianId) return

  const user = await requireAuthenticatedUser()
  const centerId = await ownCenterId(user.id)
  if (!centerId) return

  const supabase = await createSupabaseServerClient()

  if (favorited) {
    await supabase.from('center_favorite_musicians').delete().eq('center_id', centerId).eq('musician_id', musicianId)
  } else {
    await supabase.from('center_favorite_musicians').insert({ center_id: centerId, musician_id: musicianId })
  }

  revalidatePath('/dashboard/center')
  revalidatePath('/dashboard/center/locations')
}
