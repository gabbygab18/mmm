'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * Shared marketing header — cream bar with centered nav, per the approved MMM design.
 * Desktop (lg+): logo · nav links · Sign In / Get Started.
 * Mobile: logo · hamburger, with a slide-down menu holding the links + CTAs.
 */

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Education', href: '/education' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Contact', href: '/#contact' },
]

export function MarketingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="relative z-30 bg-[#faf4e7]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-8 sm:py-3">
        <Link href="/" aria-label="Margaret's MemoryCare Music home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/logo.png" alt="Margaret's MemoryCare Music" className="h-14 w-auto lg:h-20" />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
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

        {/* Desktop CTAs */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
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
          </div>
        </nav>
      )}
    </header>
  )
}
