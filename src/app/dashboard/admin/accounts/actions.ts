'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Approve / disable an account, shared by the Musicians and Facilities screens.
 *
 * `approved` is the same column the all-in-one console has always toggled, so
 * the two screens and the oversight page stay in agreement — this is a second
 * door onto one switch, not a second switch.
 */
async function setApproved(table: 'musicians' | 'centers', id: string, approved: boolean) {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return

  const supabase = await createSupabaseServerClient()
  await supabase.from(table).update({ approved }).eq('id', id)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/musicians')
  revalidatePath('/dashboard/admin/facilities')
  revalidatePath('/dashboard/admin/oversight')
  revalidatePath('/dashboard/admin/reports')
}

export async function toggleMusicianApprovalAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  // The form carries the current state; the button flips it.
  const approved = String(formData.get('approved') ?? '') === 'true'
  if (id) await setApproved('musicians', id, !approved)
}

export async function toggleCenterApprovalAction(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const approved = String(formData.get('approved') ?? '') === 'true'
  if (id) await setApproved('centers', id, !approved)
}
