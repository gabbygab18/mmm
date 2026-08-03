'use server'

import { requireAuthenticatedUser } from '@/lib/auth'
import { notifyUser, getRecipientEmail } from '@/lib/notifications'

/**
 * "We received your application" email — fired once, right after signup,
 * before admin approval. Auth-gated to the caller's own account: server
 * actions are public endpoints, and without this check anyone could pass an
 * arbitrary userId/email to spam mail through our Resend quota.
 *
 * Only reachable when signUp returned a session (no e-mail confirmation
 * pending) — see the call sites in musician-wizard.tsx / facility-wizard.tsx.
 */
export async function notifyApplicationReceivedAction(
  userId: string,
  name: string,
  kind: 'musician' | 'facility',
) {
  const user = await requireAuthenticatedUser()
  if (user.id !== userId) return

  const isMusician = kind === 'musician'
  const recipientEmail = await getRecipientEmail(userId)

  await notifyUser({
    userId,
    alertType: 'application_received',
    title: 'Application received!',
    message: isMusician
      ? "We've received your musician application — it's now being reviewed."
      : "We've received your facility registration — it's now being reviewed.",
    recipientEmail,
    subject: "We've received your application — Margaret's MemoryCare Music",
    body: isMusician
      ? `Hi ${name},\n\nThanks for registering as a volunteer musician with Margaret's Memorycare Music. Your application is currently being reviewed by our team.\n\nWe'll email you again as soon as it's approved so you can start receiving performance requests.\n\n— Margaret's MemoryCare Music`
      : `Hi ${name},\n\nThanks for registering your memory care community with Margaret's Memorycare Music. Your registration is currently being reviewed by our team.\n\nWe'll email you again as soon as it's approved so you can start receiving performance offers.\n\n— Margaret's MemoryCare Music`,
  })
}
