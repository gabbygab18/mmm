'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

/**
 * Shared marketing header — cream bar with centered nav, per the approved MMM design.
 * Desktop (lg+): logo · nav links · Sign In / Get Started, or the signed-in
 * person's avatar and name.
 * Mobile: logo · hamburger, with a slide-down menu holding the links + CTAs.
 *
 * The session is read in the browser rather than on the server so the marketing
 * pages stay statically rendered; the buttons swap once it resolves.
 */

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Why Music Matters', href: '/why-music-matters' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

type Identity = {
  /** Their name once the profile is finished, otherwise the e-mail address. */
  label: string
  avatarUrl: string | null
  /** Where "Dashboard" should take them. */
  dashboardHref: string
}

function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    let active = true

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return
      if (!user) {
        setIdentity(null)
        return
      }

      const role = (user.user_metadata as Record<string, unknown> | null)?.role
      const table = role === 'center_coordinator' ? 'centers' : role === 'musician' ? 'musicians' : null
      const dashboardHref =
        role === 'center_coordinator' ? '/dashboard/center' : role === 'musician' ? '/dashboard/musician' : '/dashboard'

      if (!table) {
        setIdentity({ label: user.email ?? 'Account', avatarUrl: null, dashboardHref })
        return
      }

      const { data: profile } = await supabase
        .from(table)
        .select('name, profile_image_url, profile_complete')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!active) return

      // Until they finish setting up, the e-mail is the only name we can trust.
      const finished = Boolean(profile?.profile_complete && profile?.name?.trim())
      setIdentity({
        label: finished ? profile!.name.trim() : (user.email ?? 'Account'),
        avatarUrl: profile?.profile_image_url ?? null,
        dashboardHref,
      })
    }

    load()

    const { data: subscription } = supabase.auth.onAuthStateChange(() => load())
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return identity
}

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const identity = useIdentity()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  const initial = identity?.label?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="relative z-30 bg-[#faf4e7]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-8 sm:py-3">
        <Link href="/" aria-label="Margaret's MemoryCare Music home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/logo.png" alt="Margaret's MemoryCare Music" className="h-14 w-auto lg:h-20" />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-poppins text-[14.5px] text-ocean-900 transition hover:text-ocean-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs, or the signed-in account */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {identity ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex max-w-[260px] items-center gap-2.5 rounded-full border border-ocean-800/25 bg-white/70 py-1.5 pl-1.5 pr-4 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-800 font-poppins text-[13px] font-bold text-white">
                  {identity.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span className="truncate font-poppins text-[13.5px] font-medium text-ocean-900">{identity.label}</span>
                <svg className="h-3.5 w-3.5 shrink-0 text-ocean-900/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-ocean-900/10 bg-white py-1 shadow-xl"
                >
                  <Link
                    href={identity.dashboardHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 font-poppins text-[13px] text-ocean-900 transition hover:bg-ocean-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 font-poppins text-[13px] text-ocean-900 transition hover:bg-ocean-50"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={signOut}
                    className="block w-full border-t border-ocean-900/10 px-4 py-2.5 text-left font-poppins text-[13px] text-ocean-900 transition hover:bg-ocean-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-7 py-2 font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_5px_rgba(7,37,68,0.35)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
                style={{ background: 'linear-gradient(180deg, #4f7aa8 0%, #1e4a7c 45%, #0f3b6b 100%)' }}
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="rounded-lg border-2 border-ocean-800 bg-transparent px-6 py-2 font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ocean-800 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 lg:hidden"
        >
          {open ? (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="5" width="18" height="2.6" rx="1.3" />
              <rect x="3" y="10.7" width="18" height="2.6" rx="1.3" />
              <rect x="3" y="16.4" width="18" height="2.6" rx="1.3" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Primary mobile"
          className="absolute inset-x-0 top-full z-40 border-t border-ocean-900/10 bg-[#faf4e7] px-5 pb-6 pt-2 shadow-xl lg:hidden"
        >
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-ocean-900/10 py-3 font-poppins text-[14.5px] font-medium text-ocean-900 transition hover:text-ocean-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-3">
            {identity ? (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-ocean-900/10 bg-white/70 px-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-800 font-poppins text-[14px] font-bold text-white">
                    {identity.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </span>
                  <span className="truncate font-poppins text-[13.5px] font-medium text-ocean-900">{identity.label}</span>
                </div>
                <Link
                  href={identity.dashboardHref}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-7 py-2.5 text-center font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_5px_rgba(7,37,68,0.35)] transition hover:brightness-110"
                  style={{ background: 'linear-gradient(180deg, #4f7aa8 0%, #1e4a7c 45%, #0f3b6b 100%)' }}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-lg border-2 border-ocean-800 px-6 py-2.5 text-center font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-7 py-2.5 text-center font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_2px_5px_rgba(7,37,68,0.35)] transition hover:brightness-110"
                  style={{ background: 'linear-gradient(180deg, #4f7aa8 0%, #1e4a7c 45%, #0f3b6b 100%)' }}
                >
                  Sign In
                </Link>
                <Link
                  href="/get-started"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border-2 border-ocean-800 px-6 py-2.5 text-center font-poppins text-[11.7px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
