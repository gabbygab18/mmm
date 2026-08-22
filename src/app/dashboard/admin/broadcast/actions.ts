'use server'

import { Resend } from 'resend'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildBroadcastEmailHtml } from '@/lib/email-template'

/**
 * Admin mass e-mail — one message to every registered musician, every
 * registered facility, or both.
 *
 * Three rules this enforces, none of which are optional:
 *
 *  1. Recipients who turned e-mail notifications off are excluded. That
 *     toggle exists precisely for this kind of message, and ignoring it is
 *     both a trust problem and, for bulk mail, a legal one.
 *  2. Deleted accounts are excluded. Their address is rewritten to
 *     deleted-<id>@deleted.invalid on deletion, so mailing them guarantees a
 *     hard bounce, and bounces are what wreck a sending domain's reputation.
 *  3. Every recipient gets their own message. No BCC pile: it leaks the
 *     member list to anyone who looks at the headers, and large BCC blocks
 *     are a spam signal in their own right.
 */

export type BroadcastAudience = 'musician' | 'center_coordinator'

export type BroadcastResult =
  | { ok: true; recipientCount: number; sentCount: number; failedCount: number }
  | { ok: false; error: string }

const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS
  ? `Margaret’s MemoryCare Music <${process.env.EMAIL_FROM_ADDRESS}>`
  : null
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/** Resend accepts up to 100 messages per batch call. */
const BATCH_SIZE = 100

type Recipient = { id: string; email: string }

/**
 * Everyone who should receive a broadcast for the chosen audiences.
 *
 * Service-role, because this deliberately reads across every user — no admin
 * has RLS visibility of the whole membership, and that is the point of the
 * feature.
 */
async function resolveRecipients(audiences: BroadcastAudience[]): Promise<Recipient[]> {
  const supabase = createSupabaseAdminClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, email_notifications_enabled, role')
    .in('role', audiences)

  if (error) {
    console.error('[broadcast] could not load recipients:', error.message)
    return []
  }

  // Deleted accounts keep their profile row (event history references it) but
  // their auth address is retired, so they have to be filtered out by hand.
  const [{ data: deletedMusicians }, { data: deletedCenters }] = await Promise.all([
    supabase.from('musicians').select('user_id').not('deleted_at', 'is', null),
    supabase.from('centers').select('user_id').not('deleted_at', 'is', null),
  ])

  const deletedUserIds = new Set([
    ...(deletedMusicians ?? []).map((r) => r.user_id),
    ...(deletedCenters ?? []).map((r) => r.user_id),
  ])

  return (users ?? [])
    .filter((u) => u.email_notifications_enabled !== false)
    .filter((u) => !deletedUserIds.has(u.id))
    .filter((u) => Boolean(u.email) && !u.email.endsWith('@deleted.invalid'))
    .map((u) => ({ id: u.id, email: u.email }))
}

/** How many people a broadcast would actually reach, for the confirm step. */
export async function countBroadcastRecipientsAction(
  audiences: BroadcastAudience[],
): Promise<{ count: number }> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return { count: 0 }
  if (audiences.length === 0) return { count: 0 }

  const recipients = await resolveRecipients(audiences)
  return { count: recipients.length }
}

export async function sendBroadcastAction(
  audiences: BroadcastAudience[],
  subject: string,
  body: string,
): Promise<BroadcastResult> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return { ok: false, error: 'Only admins can send broadcasts.' }

  const user = await requireAuthenticatedUser()

  const trimmedSubject = subject.trim()
  const trimmedBody = body.trim()

  if (audiences.length === 0) return { ok: false, error: 'Choose at least one audience.' }
  if (!trimmedSubject) return { ok: false, error: 'Add a subject line.' }
  if (!trimmedBody) return { ok: false, error: 'Add a message.' }

  if (!resend || !EMAIL_FROM) {
    return { ok: false, error: 'E-mail sending is not configured on this environment.' }
  }

  const recipients = await resolveRecipients(audiences)
  if (recipients.length === 0) {
    return { ok: false, error: 'No eligible recipients — everyone in that audience has e-mail notifications turned off, or the audience is empty.' }
  }

  const html = buildBroadcastEmailHtml(trimmedBody)

  let sentCount = 0
  let failedCount = 0

  // One message per person, batched only to stay inside Resend's per-call
  // limit — each still addresses a single recipient.
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE)

    try {
      const { data, error } = await resend.batch.send(
        chunk.map((r) => ({
          from: EMAIL_FROM,
          to: r.email,
          replyTo: EMAIL_REPLY_TO,
          subject: trimmedSubject,
          text: trimmedBody,
          html,
        })),
      )

      if (error) {
        console.error('[broadcast] batch rejected:', error)
        failedCount += chunk.length
      } else {
        sentCount += data?.data?.length ?? chunk.length
      }
    } catch (e) {
      // One bad batch must not abandon the rest of the list.
      console.error('[broadcast] batch threw:', e)
      failedCount += chunk.length
    }
  }

  const supabase = createSupabaseAdminClient()

  await supabase.from('broadcasts').insert({
    sent_by_user_id: user.id,
    audiences,
    subject: trimmedSubject,
    body: trimmedBody,
    recipient_count: recipients.length,
    sent_count: sentCount,
    failed_count: failedCount,
  })

  // Per-recipient rows too, so a broadcast shows up in the same log as every
  // other e-mail this platform sends rather than being invisible there.
  if (sentCount > 0) {
    await supabase.from('notifications_log').insert(
      recipients.map((r) => ({
        user_id: r.id,
        email_to: r.email,
        alert_type: 'admin_broadcast' as const,
        subject: trimmedSubject,
        body: trimmedBody,
        bounce_status: 'sent',
      })),
    )
  }

  return { ok: true, recipientCount: recipients.length, sentCount, failedCount }
}
