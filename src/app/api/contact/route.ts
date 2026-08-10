import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Contact form endpoint.
 *
 * Writes the inquiry to `contact_inquiries` so nothing is lost, then — mail
 * transport is wired up now (Resend, same as every other transactional e-mail
 * in the app) — sends the submitter a confirmation and forwards the inquiry to
 * the monitored inbox, so a submission isn't just a row nobody reads.
 * If TURNSTILE_SECRET_KEY is configured the token is verified server-side
 * before anything is stored.
 */

const INQUIRY_TYPES = new Set(['volunteer', 'facility'])

const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS
  ? `Margaret’s MemoryCare Music <${process.env.EMAIL_FROM_ADDRESS}>`
  : null
const ADMIN_INBOX = process.env.EMAIL_REPLY_TO || undefined
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendContactEmails(inquiry: {
  inquiryType: string
  fullName: string
  email: string
  phone: string
  message: string
}) {
  if (!resend || !EMAIL_FROM) return

  await resend.emails.send({
    from: EMAIL_FROM,
    to: inquiry.email,
    subject: "We received your message — Margaret's MemoryCare Music",
    text: `Hi ${inquiry.fullName},\n\nThanks for reaching out to Margaret's MemoryCare Music. We've received your ${inquiry.inquiryType === 'facility' ? 'facility' : 'volunteer'} inquiry and will be in touch within two business days.\n\nYour message:\n${inquiry.message}\n\n— Margaret's MemoryCare Music`,
  }).catch((e) => console.error('[contact] confirmation email failed', e))

  if (!ADMIN_INBOX) return

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_INBOX,
    replyTo: inquiry.email,
    subject: `New ${inquiry.inquiryType} inquiry from ${inquiry.fullName}`,
    text: `Type: ${inquiry.inquiryType}\nName: ${inquiry.fullName}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || '(not provided)'}\n\nMessage:\n${inquiry.message}`,
  }).catch((e) => console.error('[contact] admin notification email failed', e))
}

async function verifyTurnstile(token: string | null, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // Not configured yet — client-side checks still apply.
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip ?? undefined }),
    })
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const inquiryType = String(body.inquiry_type ?? '')
  const fullName = String(body.full_name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const message = String(body.message ?? '').trim()
  const token = body.verification_token ? String(body.verification_token) : null

  if (!INQUIRY_TYPES.has(inquiryType)) {
    return NextResponse.json({ error: 'Please choose an inquiry type.' }, { status: 400 })
  }
  if (!fullName || !email || !message) {
    return NextResponse.json({ error: 'Name, e-mail address, and message are required.' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid e-mail address.' }, { status: 400 })
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }
  // contact_inquiries.phone is varchar(40) — reject rather than let a long
  // paste silently fail the whole insert (nothing stored, no e-mails sent).
  if (phone.length > 40) {
    return NextResponse.json({ error: 'Phone number is too long.' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  if (!(await verifyTurnstile(token, ip))) {
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('contact_inquiries').insert({
    inquiry_type: inquiryType,
    full_name: fullName,
    email,
    phone: phone || null,
    message,
  })

  if (error) {
    console.error('[contact] failed to store inquiry', error)
    return NextResponse.json({ error: 'Could not send the message.' }, { status: 500 })
  }

  await sendContactEmails({ inquiryType, fullName, email, phone, message })

  return NextResponse.json({ ok: true })
}
