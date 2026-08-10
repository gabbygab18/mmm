'use client'

import { ReactNode, useState } from 'react'

/**
 * Shared building blocks for the Edit Profile page (musician + facility) —
 * a single scrolling page of numbered sections, matching the approved
 * design. Deliberately separate from the registration wizard's own helpers
 * (musician-wizard.tsx / facility-wizard.tsx): those still power first-time
 * onboarding (with its account-creation step and Volunteer Agreement), while
 * this is edit-only for an already-complete profile — no wizard chrome, no
 * re-attesting the agreement.
 */

export const editInputClass =
  'w-full rounded-lg border border-ocean-300 bg-white px-4 py-2.5 font-poppins text-[12.5px] text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400'
export const editLabelClass = 'mb-1.5 block font-poppins text-[12.5px] font-bold text-ocean-900'

export function EditField({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className={editLabelClass}>{label}</span>
      {children}
    </div>
  )
}

/** Numbered navy circle + Cormorant Garamond section heading, exactly the
    "1 Getting Started" pattern repeated across all four sections. */
export function SectionCard({
  number,
  title,
  subtitle,
  children,
}: {
  number: number
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-ocean-200/70 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-900 font-poppins text-[13px] font-bold text-white">
          {number}
        </span>
        <div>
          <h2 className="font-garamond text-[24.7px] font-bold leading-tight text-ocean-900">{title}</h2>
          <p className="font-poppins text-[12.5px] text-ocean-900/70">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/**
 * The page header + identity strip together — the blue gradient banner
 * ("Edit Profile" / "Update your information below.") plus the white
 * identity card (name, role, bio preview, contact icons) with the site's
 * music-note watermark bleeding in from the right, matching the approved
 * design pack and the WelcomeBanner treatment used elsewhere in the
 * dashboard.
 */
export function EditProfileHeader({
  subheading,
  name,
  roleLabel,
  bioLine,
  email,
  phone,
  locationLabel,
}: {
  subheading: string
  name: string
  roleLabel: string
  bioLine?: string
  email: string
  phone: string
  locationLabel: string
}) {
  return (
    <>
      <div
        className="rounded-2xl px-6 py-7 shadow-sm sm:px-9 sm:py-8"
        style={{ background: 'linear-gradient(120deg, #2f6ba8 0%, #6fa3d4 100%)' }}
      >
        <h1 className="font-garamond text-[26px] font-bold leading-tight text-white drop-shadow-sm sm:text-[32.3px]">
          Edit Profile
        </h1>
        <p className="mt-1 font-poppins text-[13px] text-white/90 sm:text-[15px]">{subheading}</p>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-ocean-200/70 bg-white px-5 py-5 sm:px-7">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[45%] opacity-30"
          style={{
            backgroundImage: "url('/mmm/notes-bg.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-garamond text-[26px] font-bold leading-tight text-ocean-900 sm:text-[32.3px]">{name}</h2>
            <p className="font-poppins text-[13.5px] font-bold text-ocean-900 sm:text-[15px]">{roleLabel}</p>
            {bioLine && <p className="mt-1 max-w-[440px] font-poppins text-[12.5px] italic text-ocean-900/70">{bioLine}</p>}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <span className="flex items-center gap-2 font-poppins text-[12.5px] text-ocean-900">
              <ContactIcon kind="email" /> {email}
            </span>
            <span className="flex items-center gap-2 font-poppins text-[12.5px] text-ocean-900">
              <ContactIcon kind="phone" /> {phone}
            </span>
            <span className="flex items-center gap-2 font-poppins text-[12.5px] text-ocean-900">
              <ContactIcon kind="location" /> {locationLabel}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

/** Pill checkbox — Preferred Days, Preferred Time, Performance Type, etc. */
export function CheckPill({
  label,
  checked,
  onChange,
  className = '',
}: {
  label: string
  checked: boolean
  onChange: () => void
  className?: string
}) {
  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 font-poppins text-[11.5px] font-bold text-ocean-900 transition ${
        checked ? 'border-ocean-800 bg-ocean-100' : 'border-ocean-300 bg-white hover:border-ocean-500'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
      />
      {label}
    </label>
  )
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** Month calendar for picking unavailable dates. */
export function UnavailableCalendar({ selected, onToggle }: { selected: string[]; onToggle: (iso: string) => void }) {
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const firstDow = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const daysInPrev = new Date(view.y, view.m, 0).getDate()
  const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate())

  const cells: { day: number; iso: string; inMonth: boolean }[] = []
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i
    cells.push({ day: d, iso: isoDate(view.m === 0 ? view.y - 1 : view.y, (view.m + 11) % 12, d), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, iso: isoDate(view.y, view.m, d), inMonth: true })
  let trailing = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing, iso: isoDate(view.m === 11 ? view.y + 1 : view.y, (view.m + 1) % 12, trailing), inMonth: false })
    trailing++
  }

  const changeMonth = (delta: number) =>
    setView(({ y, m }) => {
      const next = m + delta
      if (next < 0) return { y: y - 1, m: 11 }
      if (next > 11) return { y: y + 1, m: 0 }
      return { y, m: next }
    })

  return (
    <div className="rounded-xl border border-ocean-300 bg-white px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ocean-900 transition hover:bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <p className="font-poppins text-[12.5px] font-bold text-ocean-900">
          {MONTH_NAMES[view.m]} {view.y}
        </p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ocean-900 transition hover:bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="py-1 font-poppins text-[11px] font-bold text-ocean-900">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          const isSelected = selected.includes(cell.iso)
          const isPast = cell.iso < todayIso
          const disabled = !cell.inMonth || isPast
          return (
            <button
              key={`${cell.iso}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(cell.iso)}
              aria-pressed={isSelected}
              aria-label={`${cell.iso}${isSelected ? ' — unavailable' : ''}`}
              className={`mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full font-poppins text-[11px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                isSelected
                  ? 'bg-ocean-800 font-bold text-white'
                  : disabled
                    ? 'cursor-default text-ocean-300'
                    : 'text-ocean-700 hover:bg-ocean-100'
              }`}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Envelope / phone / pin line icons for the identity strip's contact row. */
const CONTACT_ICON_SRC: Record<'email' | 'phone' | 'location', string> = {
  email: '/mmm/edit-profile/icon-email.png',
  phone: '/mmm/edit-profile/icon-phone.png',
  location: '/mmm/edit-profile/icon-location.png',
}

/** The exact icon assets from the approved design pack. */
export function ContactIcon({ kind }: { kind: 'email' | 'phone' | 'location' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={CONTACT_ICON_SRC[kind]} alt="" className="h-4 w-4 object-contain" />
}

/** Cancel / Save Changes footer bar, sticky at the bottom of the form. */
export function EditProfileFooter({
  onCancel,
  saving,
  error,
}: {
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  return (
    <div className="mt-8 border-t border-ocean-200/70 pt-6">
      {error && <p className="mb-4 font-poppins text-[12.5px] font-medium text-red-600">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border-[1.5px] border-ocean-800 bg-white px-8 py-2.5 font-poppins text-[13px] font-bold text-ocean-900 transition hover:bg-ocean-900/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-ocean-900 px-8 py-2.5 font-poppins text-[13px] font-bold text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.25)] transition hover:bg-ocean-800 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
