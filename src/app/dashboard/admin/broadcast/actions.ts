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
  | { ok: true; recipientCount: number; sentCount: number; failedCount: number; skippedCount: number }
  | { ok: false; error: string }

/**
 * Addresses that can never receive mail.
 *
 * example.com and friends are reserved by RFC 2606 for documentation, and
 * Resend rejects them outright — with a 422 that fails the WHOLE batch, not
 * just the offending address. Several seeded test accounts use them, which is
 * why an early broadcast reported 0 of 10 delivered: five example.com rows
 * poisoned every batch they appeared in.
 *
 * Filtering them here means the real recipients get their mail, and the count
 * shown to the admin reflects who can actually be reached.
 */
const UNROUTABLE_DOMAINS = ['example.com', 'example.org', 'example.net', 'test.com', 'invalid', 'local', 'localhost', 'test']

function isUnroutableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return true
  return UNROUTABLE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))
}

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
async function resolveRecipients(
  audiences: BroadcastAudience[],
): Promise<{ recipients: Recipient[]; skipped: number }> {
  const supabase = createSupabaseAdminClient()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, email_notifications_enabled, role')
    .in('role', audiences)

  if (error) {
    console.error('[broadcast] could not load recipients:', error.message)
    return { recipients: [], skipped: 0 }
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

  const eligible = (users ?? [])
    .filter((u) => u.email_notifications_enabled !== false)
    .filter((u) => !deletedUserIds.has(u.id))
    .filter((u) => Boolean(u.email))

  const recipients = eligible
    .filter((u) => !isUnroutableEmail(u.email))
    .map((u) => ({ id: u.id, email: u.email }))

  return { recipients, skipped: eligible.length - recipients.length }
}

/**
 * Single send, used as the fallback when a batch is rejected wholesale.
 * Returns whether it went out, so the caller can count accurately instead of
 * assuming the whole chunk failed.
 */
async function sendOne(recipient: Recipient, subject: string, text: string, html: string): Promise<boolean> {
  if (!resend || !EMAIL_FROM) return false
  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipient.email,
      replyTo: EMAIL_REPLY_TO,
      subject,
      text,
      html,
    })
    if (error) {
      console.error(`[broadcast] send failed for ${recipient.email}:`, error)
      return false
    }
    return true
  } catch (e) {
    console.error(`[broadcast] send threw for ${recipient.email}:`, e)
    return false
  }
}

/** How many people a broadcast would actually reach, for the confirm step. */
export async function countBroadcastRecipientsAction(
  audiences: BroadcastAudience[],
): Promise<{ count: number }> {
  const role = await getCurrentUserRole()
  if (role !== 'admin') return { count: 0 }
  if (audiences.length === 0) return { count: 0 }

  const { recipients } = await resolveRecipients(audiences)
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

  const { recipients, skipped } = await resolveRecipients(audiences)
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
        // A batch is all-or-nothing: Resend rejects the entire call if any one
        // address offends it, so a single bad row would otherwise cost
        // everyone in the chunk their mail. Fall back to sending one at a time
        // so the good addresses still get through and only the genuinely
        // undeliverable ones are counted as failures.
        console.error('[broadcast] batch rejected, retrying individually:', error)
        const outcomes = await Promise.all(chunk.map((r) => sendOne(r, trimmedSubject, trimmedBody, html)))
        sentCount += outcomes.filter(Boolean).length
        failedCount += outcomes.filter((ok) => !ok).length
      } else {
        sentCount += data?.data?.length ?? chunk.length
      }
    } catch (e) {
      // One bad batch must not abandon the rest of the list.
      console.error('[broadcast] batch threw, retrying individually:', e)
      const outcomes = await Promise.all(chunk.map((r) => sendOne(r, trimmedSubject, trimmedBody, html)))
      sentCount += outcomes.filter(Boolean).length
      failedCount += outcomes.filter((ok) => !ok).length
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

  return { ok: true, recipientCount: recipients.length, sentCount, failedCount, skippedCount: skipped }
}
