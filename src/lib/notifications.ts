/**
 * Sprint 4: Notification helpers for alerts and emails
 * 
 * Functions:
 * - createAlert: Insert in-app notification to alerts table
 * - trySendEmail: Check throttle and send email if allowed
 * - getRecipientEmail: Fetch email from auth.users
 */

import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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
}

/**
 * Create an in-app alert (notification)
 */
export async function createAlert(payload: AlertPayload) {
  const supabase = await createSupabaseServerClient()

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
 * Check if we should send an email (daily throttle)
 * Returns true if no email of this type was sent to user in past 24 hours
 */
export async function shouldSendEmail(
  userId: string,
  alertType: AlertType
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('notifications_log')
    .select('id')
    .eq('user_id', userId)
    .eq('alert_type', alertType)
    .gte('sent_at', twentyFourHoursAgo)
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
  const supabase = await createSupabaseServerClient()

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
  const supabase = await createSupabaseServerClient()

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

    // Always create in-app alert
    const alertCreated = await createAlert({
      userId: payload.userId,
      alertType: payload.alertType,
      title: payload.title,
      message: payload.message,
      relatedRequestId: payload.relatedRequestId,
    })
    console.log(`[notifyUser] Alert created=${alertCreated} for user=${payload.userId}`)

    // In-app alert is complete; email logging is optional.
    if (!payload.recipientEmail || !payload.subject || !payload.body) {
      console.log(`[notifyUser] Skipping email logging for user=${payload.userId}, type=${payload.alertType} (missing email metadata)`)
      return
    }

    // Check throttle for email
    const canSendEmail = await shouldSendEmail(payload.userId, payload.alertType)
    if (!canSendEmail) {
      console.log(`[notifyUser] Throttled email for user=${payload.userId}, type=${payload.alertType}`)
      return
    }

    // Log email send (mark it as sent even if actual delivery fails for now)
    const emailLogged = await logEmailSend({
      userId: payload.userId,
      alertType: payload.alertType,
      recipientEmail: payload.recipientEmail,
      subject: payload.subject,
      body: payload.body,
      relatedRequestId: payload.relatedRequestId,
    })
    console.log(`[notifyUser] Email logged=${emailLogged} for user=${payload.userId}`)

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
    })

    if (sendError) {
      // In-app alert and the log row already exist — a failed send here means
      // the user still sees it in-app, just not in their inbox.
      console.error(`[notifyUser] Resend send failed for user=${payload.userId}:`, sendError)
      return
    }

    console.log(`[notifyUser] Email sent for user=${payload.userId}, to=${payload.recipientEmail}`)
  } catch (e) {
    console.error(`[notifyUser] Error:`, e)
  }
}
