'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { AvatarPhotoButton } from '@/components/mmm/avatar-photo-button'
import type { ProfileTable } from '@/lib/mmm/profile-photo'

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

type NavItem = { href: string; label: string; icon: string; prefix?: boolean; children?: NavItem[] }

// "Profile" expands into Edit Profile / Profile Overview, matching the
// approved Edit Profile design — replaces the old single link straight to
// Account Settings.
const PROFILE_NAV_ITEM: NavItem = {
  href: '/dashboard/account',
  label: 'Profile',
  icon: 'profile',
  prefix: true,
  children: [
    { href: '/dashboard/account/edit', label: 'Edit Profile', icon: 'profile' },
    { href: '/dashboard/account', label: 'Profile Overview', icon: 'profile' },
  ],
}

const NAV: Record<string, NavItem[]> = {
  musician: [
    { href: '/dashboard/musician', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/schedule', label: 'Upcoming Performances', icon: 'performances' },
    { href: '/dashboard/musician/availability', label: 'Availability', icon: 'availability' },
    { href: '/dashboard/musician/hours', label: 'Volunteer Hours', icon: 'hours' },
    { href: '/dashboard/musician/discover', label: 'Participating Facilities', icon: 'facilities' },
    { href: '/dashboard/requests', label: 'Requests', icon: 'bookings', prefix: true },
    { href: '/education', label: 'Resources', icon: 'resources' },
    { href: '/dashboard/alerts', label: 'Notifications', icon: 'notifications' },
    PROFILE_NAV_ITEM,
  ],
  center_coordinator: [
    { href: '/dashboard/center', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/schedule', label: 'Upcoming Performances', icon: 'performances' },
    { href: '/dashboard/center/discover', label: 'Volunteer Musicians', icon: 'musicians' },
    { href: '/dashboard/requests', label: 'Requests', icon: 'bookings', prefix: true },
    // "Hours of Music" pointed at /dashboard/center/hours, which has never
    // existed — every facility user had a dead link here. Removed until the
    // page is built.
    { href: '/education', label: 'Resources', icon: 'resources' },
    { href: '/dashboard/alerts', label: 'Notifications', icon: 'notifications' },
    PROFILE_NAV_ITEM,
  ],
  admin: [
    // Order follows the approved design. Song Library, Performance Video and
    // Analytics are drawn there too but have no page behind them yet, so they
    // are left off rather than listed as dead ends.
    { href: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/dashboard/admin/musicians', label: 'Musicians', icon: 'musicians', prefix: true },
    { href: '/dashboard/admin/facilities', label: 'Facilities', icon: 'facilities', prefix: true },
    { href: '/dashboard/schedule', label: 'Bookings', icon: 'bookings' },
    { href: '/dashboard/admin/oversight', label: 'Oversight', icon: 'reports' },
    { href: '/education', label: 'Education Library', icon: 'education' },
    { href: '/dashboard/alerts', label: 'Announcement', icon: 'announcement' },
    { href: '/dashboard/admin/reports', label: 'Reports', icon: 'analytics' },
    { href: '/dashboard/admin/categories', label: 'Categories', icon: 'adminresources' },
    { href: '/dashboard/admin/content', label: 'Website Content', icon: 'resources' },
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

/**
 * Mirrors the server-fetched unread count in local state so the sidebar
 * badge can drop the instant an alert is dismissed, instead of waiting on
 * the router.refresh() round trip (previously the visible lag on dismiss).
 */
function useUnreadAlertCount(serverCount: number) {
  const [count, setCount] = useState(serverCount)

  useEffect(() => setCount(serverCount), [serverCount])

  useEffect(() => {
    function handleDismissed(e: Event) {
      const detail = (e as CustomEvent<{ unread?: boolean }>).detail
      if (detail?.unread) setCount((c) => Math.max(0, c - 1))
    }
    window.addEventListener('alerts:dismissed', handleDismissed)
    return () => window.removeEventListener('alerts:dismissed', handleDismissed)
  }, [])

  return count
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

/** Red badge counts, keyed by nav href — 0/absent renders no badge. */
function badgeCountFor(item: NavItem, unreadAlertCount: number, pendingRequestCount: number) {
  if (item.href === '/dashboard/alerts') return unreadAlertCount
  if (item.href === '/dashboard/requests') return pendingRequestCount
  return 0
}

function Sidebar({
  role,
  avatarUrl,
  photoTable,
  unreadAlertCount,
  pendingRequestCount,
}: {
  role: Role
  avatarUrl?: string | null
  photoTable?: ProfileTable | null
  unreadAlertCount: number
  pendingRequestCount: number
}) {
  const pathname = usePathname()
  const items = role ? (NAV[role] ?? []) : []
  const signOut = useSignOut()
  const isActive = (i: NavItem) => (i.prefix ? pathname.startsWith(i.href) : pathname === i.href)

  return (
    <div className="flex h-full flex-col" style={{ background: SIDEBAR_BG }}>
      <div className="flex shrink-0 justify-center px-6 pb-2 pt-6">
        {/* Click the avatar itself to change the photo. Admins have no profile
            row of their own, so they just get the placeholder. */}
        {photoTable ? (
          <AvatarPhotoButton
            url={avatarUrl ?? null}
            table={photoTable}
            size={104}
            tooltip={photoTable === 'centers' ? 'Change facility picture' : 'Change profile picture'}
            fallback={<NavIcon name="profile" className="h-14 w-14 opacity-70" />}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-ocean-100/90 xl:h-32 xl:w-32">
            <NavIcon name="profile" className="h-14 w-14 opacity-70 xl:h-20 xl:w-20" />
          </div>
        )}
      </div>

      <nav aria-label="Dashboard" className="scrollbar-on-dark min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pt-4">
        {items.map((item) => {
          const active = isActive(item)
          const badgeCount = badgeCountFor(item, unreadAlertCount, pendingRequestCount)
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 font-poppins text-[14px] leading-tight transition xl:text-[16.3px] ${
                  active ? 'bg-ocean-300/45 font-semibold text-white shadow-inner' : 'text-white/95 hover:bg-white/10'
                }`}
              >
                <span className="relative">
                  <NavIcon name={item.icon} />
                  {badgeCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-ocean-900 bg-red-500"
                    />
                  )}
                </span>
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 font-poppins text-[10px] font-bold leading-none text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
                {item.children && (
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${active ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </Link>

              {item.children && active && (
                <div className="ml-[42px] mt-1 space-y-0.5 border-l border-white/20 pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        aria-current={childActive ? 'page' : undefined}
                        className={`block rounded-lg px-3 py-2 font-poppins text-[13px] transition xl:text-[14.5px] ${
                          childActive ? 'bg-ocean-300/45 font-semibold text-white' : 'text-white/85 hover:bg-white/10'
                        }`}
                      >
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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

/** Mobile bottom tab bar — the primary navigation on small screens. Also the
    only sign-out path on mobile/tablet now that the top logo bar (which used
    to hold it in its hamburger menu) is gone. */
function TabBar({
  role,
  unreadAlertCount,
  pendingRequestCount,
  onSignOut,
}: {
  role: Role
  unreadAlertCount: number
  pendingRequestCount: number
  onSignOut: () => void
}) {
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
          const badgeCount = badgeCountFor(item, unreadAlertCount, pendingRequestCount)
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-[68px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center transition ${
                  active ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                <span className="relative">
                  <NavIcon name={item.icon} className="h-6 w-6" />
                  {badgeCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#0d3763] bg-red-500"
                    />
                  )}
                </span>
                <span className="font-poppins text-[8.5px] leading-tight text-white">{item.label}</span>
              </Link>
            </li>
          )
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-w-[68px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-center text-white/95 transition hover:bg-white/10"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l4-3-4-3M22 12H10" />
            </svg>
            <span className="font-poppins text-[8.5px] leading-tight text-white">Sign out</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

export function AuthGuardShell({
  children,
  role,
  avatarUrl = null,
  photoTable = null,
  unreadAlertCount = 0,
  pendingRequestCount = 0,
}: {
  children: React.ReactNode
  role: Role
  /** Current profile / facility photo, shown at the top of the sidebar. */
  avatarUrl?: string | null
  /** Profile row that owns the photo — null for admins, who have none. */
  photoTable?: ProfileTable | null
  /** Unread, non-dismissed alert count — drives the red badge on Notifications. */
  unreadAlertCount?: number
  /** Active ("initiated") request count — drives the red badge on Requests. */
  pendingRequestCount?: number
}) {
  const signOut = useSignOut()
  const liveUnreadAlertCount = useUnreadAlertCount(unreadAlertCount)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[260px] shrink-0 lg:block xl:w-[300px]">
          <Sidebar
            role={role}
            avatarUrl={avatarUrl}
            photoTable={photoTable}
            unreadAlertCount={liveUnreadAlertCount}
            pendingRequestCount={pendingRequestCount}
          />
        </aside>

        <main
          className="min-w-0 flex-1 overflow-y-auto"
          style={{ background: 'linear-gradient(180deg, #dbe8f6 0%, #c3d9ef 100%)' }}
        >
          <div className="px-4 py-5 sm:px-6 lg:px-7">{children}</div>
        </main>
      </div>

      <TabBar role={role} unreadAlertCount={liveUnreadAlertCount} pendingRequestCount={pendingRequestCount} onSignOut={signOut} />
    </div>
  )
}
