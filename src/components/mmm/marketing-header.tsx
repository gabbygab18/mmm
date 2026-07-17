import Link from 'next/link'

/**
 * Shared marketing header — cream bar with centered nav, per the approved MMM design.
 * Nav: Home · About · How It Works · Education · FAQ · Contact + Sign In / Get Started.
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
  return (
    <header className="relative z-30 bg-[#faf4e7]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Margaret's MemoryCare Music home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/logo.png" alt="Margaret's MemoryCare Music" className="h-16 w-auto sm:h-20" />
        </Link>

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

        <div className="flex items-center gap-3">
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
      </div>

      {/* Mobile nav row */}
      <nav aria-label="Primary mobile" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 pb-3 lg:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className="font-poppins text-[13px] text-ocean-900">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}