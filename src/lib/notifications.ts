/**
 * Sprint 4: Notification helpers for alerts and emails
 * 
 * Functions:
 * - createAlert: Insert in-app notification to alerts table
 * - trySendEmail: Check throttle and send email if allowed
 * - getRecipientEmail: Fetch email from auth.users
 */

import { Resend } from 'resend'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from './supabase/types'

// Provisioned in Vercel (Production + Preview) alongside RESEND_API_KEY —
// the verified sending address lives there, not hardcoded here, since it
// depends on whichever domain is actually verified in Resend.
const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS
  ? `Margaret’s MemoryCare Music <${process.env.EMAIL_FROM_ADDRESS}>`
  : null
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || undefined

// Lazy: constructing Resend without a key throws, and this module loads even
// in environments (local dev, tests) that never send mail.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type AlertType = Database['public']['Enums']['alert_type']
export type RequestStatus = Database['public']['Enums']['request_status']

interface AlertPayload {
  userId: string
  alertType: AlertType
  title: string
  message: string
  relatedRequestId?: string
}

interface EmailPayload {
  userId: string
  alertType: AlertType
  recipientEmail: string
  subject: string
  body: string
  relatedRequestId?: string
}

interface NotifyPayload extends AlertPayload {
  recipientEmail?: string | null
  subject?: string
  body?: string
  /** Rich version of `body` — e.g. the request-journey checklist. Falls back
      to plain-text `body` when omitted. */
  html?: string
  /** Skip the in-app alert insert — for alert types a DB trigger already
      creates the alert for (request_initiated, proposal_suggested), so this
      only needs to run the email side without inserting a duplicate row. */
  skipInAppAlert?: boolean
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Where a request/performance is in its lifecycle, for the step checklist
    appended to journey emails. The two "cancelled" variants exist because
    cancelling before vs. after acceptance leaves a different number of
    earlier steps checked off. */
export type RequestJourneyStage =
  | 'sent'
  | 'accepted'
  | 'completed'
  | 'cancelled_before_accept'
  | 'cancelled_after_accept'

const JOURNEY_STEPS = ['Request sent', 'Accepted & scheduled', 'Performance completed']

function renderJourneyStepsHtml(stage: RequestJourneyStage): string {
  const isCancelled = stage === 'cancelled_before_accept' || stage === 'cancelled_after_accept'
  const completedCount =
    stage === 'sent' || stage === 'cancelled_before_accept' ? 1 : stage === 'accepted' || stage === 'cancelled_after_accept' ? 2 : 3

  const items = JOURNEY_STEPS.map((label, index) => {
    const done = index + 1 <= completedCount
    const style = done ? 'text-decoration: line-through; color: #6b7280;' : 'color: #0f2a4a;'
    const marker = done ? '✓' : '○'
    return `<li style="margin: 4px 0; ${style}"><span style="display: inline-block; width: 18px;">${marker}</span>${escapeHtml(label)}</li>`
  }).join('')

  const cancelledLine = isCancelled
    ? `<li style="margin: 4px 0; color: #b91c1c; font-weight: 600;"><span style="display: inline-block; width: 18px;">✕</span>Cancelled</li>`
    : ''

  return `<ul style="list-style: none; padding: 0; margin: 16px 0; font-family: sans-serif; font-size: 14px;">${items}${cancelledLine}</ul>`
}

/**
 * Wraps a plain-text email body plus a request-journey checklist into HTML —
 * completed steps render struck through, so the recipient can see at a
 * glance where things stand (sent → accepted & scheduled → completed, or
 * cancelled partway through).
 */
export function buildRequestJourneyEmailHtml(bodyText: string, stage: RequestJourneyStage): string {
  const paragraphs = bodyText
    .split('\n\n')
    .map((para) => `<p style="margin: 0 0 12px 0;">${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const content = `<div style="font-family: sans-serif; color: #0f2a4a; font-size: 14px; line-height: 1.5;">${paragraphs}<p style="margin: 16px 0 4px 0; font-weight: 600;">Request status:</p>${renderJourneyStepsHtml(stage)}</div>`

  // Full document, not a bare <div> — some spam filters and mail clients
  // penalize HTML email bodies missing a doctype/head, which the fragment
  // version sent.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Margaret's MemoryCare Music</title></head><body style="margin: 0; padding: 24px; background: #f5f5f0;">${content}</body></html>`
}

/**
 * Create an in-app alert (notification)
 */
export async function createAlert(payload: AlertPayload) {
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.rpc('create_alert_for_user', {
    p_user_id: payload.userId,
    p_alert_type: payload.alertType,
    p_title: payload.title,
    p_message: payload.message,
    p_related_request_id: payload.relatedRequestId || null,
  })

  if (error) {
    console.error('[createAlert] Error creating alert via RPC:', error)
    return false
  }

  console.log('[createAlert] Success:', { payload })
  return true
}

/**
 * Check if we should send an email.
 *
 * No time-based throttle — every distinct account event should reach the
 * user. The only thing blocked is an exact re-send of the same
 * (user, type, request) triple, so a duplicate trigger firing twice for the
 * same request doesn't double-email. Account-level events (no
 * relatedRequestId — approval, confirmation, password change, etc.) always
 * send.
 */
export async function shouldSendEmail(
  userId: string,
  alertType: AlertType,
  relatedRequestId?: string,
): Promise<boolean> {
  if (!relatedRequestId) return true

  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('notifications_log')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type', alertType)
    .eq('related_request_id', relatedRequestId)
    .limit(1)

  if (error) {
    console.error('[shouldSendEmail] Error querying notifications_log:', error)
    return false // Don't send if we can't check throttle
  }

  return data.length === 0
}

/**
 * Log an email send in notifications_log (for throttling)
 */
export async function logEmailSend(payload: EmailPayload) {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.from('notifications_log').insert({
    user_id: payload.userId,
    email_to: payload.recipientEmail,
    alert_type: payload.alertType,
    subject: payload.subject,
    body: payload.body,
    related_request_id: payload.relatedRequestId || null,
    bounce_status: 'sent',
  })

  if (error) {
    console.error('[logEmailSend] Error logging to notifications_log:', error)
    return false
  }

  console.log('[logEmailSend] Success:', { recipientEmail: payload.recipientEmail, alertType: payload.alertType })
  return true
}

/**
 * Get recipient's email from auth.users (requires admin access or service role)
 */
export async function getRecipientEmail(userId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[getRecipientEmail] Error fetching email for user:', userId, error)
    return null
  }

  if (!data) {
    console.error('[getRecipientEmail] No user found with id:', userId)
    return null
  }

  console.log('[getRecipientEmail] Found email:', data.email)
  return data.email
}

/**
 * Main: Create alert and send email if allowed
 * Wraps: createAlert + shouldSendEmail + logEmailSend
 */
export async function notifyUser(payload: NotifyPayload) {
  try {
    console.log(`[notifyUser] Starting notification for user=${payload.userId}, type=${payload.alertType}`)

    // Create the in-app alert, unless a DB trigger already creates one for
    // this event (request_initiated / proposal_suggested) — doing both
    // doubled up the alert every time either of those fired.
    if (!payload.skipInAppAlert) {
      const alertCreated = await createAlert({
        userId: payload.userId,
        alertType: payload.alertType,
        title: payload.title,
        message: payload.message,
        relatedRequestId: payload.relatedRequestId,
      })
      console.log(`[notifyUser] Alert created=${alertCreated} for user=${payload.userId}`)
    }

    // In-app alert is complete; email logging is optional.
    if (!payload.recipientEmail || !payload.subject || !payload.body) {
      console.log(`[notifyUser] Skipping email logging for user=${payload.userId}, type=${payload.alertType} (missing email metadata)`)
      return
    }

    // Check throttle for email
    const canSendEmail = await shouldSendEmail(payload.userId, payload.alertType, payload.relatedRequestId)
    if (!canSendEmail) {
      console.log(`[notifyUser] Throttled email for user=${payload.userId}, type=${payload.alertType}`)
      return
    }

    if (!resend || !EMAIL_FROM) {
      console.log(`[notifyUser] RESEND_API_KEY or EMAIL_FROM_ADDRESS not set — skipping actual send to ${payload.recipientEmail}`)
      return
    }

    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: payload.recipientEmail,
      replyTo: EMAIL_REPLY_TO,
      subject: payload.subject,
      text: payload.body,
      ...(payload.html ? { html: payload.html } : {}),
    })

    if (sendError) {
      // Deliberately NOT logged to notifications_log. That table doubles as
      // the de-duplication ledger (shouldSendEmail treats any row for the
      // same user/type/request as "already sent"), so writing a row here
      // would make one transient Resend failure permanently suppress this
      // notification — it could never be retried. Leaving it unlogged means
      // a later retry can still get through. The in-app alert already exists
      // either way, so the user is not left with nothing.
      console.error(`[notifyUser] Resend send failed for user=${payload.userId}:`, sendError)
      return
    }

    // Logged only after Resend has accepted the message, so the ledger
    // records real sends rather than attempts.
    const emailLogged = await logEmailSend({
      userId: payload.userId,
      alertType: payload.alertType,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      relatedRequestId: payload.relatedRequestId,
    })
    console.log(`[notifyUser] Email sent for user=${payload.userId}, to=${payload.recipientEmail}, logged=${emailLogged}`)
  } catch (e) {
    console.error(`[notifyUser] Error:`, e)
  }
}
