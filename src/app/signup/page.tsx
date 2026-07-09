'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type RoleOption = 'musician' | 'center_coordinator'

function passwordStrength(pw: string): { score: number; label: string } {
  if (pw.length === 0) return { score: 0, label: '' }
  if (pw.length < 8) return { score: 1, label: 'Too short' }
  let score = 1
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Too short', 'Weak', 'Fair', 'Strong']
  return { score, label: labels[score] }
}

const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500']
const STRENGTH_TEXT = ['', 'text-red-600', 'text-amber-600', 'text-yellow-600', 'text-green-700']

function PasswordStrength({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (!label) return <span className="mt-1 block text-xs font-normal text-stone-400">Minimum 8 characters</span>
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? STRENGTH_COLORS[score] : 'bg-stone-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${STRENGTH_TEXT[score]}`}>{label}</p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<RoleOption>('musician')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createSupabaseBrowserClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setMessage('Account created. Check your email to confirm, then sign in.')
      setLoading(false)
      return
    }

    router.push(role === 'musician' ? '/onboarding/musician' : '/onboarding/center')
    router.refresh()
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
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-white">🎵 Musicians</p>
            <p className="mt-1 text-sm text-brand-200">Share your availability and connect with local memory care centers for volunteer performances.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-bold text-white">🏥 Memory Care Centers</p>
            <p className="mt-1 text-sm text-brand-200">Find volunteer musicians in your area and coordinate uplifting performances for your residents.</p>
          </div>
        </div>
        <p className="text-xs text-brand-500">Always free · No commissions · Community-driven</p>
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
          <h1 className="text-3xl font-bold text-stone-900">Create your account</h1>
          <p className="mt-2 text-sm text-stone-500">Join as a musician or center coordinator. It&apos;s free.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Role picker */}
            <div>
              <p className="text-sm font-semibold text-stone-700">I am a…</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {([
                  { value: 'musician', label: '🎵 Musician' },
                  { value: 'center_coordinator', label: '🏥 Center Coordinator' },
                ] as { value: RoleOption; label: string }[]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      role === opt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-stone-300 bg-white text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block text-sm font-semibold text-stone-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2"
              />
            </label>

            <label className="block text-sm font-semibold text-stone-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2"
              />
              <PasswordStrength password={password} />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-stone-400">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:text-stone-600">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:text-stone-600">Privacy Policy</Link>.
          </p>
        </div>
        <SiteFooter theme="light" />
      </div>
    </div>
  )
}
