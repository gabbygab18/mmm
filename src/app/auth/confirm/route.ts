import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Landing point for every link Supabase mails out — account confirmation,
 * e-mail-change confirmation, and magic links.
 *
 * Two link shapes reach here and both are handled, because which one arrives
 * depends on how the e-mail templates are written in the Supabase dashboard:
 *
 *   ?token_hash=…&type=signup   the templates rewritten to point straight here
 *                               (`{{ .SiteURL }}/auth/confirm?token_hash=…`),
 *                               which keeps the confirmation off Supabase's own
 *                               domain and out of link-scanner prefetches.
 *   ?code=…                     the stock `{{ .ConfirmationURL }}` template,
 *                               which bounces through Supabase's /verify first.
 *
 * Verifying on the server means the session cookie is set before the browser
 * renders anything, so the person lands signed in rather than on a flash of the
 * signed-out dashboard.
 *
 * Password recovery deliberately does NOT come through here — /reset-password
 * redeems its own code, because the person must choose a new password before
 * being sent anywhere.
 */

/** Only ever redirect within this site — `next` arrives from a URL. */
function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  // GoTrue sends the reason back on the query string when it rejects a link.
  const rejected = searchParams.get('error_description') ?? searchParams.get('error')
  if (rejected) {
    return NextResponse.redirect(new URL(`/verify-email?status=expired`, origin))
  }

  const supabase = await createSupabaseServerClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'email_change' | 'magiclink' | 'invite',
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(new URL(next, origin))
    return NextResponse.redirect(new URL('/verify-email?status=expired', origin))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
    return NextResponse.redirect(new URL('/verify-email?status=expired', origin))
  }

  return NextResponse.redirect(new URL('/verify-email?status=expired', origin))
}
