import type { ReactNode } from 'react'
import { SOCIAL_URLS } from '@/lib/mmm/social'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

/**
 * Shared shell for the auth pages (/login, /register/*) — matches the
 * approved landing-page design pack: a photo hero washed in ocean blue with
 * the musical-notes texture, a warm cream form card, the round social icons.
 *
 * Header and footer are the same MarketingHeader/MarketingFooter every
 * informational page uses — these used to be a bespoke logo-only header and
 * a 2-link footer, which is exactly the inconsistency flagged in UX
 * feedback: reuse the shared chrome, don't hand-roll a second copy of it.
 *
 * Layout:
 *  - Desktop (lg+): full-bleed photo behind everything; card on the left,
 *    `aside` content (quote / info cards) on the right.
 *  - Mobile: photo strip on top fading into the blue, `aside` overlapping the
 *    fade, card centered below, then socials + footer.
 */

const SOCIALS = [
  { label: 'Facebook', href: SOCIAL_URLS.facebook, iconSrc: '/landing/fb-logo.png' },
  { label: 'Instagram', href: SOCIAL_URLS.instagram, iconSrc: '/landing/ig-logo.png' },
  { label: 'YouTube', href: SOCIAL_URLS.youtube, iconSrc: '/landing/yt-logo.png' },
  { label: 'TikTok', href: SOCIAL_URLS.tiktok, iconSrc: '/landing/tiktok-logo.png' },
]

type AuthShellProps = {
  /** Hero photo shown behind the page (desktop) / on top (mobile). */
  photoSrc: string
  photoAlt: string
  /** CSS object-position for the desktop full-bleed photo. */
  photoPositionDesktop?: string
  /** Tailwind height classes for the mobile photo strip. */
  mobilePhotoHeightClassName?: string
  /** How far the aside pulls up over the mobile photo fade. */
  asideOverlapClassName?: string
  /** Right-hand content on desktop (quote, info cards…). */
  aside: ReactNode
  /** Extra classes for the aside wrapper on desktop (alignment). */
  asideDesktopClassName?: string
  /** Which side the cream card sits on for desktop. */
  cardSide?: 'left' | 'right'
  /** The cream form card. */
  children: ReactNode
}

export function AuthShell({
  photoSrc,
  photoAlt,
  photoPositionDesktop = 'center 30%',
  mobilePhotoHeightClassName = 'h-64 sm:h-80',
  asideOverlapClassName = '-mt-14',
  aside,
  asideDesktopClassName = 'lg:self-end lg:justify-self-end lg:pb-12',
  cardSide = 'left',
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ocean-950 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <main className="relative flex-1 overflow-hidden">
        {/* Blue base */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-ocean-700 via-ocean-900 to-ocean-950"
          aria-hidden="true"
        />

        {/* Desktop full-bleed photo */}
        <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoSrc}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: photoPositionDesktop }}
          />
          {/* Light blue duotone — unify the photo colour without losing brightness */}
          <div className="absolute inset-0 bg-ocean-600/25 mix-blend-multiply" />
          {/* Deeper tint on the left so the card sits comfortably */}
          <div
            className="absolute inset-0"
            style={{
              background:
                cardSide === 'left'
                  ? 'linear-gradient(100deg, rgba(7,37,68,0.72) 0%, rgba(7,37,68,0.45) 32%, rgba(9,44,86,0.14) 58%, rgba(9,44,86,0.05) 100%)'
                  : 'linear-gradient(260deg, rgba(7,37,68,0.72) 0%, rgba(7,37,68,0.45) 32%, rgba(9,44,86,0.14) 58%, rgba(9,44,86,0.05) 100%)',
            }}
          />
          {/* Fade the bottom into the blue so socials/footer blend in */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent 62%, rgba(7,37,68,0.7) 88%, #03182f 100%)',
            }}
          />
        </div>

        {/* Musical-notes texture across the blue */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-30 mix-blend-screen"
          style={{ backgroundImage: "url('/landing/notes-center.png')", backgroundPosition: 'center' }}
          aria-hidden="true"
        />

        {/* Mobile photo strip */}
        <div className={`relative lg:hidden ${mobilePhotoHeightClassName}`} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} alt={photoAlt} className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-ocean-600/20 mix-blend-multiply" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent 45%, rgba(15,59,107,0.55) 78%, #0f3b6b 100%)',
            }}
          />
        </div>

        {/* ============ Content ============ */}
        <div
          className={`relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-8 lg:grid lg:min-h-[620px] lg:items-center lg:gap-14 lg:py-16 ${
            cardSide === 'left'
              ? 'lg:grid-cols-[minmax(0,26.5rem)_minmax(0,1fr)]'
              : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,26.5rem)]'
          }`}
        >
          {/* Aside — above the card on mobile, right column on desktop */}
          <div
            className={`order-1 ${asideOverlapClassName} lg:mt-0 ${cardSide === 'left' ? 'lg:order-2' : 'lg:order-1'} ${asideDesktopClassName}`}
          >
            {aside}
          </div>

          {/* Cream card */}
          <div
            className={`order-2 mt-8 flex justify-center lg:mt-0 ${
              cardSide === 'left' ? 'lg:order-1 lg:justify-start' : 'lg:order-2 lg:justify-end'
            }`}
          >
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#fdf9f0] to-cream p-7 shadow-2xl sm:p-9">
              {children}
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="relative z-10 flex justify-center -space-x-5 pb-8 pt-2 lg:pb-10">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
              className="flex h-16 w-16 items-center justify-center transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.iconSrc} alt="" className="h-full w-full object-contain" />
            </a>
          ))}
        </div>
      </main>

      <MarketingFooter variant="simple" />
    </div>
  )
}
