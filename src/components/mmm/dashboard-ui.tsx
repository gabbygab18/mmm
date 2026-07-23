import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * Dashboard building blocks shared by the musician, facility, and admin
 * screens, so the three stay consistent with the design pack.
 */

/** Cream welcome banner with the music-staff artwork bleeding off the right. */
export function WelcomeBanner({
  title,
  name,
  subtitle,
  aside,
}: {
  title: string
  name?: string
  subtitle: string
  aside?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#faf4e7] px-6 py-7 shadow-sm sm:px-9 sm:py-8">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[55%] opacity-40"
        style={{
          backgroundImage: "url('/mmm/notes-bg.png')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-garamond text-[26px] font-bold leading-tight text-ocean-900 sm:text-[32.3px]">
            {title}
            {name && <span className="ml-2 font-poppins text-[15px] italic text-ocean-900/55 sm:text-[17.5px]">{name}</span>}
          </h1>
          <p className="mt-1 max-w-[560px] font-poppins text-[11.5px] leading-relaxed text-ocean-900 sm:text-[12.4px]">
            {subtitle}
          </p>
        </div>
        {aside}
      </div>
    </div>
  )
}

/** One of the four summary tiles across the top of each dashboard. */
export function StatCard({
  icon,
  title,
  value,
  eyebrow,
  actionLabel,
  actionHref,
}: {
  icon: ReactNode
  title: string
  value: ReactNode
  eyebrow: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-[#fdfaf3] px-5 py-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ocean-900 text-white">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-garamond text-[15px] font-bold leading-tight text-ocean-900 sm:text-[16.5px]">{title}</h2>
          <p className="font-poppins text-[13px] font-semibold text-ocean-900">{value}</p>
        </div>
      </div>
      <p className="mt-3 font-poppins text-[8.5px] font-bold uppercase tracking-[0.12em] text-ocean-900/70">{eyebrow}</p>
      <Link
        href={actionHref}
        className="mt-2 inline-block self-start rounded-md border border-ocean-800/70 px-3 py-1.5 font-poppins text-[8.5px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
      >
        {actionLabel}
      </Link>
    </div>
  )
}

/** Cream content panel with a serif heading and optional "View all" link. */
export function Panel({
  title,
  viewAllHref,
  children,
  className = '',
  footer,
}: {
  title: string
  viewAllHref?: string
  children: ReactNode
  className?: string
  footer?: ReactNode
}) {
  return (
    <section className={`flex flex-col rounded-2xl bg-[#fdfaf3] px-5 py-5 shadow-sm sm:px-6 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-ocean-300/70 pb-2">
        <h2 className="font-garamond text-[19px] font-bold text-ocean-900 sm:text-[15.7px] lg:text-[19px]">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 font-poppins text-[7.5px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:text-ocean-600"
          >
            View all
          </Link>
        )}
      </div>
      <div className="flex-1 pt-4">{children}</div>
      {footer && <div className="pt-4">{footer}</div>}
    </section>
  )
}

/** Neutral empty state — an empty screen should still tell you what to do. */
export function EmptyState({ message, actionLabel, actionHref }: { message: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-ocean-300 bg-white/60 px-5 py-8 text-center">
      <p className="font-poppins text-[11.5px] text-ocean-900/70">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-3 inline-block rounded-md bg-ocean-800 px-4 py-2 font-poppins text-[9px] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-ocean-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

/** Full-width cream action button used at the bottom of panels. */
export function PanelButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md border border-ocean-800/70 px-4 py-2 text-center font-poppins text-[8.5px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5"
    >
      {children}
    </Link>
  )
}

export const DASH_ICONS = {
  calendar: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1zm12 8H5v9h14z" />
    </svg>
  ),
  handshake: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 5.6a5 5 0 0 1 7 .3l3 3-1.4 1.4-1.3-1.3-3.6 3.6a2 2 0 0 1-2.8 0l-.9-.9-2.6 2.6a1.6 1.6 0 1 1-2.2-2.2l2.6-2.6-.5-.5a2.4 2.4 0 0 1 0-3.4zM4.4 8.9 2 11.3l1.4 1.4 1.3-1.3 2.6 2.6a3.6 3.6 0 0 0 5 5l.6.6a2 2 0 0 0 2.9 0l.5-.6-6.9-6.9z" />
    </svg>
  ),
  megaphone: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1zm14.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
    </svg>
  ),
  clock: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 5h-2v6l4.5 2.7 1-1.7-3.5-2z" />
    </svg>
  ),
  music: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 3.5a.9.9 0 0 0-1.1-.9l-8 1.7a.9.9 0 0 0-.7.9v8.7a3.4 3.4 0 1 0 1.8 3v-7.9l6.2-1.3v5.2a3.4 3.4 0 1 0 1.8 3z" />
    </svg>
  ),
  people: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 19c0-3 2.7-5 6-5s6 2 6 5v1H2zm14.5-5c2.4.4 4.5 2.2 4.5 5v1h-5v-1c0-1.9-.8-3.6-2-4.7z" />
    </svg>
  ),
  building: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 21V8.5L12 3l8 5.5V21zm5-3h2v-3H9zm4 0h2v-3h-2zM9 12h2V9H9zm4 0h2V9h-2z" />
    </svg>
  ),
}
