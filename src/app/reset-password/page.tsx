'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth-shell'
import { friendlyResetError, RESET_LINK_EXPIRED } from '@/lib/mmm/auth-errors'

/**
 * Reset password — step two, where the recovery link lands.
 *
 * The link carries a one-time code. supabase-js picks it up out of the URL on
 * its own when it can, so the session is waited for rather than demanded: the
 * listener below settles the moment one appears, and the manual exchange only
 * runs if the client reports no session and a code is still sitting unspent in
 * the query string.
 *
 * The session that a recovery link opens is a real one, so once the new
 * password is saved the person is already signed in and goes straight on.
 */

const MIN_PASSWORD_LENGTH = 8

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 disabled:cursor-not-allowed disabled:bg-stone-100 lg:text-[10.7px]'
const labelClass = 'block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]'

type Stage = 'checking' | 'ready' | 'invalid' | 'saved'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('checking')
  const [linkError, setLinkError] = useState<string>(RESET_LINK_EXPIRED)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let active = true
    let settled = false

    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    const param = (name: string) => url.searchParams.get(name) ?? hashParams.get(name)

    // GoTrue bounces a spent or timed-out link back with the reason attached,
    // so that is read before anything else is attempted.
    const rejected = param('error_description') ?? param('error')
    if (rejected) {
      setLinkError(friendlyResetError(rejected))
      setStage('invalid')
      return
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || settled) return

      if (session) {
        settled = true
        setStage('ready')
        return
      }

      // INITIAL_SESSION fires as soon as we subscribe and reports what the
      // client already has. No session at that point means the code in the URL
      // has not been redeemed, so it is redeemed here. Deferred out of the
      // callback because it runs while the auth lock is held.
      if (event === 'INITIAL_SESSION') {
        const code = param('code')
        if (!code) {
          setStage('invalid')
          return
        }

        setTimeout(async () => {
          if (!active || settled) return
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (!active || settled) return
          settled = true
          if (exchangeError) {
            setLinkError(friendlyResetError(exchangeError.message))
            setStage('invalid')
          } else {
            setStage('ready')
          }
        }, 0)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Please choose a password with at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Those two passwords do not match.')
      return
    }

    setSaving(true)
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(friendlyResetError(updateError.message))
      setSaving(false)
      return
    }

    setStage('saved')
    setSaving(false)
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
        {stage === 'saved' ? 'Password updated' : 'Choose a new password'}
      </h1>

      {stage === 'checking' && (
        <p className="mt-4 font-poppins text-[8.9px] text-ocean-900/80 lg:text-[13.8px]">Checking your reset link…</p>
      )}

      {stage === 'invalid' && (
        <>
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-[8.3px] font-medium leading-relaxed text-red-700 lg:text-[10.7px]">
            {linkError}
          </div>
          <Link
            href="/forgot-password"
            className="mx-auto mt-7 block w-fit rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-12 py-3 font-poppins text-[13.1px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream lg:text-[17px]"
          >
            Request a new link
          </Link>
        </>
      )}

      {stage === 'saved' && (
        <>
          <div className="mt-5 rounded-xl border border-green-300 bg-green-50 px-4 py-3 font-poppins text-[8.3px] font-medium leading-relaxed text-green-800 lg:text-[10.7px]">
            Your password has been changed and you are signed in.
          </div>
          <button
            type="button"
            onClick={() => {
              router.replace('/dashboard')
              router.refresh()
            }}
            className="mx-auto mt-7 block rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-12 py-3 font-poppins text-[13.1px] font-bold uppercase tracking-[0.2em] text-white shadow-lg transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream lg:text-[17px]"
          >
            Continue
          </button>
        </>
      )}

      {stage === 'ready' && (
        <>
          <p className="mt-2 font-poppins text-[8.9px] text-ocean-900/80 lg:text-[13.8px]">
            Pick something you haven&apos;t used before — at least {MIN_PASSWORD_LENGTH} characters.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className={labelClass}>
              New Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Confirm New Password
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                disabled={saving}
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
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
              disabled={saving}
              className="mx-auto block rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-12 py-3 font-poppins text-[13.1px] font-bold uppercase tracking-[0.2em] text-white shadow-lg lg:text-[17px] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save password'}
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-[10.7px]">
        <Link href="/login" className="font-bold text-ocean-700 transition hover:text-ocean-600">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
