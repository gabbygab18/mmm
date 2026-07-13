'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth-shell'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)

  useEffect(() => {
    setAccountDeleted(new URLSearchParams(window.location.search).get('deleted') === '1')
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error('Missing Supabase configuration')
      }

      const supabase = createSupabaseBrowserClient()

      const { error: signInError, data } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        throw new Error('Sign in succeeded but no user data')
      }

      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
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
      <h1 className="font-garamond text-[24.3px] font-bold leading-tight text-ocean-900 lg:text-[37.7px]">Welcome back!</h1>
      <p className="mt-2 font-poppins text-[8.9px] text-ocean-900/80 lg:text-[13.8px]">Sign in to your account to continue.</p>

      {accountDeleted && (
        <div className="mt-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-green-800 lg:text-[10.7px]">
          Your account has been deleted and your personal information removed. Thank you for being part of our community.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <label className="block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">
          E-mail Address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 disabled:cursor-not-allowed disabled:bg-stone-100 lg:text-[10.7px]"
          />
        </label>

        <label className="block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 disabled:cursor-not-allowed disabled:bg-stone-100 lg:text-[10.7px]"
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-[10.7px]">
        New here?{' '}
        <Link href="/signup" className="font-bold text-ocean-700 transition hover:text-ocean-600">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  )
}
