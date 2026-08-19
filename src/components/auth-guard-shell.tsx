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
    { href: '/dashboard/education', label: 'Resources', icon: 'resources' },
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
    { href: '/dashboard/education', label: 'Resources', icon: 'resources' },
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
    { href: '/dashboard/education', label: 'Education Library', icon: 'education' },
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

/** A small circular icon button, styled to match the requested Facebook-style
    top bar: a dark filled circle holding one glyph, red dot/count badge in
    the corner. */
function TopBarIconButton({
  icon,
  iconNode,
  href,
  onClick,
  badgeCount,
  active,
  label,
}: {
  /** Nav icon asset name — ignored when `iconNode` is given. */
  icon?: string
  /** Custom glyph for buttons with no matching nav asset (e.g. the "More" ellipsis). */
  iconNode?: React.ReactNode
  href?: string
  onClick?: () => void
  badgeCount?: number
  active?: boolean
  label: string
}) {
  const content = (
    <span
      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
        active ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      {iconNode ?? <NavIcon name={icon ?? ''} className="h-5 w-5" />}
      {!!badgeCount && badgeCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-[#0d3763] bg-red-500 px-1 font-poppins text-[9px] font-bold text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </span>
  )

  // title: a real hover tooltip (aria-label alone is announced to screen
  // readers but shows nothing on hover) — the button/link name.
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className="shrink-0">
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="shrink-0">
      {content}
    </button>
  )
}

/** Three-dot "More" glyph — no nav asset covers "open the full menu," so this
    stays a hand-drawn dot row, same as the earlier grid/hamburger icons. */
function MoreDotsIcon() {
  return (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
    </svg>
  )
}

/** Mobile top bar — a Facebook-style row of circular icon buttons, using the
    same icon set as the sidebar rather than a text hamburger. Home links
    straight to the role's dashboard; a "More" dots button opens the full
    slide-down sheet with every other nav item; Requests and Notifications
    are one tap away with their badge counts; the avatar opens a small
    dropdown for Profile and Sign out. Every button carries a `title` so
    hovering shows the name of where it goes, not just an icon. */
function MobileNav({
  role,
  avatarUrl,
  unreadAlertCount,
  pendingRequestCount,
  onSignOut,
}: {
  role: Role
  avatarUrl?: string | null
  unreadAlertCount: number
  pendingRequestCount: number
  onSignOut: () => void
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const items = role ? (NAV[role] ?? []) : []
  const isActive = (i: NavItem) => (i.prefix ? pathname.startsWith(i.href) : pathname === i.href)
  // Dashboard is always the first entry per role (see NAV above) — Home goes
  // straight there instead of toggling the sheet.
  const homeHref = items[0]?.href ?? '/dashboard'

  // Close whatever's open whenever the route actually changes (a link was
  // followed), not just on click.
  useEffect(() => {
    setOpen(false)
    setAvatarOpen(false)
  }, [pathname])

  return (
    <div className="relative z-30 shrink-0 lg:hidden">
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5"
        style={{ background: 'linear-gradient(180deg, #124273 0%, #0a2f5a 100%)' }}
      >
        <TopBarIconButton
          icon="dashboard"
          href={homeHref}
          label="Dashboard"
          active={pathname === homeHref}
        />

        <div className="flex items-center gap-2.5">
          {/* Requests dropped from the quick row — a calendar-icon button and
              the dots-menu button sitting right next to each other read as
              two menus, not "one shortcut + one everything-else." Requests
              is still one tap away inside the sheet, which is why the badge
              moved onto the dots button instead of disappearing. */}
          <TopBarIconButton
            iconNode={<MoreDotsIcon />}
            label={open ? 'Close menu' : 'Open menu'}
            active={open}
            badgeCount={pendingRequestCount}
            onClick={() => {
              setAvatarOpen(false)
              setOpen((v) => !v)
            }}
          />
          <TopBarIconButton
            icon="notifications"
            href="/dashboard/alerts"
            label="Notifications"
            active={pathname === '/dashboard/alerts'}
            badgeCount={unreadAlertCount}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setAvatarOpen((v) => !v)
            }}
            aria-label="Account"
            title="Account"
            aria-expanded={avatarOpen}
            className="flex shrink-0 items-center gap-1 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full border-2 border-white/70 object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/70 bg-white/10">
                <NavIcon name="profile" className="h-5 w-5" />
              </span>
            )}
            <svg
              className={`h-3.5 w-3.5 shrink-0 text-white transition-transform ${avatarOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {(open || avatarOpen) && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => {
            setOpen(false)
            setAvatarOpen(false)
          }}
          className="fixed inset-0 z-40 bg-ocean-950/50"
        />
      )}

      {open && (
        <nav
          aria-label="Dashboard"
          className="absolute inset-x-0 top-full z-50 max-h-[75vh] overflow-y-auto rounded-b-2xl px-4 pb-4 pt-3 shadow-2xl"
          style={{ background: 'linear-gradient(180deg, #124273 0%, #0a2f5a 100%)' }}
        >
          <ul className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              const active = isActive(item)
              const badgeCount = badgeCountFor(item, unreadAlertCount, pendingRequestCount)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition ${
                      active ? 'bg-white/15' : 'hover:bg-white/10'
                    }`}
                  >
                    <span className="relative">
                      <NavIcon name={item.icon} className="h-7 w-7" />
                      {badgeCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 font-poppins text-[9px] font-bold text-white">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </span>
                    <span className="font-poppins text-[10.5px] leading-tight text-white">{item.label}</span>
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={onSignOut}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-white/95 transition hover:bg-white/10"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 15l4-3-4-3M22 12H10" />
                </svg>
                <span className="font-poppins text-[10.5px] leading-tight text-white">Sign out</span>
              </button>
            </li>
          </ul>
        </nav>
      )}

      {avatarOpen && (
        <div
          className="absolute right-4 top-full z-50 mt-1 w-56 overflow-hidden rounded-2xl shadow-2xl"
          style={{ background: 'linear-gradient(180deg, #124273 0%, #0a2f5a 100%)' }}
        >
          {PROFILE_NAV_ITEM.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={`block px-4 py-3 font-poppins text-[13px] transition ${
                pathname === child.href ? 'bg-white/15 font-semibold text-white' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {child.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={onSignOut}
            className="block w-full border-t border-white/15 px-4 py-3 text-left font-poppins text-[13px] text-white/90 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
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
      <MobileNav
        role={role}
        avatarUrl={avatarUrl}
        unreadAlertCount={liveUnreadAlertCount}
        pendingRequestCount={pendingRequestCount}
        onSignOut={signOut}
      />

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
    </div>
  )
}
