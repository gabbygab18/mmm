'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth-shell'
import { friendlyResetError } from '@/lib/mmm/auth-errors'

/**
 * Forgot password — step one of two.
 *
 * Sends the Supabase recovery e-mail, which lands the person on
 * /reset-password with a one-time code. The confirmation deliberately does not
 * say whether an account exists for the address: that would turn this form into
 * a way of testing which of our members' e-mails are registered. Supabase
 * itself returns success for unknown addresses for the same reason.
 */

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 disabled:cursor-not-allowed disabled:bg-stone-100 lg:text-[10.7px]'
const labelClass = 'block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(friendlyResetError(resetError.message))
        setLoading(false)
        return
      }

      setSent(true)
      setLoading(false)
    } catch (err) {
      setError(friendlyResetError(err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
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
        Forgot your password?
      </h1>
      <p className="mt-2 font-poppins text-[8.9px] text-ocean-900/80 lg:text-[13.8px]">
        Enter the e-mail address on your account and we&apos;ll send you a link to choose a new password.
      </p>

      {sent ? (
        <>
          <div className="mt-7 rounded-xl border border-green-300 bg-green-50 px-4 py-3 font-poppins text-[8.3px] font-medium leading-relaxed text-green-800 lg:text-[10.7px]">
            If an account exists for <span className="font-bold">{email.trim()}</span>, a reset link is on its way. The
            link is good for one hour — check your spam folder if it hasn&apos;t arrived in a few minutes.
          </div>
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setError(null)
            }}
            className="mt-5 block w-full text-center font-poppins text-[8.3px] font-bold text-ocean-700 underline-offset-2 transition hover:text-ocean-600 hover:underline lg:text-[10.7px]"
          >
            Use a different e-mail address
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className={labelClass}>
            E-mail Address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
              autoComplete="email"
              className={inputClass}
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-red-700 lg:text-[10.7px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mx-auto block rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-12 py-3 font-poppins text-[13.1px] font-bold uppercase tracking-[0.2em] text-white shadow-lg lg:text-[17px] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-5 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-[10.7px]">
        Remembered it?{' '}
        <Link href="/login" className="font-bold text-ocean-700 transition hover:text-ocean-600">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
