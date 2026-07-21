'use client'

import Link from 'next/link'
import { FormEvent, ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AuthShell } from '@/components/auth-shell'

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
  if (!label) return <span className="mt-1 block font-poppins text-[7.7px] font-normal text-ocean-900/50 lg:text-[10px]">Minimum 8 characters</span>
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? STRENGTH_COLORS[score] : 'bg-ocean-900/10'}`}
          />
        ))}
      </div>
      <p className={`font-poppins text-[7.7px] font-medium lg:text-[10px] ${STRENGTH_TEXT[score]}`}>{label}</p>
    </div>
  )
}

function MusicNoteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M10 21v-4h4v4" />
    </svg>
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

    // Redirect to the last page: honour a ?next= return URL if one was passed,
    // otherwise land musicians on the final (Welcome) page of the registration
    // flow and coordinators on their onboarding.
    const next = new URLSearchParams(window.location.search).get('next')
    if (next && next.startsWith('/')) {
      router.push(next)
    } else {
      router.push(role === 'musician' ? '/register/musician?welcome=1' : '/onboarding/center')
    }
    router.refresh()
  }

  return (
    <AuthShell
      photoSrc="/landing/signup-hero.jpg"
      photoAlt="A caregiver sharing a smile with a memory care resident"
      photoPositionDesktop="center 25%"
      mobilePhotoHeightClassName="h-72 sm:h-96"
      asideOverlapClassName="-mt-32 sm:-mt-40"
      asideDesktopClassName="lg:w-full lg:max-w-xl lg:self-end lg:justify-self-start lg:pb-24"
      cardSide="right"
      aside={
        <div className="space-y-3">
          <div className="rounded-xl border border-white/40 bg-gradient-to-r from-white/30 to-ocean-500/25 p-4 shadow-lg backdrop-blur-md">
            <p className="font-poppins text-[8.4px] font-bold uppercase tracking-wider text-white drop-shadow lg:text-[17px]">Musicians</p>
            <p className="mt-1 font-poppins text-[7.7px] leading-snug text-white drop-shadow-sm lg:text-[15px]">
              Share your availability and connect with the local memory care centers for volunteer performances.
            </p>
          </div>
          <div className="rounded-xl border border-white/40 bg-gradient-to-r from-white/20 to-ocean-700/40 p-4 shadow-lg backdrop-blur-md">
            <p className="font-poppins text-[8.4px] font-bold uppercase tracking-wider text-white drop-shadow lg:text-[17px]">Memory Care Centers</p>
            <p className="mt-1 font-poppins text-[7.7px] leading-snug text-white drop-shadow-sm lg:text-[15px]">
              Find volunteer musicians in your area and coordinate uplifting performances for your residents.
            </p>
          </div>
          <p className="px-1 font-poppins text-[6.9px] font-medium text-white/90 drop-shadow lg:text-[10.7px]">
            Always free. No commissions. Community-driven
          </p>
        </div>
      }
    >
      <h1 className="text-center font-garamond text-[24.3px] font-bold leading-tight text-ocean-900 lg:text-left lg:text-[37.7px]">
        Create your account
      </h1>
      <p className="mt-2 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-left lg:text-[13.8px]">
        Join as a Musician or Center Coordinator. It&apos;s free.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        {/* Role picker */}
        <div>
          <p className="font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">I am a…</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {([
              { value: 'musician', label: 'Musician', icon: <MusicNoteIcon /> },
              { value: 'center_coordinator', label: 'Center Coordinator', icon: <BuildingIcon /> },
            ] as { value: RoleOption; label: string; icon: ReactNode }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                aria-pressed={role === opt.value}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-poppins text-[8.4px] font-semibold transition lg:text-[11.9px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                  role === opt.value
                    ? 'border-transparent bg-gradient-to-r from-ocean-500 to-ocean-800 text-white shadow-md'
                    : 'border-ocean-500 bg-white/70 text-ocean-800 hover:bg-white'
                }`}
              >
                {opt.icon}
                <span className="leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">
          E-mail Address
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 lg:text-[10.7px]"
          />
        </label>

        <label className="block font-poppins text-[8.3px] font-medium text-ocean-900 lg:text-[10.7px]">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-ocean-400 bg-white px-3.5 py-2.5 font-poppins text-[8.3px] text-ocean-950 shadow-sm outline-none transition focus:border-ocean-600 focus:ring-2 focus:ring-ocean-500/40 lg:text-[10.7px]"
          />
          <PasswordStrength password={password} />
        </label>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-red-700 lg:text-[10.7px]">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-xl border border-ocean-200 bg-ocean-50 px-4 py-3 font-poppins text-[8.3px] font-medium text-ocean-700 lg:text-[10.7px]">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mx-auto block rounded-lg bg-gradient-to-r from-ocean-400 to-ocean-800 px-9 py-3 font-poppins text-[10.6px] font-bold uppercase tracking-[0.14em] text-white shadow-lg lg:text-[17px] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center font-poppins text-[8.3px] text-ocean-900/80 lg:text-[10.7px]">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-ocean-700 transition hover:text-ocean-600">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center font-poppins text-[8.3px] leading-relaxed text-ocean-900/70 lg:text-[10.7px]">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="font-bold text-ocean-800 transition hover:text-ocean-600">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="font-bold text-ocean-800 transition hover:text-ocean-600">Privacy Policy</Link>
      </p>
    </AuthShell>
  )
}
