'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

/**
 * Dashboard shell — approved MMM design.
 *
 * Desktop: deep-navy sidebar on the left, content well on the right. No
 * marketing header — the dashboard is its own environment.
 *
 * The frame is locked to the viewport (`h-screen`) so the shell always matches
 * the screen, exactly as the mockups show. The content well scrolls inside
 * itself rather than the page scrolling, which keeps the sidebar and the mobile
 * tab bar permanently in view without putting long panels out of reach.
 *
 * Mobile: compact logo bar on top, fixed tab bar along the bottom.
 */

type Role = string | null

type NavItem = { href: string; label: string; icon: string; prefix?: boolean }

const NAV: Record<string, NavItem[]> = {
  musician: [
    { href: '/dashboard/musician', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/schedule', label: 'Upcoming Performances', icon: 'performances' },
    { href: '/dashboard/musician/availability', label: 'Availability', icon: 'availability' },
    { href: '/dashboard/requests', label: 'Requests', icon: 'bookings', prefix: true },
    { href: '/education', label: 'Resources', icon: 'resources' },
    { href: '/dashboard/alerts', label: 'Notifications', icon: 'notifications' },
    { href: '/dashboard/account', label: 'Profile', icon: 'profile' },
  ],
  center_coordinator: [
    { href: '/dashboard/center', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/schedule', label: 'Upcoming Performances', icon: 'performances' },
    { href: '/dashboard/requests', label: 'Requests', icon: 'bookings', prefix: true },
    { href: '/dashboard/center/hours', label: 'Hours of Music', icon: 'hours' },
    { href: '/education', label: 'Resources', icon: 'resources' },
    { href: '/dashboard/alerts', label: 'Notifications', icon: 'notifications' },
    { href: '/dashboard/account', label: 'Profile', icon: 'profile' },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/schedule', label: 'Bookings', icon: 'bookings' },
    { href: '/education', label: 'Education Library', icon: 'education' },
    { href: '/dashboard/alerts', label: 'Announcement', icon: 'announcement' },
    { href: '/dashboard/account', label: 'Settings', icon: 'settings' },
  ],
}

const SIDEBAR_BG = 'linear-gradient(180deg, #0a2f5a 0%, #124273 55%, #3f7bb5 100%)'

function NavIcon({ name, className = 'h-6 w-6' }: { name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/mmm/nav/${name}.png`} alt="" className={`${className} shrink-0 object-contain`} />
  )
}

function useSignOut() {
  const router = useRouter()
  return async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
}

function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = role ? (NAV[role] ?? []) : []
  const signOut = useSignOut()
  const isActive = (i: NavItem) => (i.prefix ? pathname.startsWith(i.href) : pathname === i.href)

  return (
    <div className="flex h-full flex-col" style={{ background: SIDEBAR_BG }}>
      <div className="flex shrink-0 justify-center px-6 pb-2 pt-6">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-ocean-100/90 xl:h-32 xl:w-32">
          <NavIcon name="profile" className="h-14 w-14 opacity-70 xl:h-20 xl:w-20" />
        </div>
      </div>

      <nav aria-label="Dashboard" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pt-4">
        {items.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 font-poppins text-[14px] leading-tight transition xl:text-[16.3px] ${
                active ? 'bg-ocean-300/45 font-semibold text-white shadow-inner' : 'text-white/95 hover:bg-white/10'
              }`}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 px-4 pb-5 pt-4">
        <div className="rounded-2xl border-2 border-white/45 px-5 py-4">
          <div className="flex items-center gap-3">
            <NavIcon name="support" className="h-8 w-8" />
            <h2 className="font-poppins text-[15px] font-bold text-white xl:text-[16.3px]">Need Help?</h2>
          </div>
          <p className="mt-1.5 font-poppins text-[11.5px] text-white/90 xl:text-[12.3px]">
            We&apos;re here to support you.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-block rounded-md border border-white/70 px-3 py-1.5 font-poppins text-[8.5px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
          >
            Contact Support
          </Link>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full rounded-xl px-4 py-2 text-left font-poppins text-[12.5px] text-white/85 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

/** Mobile bottom tab bar — the primary navigation on small screens. */
function TabBar({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = role ? (NAV[role] ?? []) : []
  const isActive = (i: NavItem) => (i.prefix ? pathname.startsWith(i.href) : pathname === i.href)

  return (
    <nav
      aria-label="Dashboard"
      className="shrink-0 overflow-x-auto lg:hidden"
      style={{ background: 'linear-gradient(180deg, #0d3763 0%, #2f6ba8 100%)' }}
    >
      <ul className="flex min-w-max items-stretch justify-around gap-1 px-2 py-2">
        {items.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-[68px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center transition ${
                  active ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                <NavIcon name={item.icon} className="h-6 w-6" />
                <span className="font-poppins text-[8.5px] leading-tight text-white">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function AuthGuardShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const signOut = useSignOut()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Mobile: compact logo bar */}
      <div className="flex shrink-0 items-center justify-between bg-[#faf4e7] px-4 py-2 lg:hidden">
        <Link href="/dashboard" aria-label="Margaret's MemoryCare Music">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/logo.png" alt="Margaret's MemoryCare Music" className="h-12 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="rounded-md p-2 text-ocean-800 transition hover:bg-ocean-900/5"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="3" y="5" width="18" height="2.6" rx="1.3" />
            <rect x="3" y="10.7" width="18" height="2.6" rx="1.3" />
            <rect x="3" y="16.4" width="18" height="2.6" rx="1.3" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="shrink-0 border-t border-ocean-900/10 bg-[#faf4e7] px-5 py-3 lg:hidden">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Why Music Matters', href: '/why-music-matters' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Contact', href: '/contact' },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-1 font-poppins text-[13px] text-ocean-900 transition hover:text-ocean-600"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 font-poppins text-[13px] font-bold text-ocean-900 underline"
          >
            Sign out
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[260px] shrink-0 lg:block xl:w-[300px]">
          <Sidebar role={role} />
        </aside>

        <main
          className="min-w-0 flex-1 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #dbe8f6 0%, #c3d9ef 100%)' }}
        >
          <div className="px-4 py-5 sm:px-6 lg:px-7">{children}</div>
        </main>
      </div>

      <TabBar role={role} />
    </div>
  )
}
