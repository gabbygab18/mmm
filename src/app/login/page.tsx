'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { SiteFooter } from '@/components/site-footer'

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
    <div className="flex min-h-screen">
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-5/12 lg:flex-col lg:justify-between lg:bg-brand-900 lg:p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="font-bold text-white">Margaret's MemoryCare Music</span>
        </Link>
        <div>
          <blockquote className="text-xl font-semibold italic leading-relaxed text-brand-200">
            &ldquo;Music touches parts of the mind that nothing else can reach.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-brand-400">— Memory care community</p>
        </div>
        <p className="text-xs text-brand-500">Connecting volunteer musicians with memory care centers.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-stone-50 px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span className="font-bold text-stone-900">Margaret's MemoryCare Music</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-stone-900">Welcome back</h1>
          <p className="mt-2 text-sm text-stone-500">Sign in to your account to continue.</p>

          {accountDeleted && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
              Your account has been deleted and your personal information removed. Thank you for being part of our community.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-stone-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100"
              />
            </label>

            <label className="block text-sm font-semibold text-stone-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            New here?{' '}
            <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
              Create a free account
            </Link>
          </p>
        </div>
        <SiteFooter theme="light" />
      </div>
    </div>
  )
}
