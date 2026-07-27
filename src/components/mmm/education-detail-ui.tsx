import Link from 'next/link'
import { ReactNode } from 'react'

/**
 * Shared building blocks for the "Science and Impact of Music" education detail
 * pages (Science of Music · Music and the Brain · Benefits of Live Music ·
 * Understanding Memory & Dementia), per the approved MMM design from Tria.
 *
 * Layout per mockup:
 *   1. Full-bleed photo banner
 *   2. Cream title band with the wavy music-staff artwork + centred Garamond title
 *   3. Blue body: a subtitle line, then light cards / navy feature bands
 *   4. Blue source bar (source links + Back) → shared cream copyright strip
 *
 * Body blue, card gradient and navy-band gradient are shared here so the four
 * pages stay identical in chrome and only differ in content.
 */

export const EDU_BODY_BG = 'linear-gradient(180deg, #4c7bb0 0%, #3a689f 45%, #2c5788 100%)'
const CARD_BG = 'linear-gradient(135deg, #ffffff 0%, #eef4fa 55%, #d9e6f4 100%)'
const NAVY_BAND_BG = 'linear-gradient(160deg, #123f6e 0%, #0d3360 55%, #082846 100%)'

/** Photo banner + cream title band. Content (blue body) follows on the page. */
export function EduDetailHero({
  photo,
  photoAlt = '',
  title,
}: {
  photo: string
  photoAlt?: string
  title: ReactNode
}) {
  return (
    <section>
      {/* 1. Photo banner — assets are pre-cropped wide banners, shown whole (no gaps). */}
      <div className="relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={photoAlt} className="block w-full" />
      </div>

      {/* 2. Title band — cream fading to light blue, wavy staff behind the title */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(100deg, #faf4e7 0%, #eaf1f9 55%, #d7e6f5 100%)' }}>
        <div
          className="pointer-events-none absolute inset-0 bg-repeat-x opacity-90"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundSize: 'auto 118%', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1200px] items-center justify-center px-5 py-6 sm:py-8">
          <h1 className="text-center font-garamond text-[30px] font-semibold leading-tight text-ocean-800 drop-shadow-sm sm:text-[40.7px]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  )
}

/** Medium-blue subtitle line that opens the body. */
export function EduSubtitle({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto max-w-[1000px] text-center font-poppins text-[15px] font-medium leading-relaxed text-white sm:text-[20.9px]">
      {children}
    </p>
  )
}

/** Light rounded content card (white → soft blue). */
export function EduCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[26px] px-6 py-8 shadow-xl sm:px-10 sm:py-10 ${className}`} style={{ background: CARD_BG }}>
      {children}
    </div>
  )
}

/** Deep-navy feature band (Did You Know / Brain Areas / Helpful Tips). */
export function EduNavyBand({
  children,
  className = '',
  withStaff = false,
}: {
  children: ReactNode
  className?: string
  withStaff?: boolean
}) {
  return (
    <div className={`relative overflow-hidden rounded-[26px] px-6 py-9 shadow-xl sm:px-10 sm:py-11 ${className}`} style={{ background: NAVY_BAND_BG }}>
      {withStaff && (
        <div
          className="pointer-events-none absolute inset-0 bg-repeat-x opacity-20 mix-blend-screen"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundSize: 'auto 130%', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

/** Section heading (dark, on light cards). */
export function EduH2({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-garamond text-[26px] font-bold text-ocean-800 sm:text-[35.7px] ${className}`}>{children}</h2>
}

/** Small inline source-citation link, shown under a claim (as in the mockup). */
export function EduSourceInline({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-poppins text-[10px] text-ocean-500 underline decoration-ocean-300 underline-offset-2 transition hover:text-ocean-700 sm:text-[10.1px]"
    >
      {href}
    </a>
  )
}

/** Bottom source bar: "Source:" + reference URLs on the left, Back button on the right. */
export function EduSourceBar({ sources, backHref = '/why-music-matters' }: { sources: string[]; backHref?: string }) {
  return (
    <div className="mt-12 flex flex-col gap-5 border-t border-white/25 pt-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="font-poppins text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">Source:</p>
        <ul className="mt-1 space-y-0.5">
          {sources.map((s) => (
            <li key={s}>
              <a
                href={s}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-poppins text-[10px] text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white sm:text-[10.1px]"
              >
                {s}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={backHref}
        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border-[1.5px] border-white bg-white/95 px-6 py-2 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-800 shadow-md transition hover:bg-white sm:self-auto"
      >
        &larr; Back
      </Link>
    </div>
  )
}
