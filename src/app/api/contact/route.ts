import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Contact form endpoint.
 *
 * Writes the inquiry to `contact_inquiries` so nothing is lost while the
 * outbound mail transport is being provisioned; admins can read the table from
 * the dashboard. If TURNSTILE_SECRET_KEY is configured the token is verified
 * server-side before anything is stored.
 */

const INQUIRY_TYPES = new Set(['volunteer', 'facility'])

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

  return NextResponse.json({ ok: true })
}
