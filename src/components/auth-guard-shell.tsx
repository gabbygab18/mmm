'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { NotificationBell } from '@/app/components/NotificationBell'

type Role = string | null

// ── Inline SVG icon ────────────────────────────────────────────────────────
function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  )
}

const ICONS = {
  music:    'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  profile:  'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  search:   'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  grid:     'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  inbox:    'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  schedule: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  building: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:     'M4 6h16M4 12h16M4 18h16',
  close:    'M6 18L18 6M6 6l12 12',
}

// ── Nav definition ─────────────────────────────────────────────────────────
type NavItem = { href: string; label: string; icon: keyof typeof ICONS; prefix?: boolean }

const NAV: Record<string, NavItem[]> = {
  musician: [
    { href: '/dashboard/musician',               label: 'My Profile',     icon: 'profile' },
    { href: '/dashboard/musician/availability',  label: 'Availability',   icon: 'calendar' },
    { href: '/dashboard/musician/discover',      label: 'Browse Centers', icon: 'search' },
    { href: '/dashboard/musician/discover-slots',label: 'Browse Slots',   icon: 'grid' },
    { href: '/dashboard/requests',               label: 'Requests',       icon: 'inbox',    prefix: true },
    { href: '/dashboard/schedule',               label: 'Schedule',       icon: 'schedule' },
    { href: '/dashboard/account',                label: 'Account',        icon: 'settings' },
  ],
  center_coordinator: [
    { href: '/dashboard/center',    label: 'My Center',     icon: 'building', prefix: true },
    { href: '/dashboard/requests',  label: 'Requests',      icon: 'inbox',    prefix: true },
    { href: '/dashboard/schedule',  label: 'Schedule',      icon: 'schedule' },
    { href: '/dashboard/account',   label: 'Account',       icon: 'settings' },
  ],
  admin: [
    { href: '/dashboard/admin',     label: 'Moderation',    icon: 'shield' },
    { href: '/dashboard/account',   label: 'Account',       icon: 'settings' },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  musician:           'Musician',
  center_coordinator: 'Center Coordinator',
  admin:              'Admin',
}

// ── Sidebar content (nav links + sign out) ─────────────────────────────────
function SidebarContent({
  role,
  onNav,
}: {
  role: Role
  onNav?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const items = role ? (NAV[role] ?? []) : []
  const [requestCount, setRequestCount] = useState(0)
  const [scheduleCount, setScheduleCount] = useState(0)

  const isActive = (item: NavItem) =>
    item.prefix ? pathname.startsWith(item.href) : pathname === item.href

  useEffect(() => {
    async function loadNavCounts() {
      if (role !== 'musician' && role !== 'center_coordinator') {
        setRequestCount(0)
        setScheduleCount(0)
        return
      }

      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setRequestCount(0)
        setScheduleCount(0)
        return
      }

      const today = new Date().toISOString().slice(0, 10)

      if (role === 'musician') {
        const { data: musician } = await supabase
          .from('musicians')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!musician) {
          setRequestCount(0)
          setScheduleCount(0)
          return
        }

        const [{ count: requests }, { count: schedules }] = await Promise.all([
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('musician_id', musician.id)
            .in('status', ['initiated', 'matched']),
          supabase
            .from('requests')
            .select('id', { count: 'exact', head: true })
            .eq('musician_id', musician.id)
            .eq('status', 'accepted')
            .gte('requested_date', today),
        ])

        setRequestCount(requests ?? 0)
        setScheduleCount(schedules ?? 0)
        return
      }

      const { data: center } = await supabase
        .from('centers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!center) {
        setRequestCount(0)
        setScheduleCount(0)
        return
      }

      const { data: ownLocations } = await supabase
        .from('center_locations')
        .select('id')
        .eq('center_id', center.id)

      const ownLocationIds = (ownLocations ?? []).map((row) => row.id)

      if (ownLocationIds.length === 0) {
        setRequestCount(0)
        setScheduleCount(0)
        return
      }

      const [{ count: requests }, { count: schedules }] = await Promise.all([
        supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .in('center_location_id', ownLocationIds)
          .in('status', ['initiated', 'matched']),
        supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .in('center_location_id', ownLocationIds)
          .eq('status', 'accepted')
          .gte('requested_date', today),
      ])

      setRequestCount(requests ?? 0)
      setScheduleCount(schedules ?? 0)
    }

    void loadNavCounts()
  }, [role])

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500">
          <NavIcon d={ICONS.music} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-none text-white">Margaret's MemoryCare Music</p>
        </div>
        <div className="ml-auto">
          <NotificationBell tone="dark" placement="right-start" />
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = isActive(item)
          let label = item.label

          if (item.href === '/dashboard/requests') {
            label = `${item.label} (${requestCount})`
          }

          if (item.href === '/dashboard/schedule') {
            label = `${item.label} (${scheduleCount})`
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <NavIcon d={ICONS[item.icon]} />
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-300" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer: role label + sign out + legal/social links */}
      <div className="flex-shrink-0 border-t border-white/10 p-4 space-y-2">
        {role && (
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-brand-400">
            {ROLE_LABELS[role] ?? role}
          </p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <NavIcon d={ICONS.logout} />
          Sign out
        </button>
        <div className="flex items-center gap-3 px-3 pt-1">
          <Link href="/privacy" className="text-xs text-brand-500 transition hover:text-brand-300">Privacy</Link>
          <span className="text-brand-700 text-xs">·</span>
          <Link href="/terms" className="text-xs text-brand-500 transition hover:text-brand-300">Terms</Link>
          <span className="text-brand-700 text-xs">·</span>
          <a href="#" aria-label="Facebook" className="text-brand-500 transition hover:text-brand-300">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="text-brand-500 transition hover:text-brand-300">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export function AuthGuardShell({ children, role }: { children: React.ReactNode; role: Role }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Desktop: fixed left sidebar ── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:bg-brand-900">
        <SidebarContent role={role} />
      </aside>

      {/* ── Mobile: backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-900 transition-transform duration-200 ease-in-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-4 rounded-md p-1.5 text-brand-300 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.close} />
          </svg>
        </button>
        <SidebarContent role={role} onNav={() => setOpen(false)} />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 shadow-sm lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.menu} />
          </svg>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={ICONS.music} />
            </svg>
          </div>
          <span className="text-sm font-bold text-stone-900">Margaret's MemoryCare Music</span>
        </Link>
        <div className="ml-auto">
          <NotificationBell tone="light" />
        </div>
      </div>

      {/* ── Main content (offset for desktop sidebar) ── */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
