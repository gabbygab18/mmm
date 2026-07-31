'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth-shell'
import { friendlyAuthError } from '@/lib/mmm/auth-errors'

/**
 * "Confirm your e-mail" — where someone waits between signing up and clicking
 * the link in their inbox, and where an expired link sends them back to.
 *
 * The address is carried on the query string rather than read from a session:
 * with confirmation switched on, signUp deliberately leaves no session, so
 * there is nothing to read it from until the link is clicked.
 */

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [expired, setExpired] = useState(false)
  const [sending, setSending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setEmail(params.get('email') ?? '')
    setExpired(params.get('status') === 'expired')
  }, [])

  const resend = async () => {
    setSending(true)
    setError(null)
    setResent(false)

    const supabase = createSupabaseBrowserClient()
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() })

    if (resendError) {
      setError(friendlyAuthError(resendError.message))
    } else {
      setResent(true)
    }
    setSending(false)
  }

  return (
    <AuthShell
      photoSrc="/landing/hero.jpg"
      photoAlt="A volunteer musician performing for smiling memory care residents"
      photoPositionDesktop="center 70%"
      mobilePhotoHeightClassName="h-60 sm:h-80"
      asideOverlapClassName="-mt-9 sm:-mt-12"
      asideDesktopClassName="lg:self-end lg:justify-self-end lg:pb-16"
      aside={
        <div className="text-center lg:text-left">
          <blockquote className="font-poppins text-[10.9px] font-medium italic leading-snug text-white drop-shadow-md sm:text-lg lg:text-[22.2px]">
            &ldquo; Music touches parts of the mind that nothing else can reach&rdquo;
          </blockquote>
          <p className="mt-2 font-poppins text-[8.7px] italic text-white/90 drop-shadow sm:text-sm lg:mt-4 lg:text-[17.8px]">
            -Memory care community
          </p>
        </div>
      }
    >
      <h1 className="font-garamond text-[24.3px] font-bold leading-tight text-ocean-900 lg:text-[37.7px]">
        {expired ? 'That link has expired' : 'Confirm your e-mail'}
      </h1>

      {expired ? (
        <p className="mt-2 font-poppins text-[8.9px] leading-relaxed text-ocean-900/80 lg:text-[13.8px]">
          Confirmation links are good for 24 hours and can only be used once. Enter your e-mail address below and
          we&apos;ll send a fresh one.
        </p>
      ) : (
        <p className="mt-2 font-poppins text-[8.9px] leading-relaxed text-ocean-900/80 lg:text-[13.8px]">
          We&apos;ve sent a confirmation link{email ? ' to ' : ''}
          {email && <span className="font-bold text-ocean-900">{email}</span>}. Click it to activate your account — then
          you can sign in. Check your spam folder if it hasn&apos;t arrived in a few minutes.
        </p>
      )}

      <div className="mt-7 space-y-5">
        <label className="block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">
          E-mail Address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={sending}
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 disabled:cursor-not-allowed disabled:bg-stone-100 lg:text-[10.7px]"
          />
        </label>

        {resent && (
          <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-green-800 lg:text-[10.7px]">
            A new confirmation link is on its way.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-red-700 lg:text-[10.7px]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={resend}
          disabled={sending || !email.trim()}
          className="mx-auto block rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-12 py-3 font-poppins text-[13.1px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 lg:text-[17px]"
        >
          {sending ? 'Sending…' : 'Resend link'}
        </button>
      </div>

      <p className="mt-5 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-[10.7px]">
        Already confirmed?{' '}
        <Link href="/login" className="font-bold text-ocean-700 transition hover:text-ocean-600">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
