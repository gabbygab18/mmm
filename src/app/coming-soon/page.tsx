import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { SOCIAL_URLS } from '@/lib/mmm/social'

/**
 * Coming Soon placeholder — a 1:1 build of the approved design-pack mockup.
 * Shown site-wide while the coming-soon gate is active — see src/middleware.ts.
 * Standalone: no marketing header/footer, no auth, exactly one viewport tall.
 *
 * Scaling: the mockup is a fixed 1.473:1 poster, so from `poster` up every size is
 * a multiple of `--u` — one percent of the mockup's width. Taking the smaller of
 * 1vw and 1.473vh means the whole composition shrinks to fit short windows
 * instead of pushing the footer off-screen, and its proportions never drift.
 * Outside it the ratio cannot hold, so phones and portrait tablets get
 * their own stacked sizes.
 *
 * Asset notes (the filenames do not all describe their contents):
 *  - hands.png       → the full upper artwork: cream wash, comforting hands,
 *                      music-staff notes and the blue swoosh. Transparent below.
 *  - coming-soon.png → a raster of the body paragraph (unused: set as live
 *                      Poppins text so it stays sharp and selectable).
 *  - thankyou.png    → the script line. Stays a raster: "Authenia Textured"
 *                      is not a webfont, so there is no live-text equivalent.
 *  - bg-color.png    → a flat #003865 swatch (the brand navy), not a background.
 */

const NAVY = '#003865'

export const metadata: Metadata = {
  title: "Margaret's MemoryCare Music — Coming Soon",
  description:
    'We are working behind the scenes to connect musicians, memory care communities, and families through the power of live music.',
  robots: { index: false, follow: false },
}

const SOCIALS = [
  { label: 'Facebook', icon: '/coming-soon/fb.png', href: SOCIAL_URLS.facebook },
  { label: 'Instagram', icon: '/coming-soon/ig.png', href: SOCIAL_URLS.instagram },
  { label: 'YouTube', icon: '/coming-soon/yt.png', href: SOCIAL_URLS.youtube },
  { label: 'TikTok', icon: '/coming-soon/tiktok.png', href: SOCIAL_URLS.tiktok },
]

export default function ComingSoonPage() {
  return (
    <main
      className="relative flex h-[100dvh] flex-col overflow-hidden font-poppins"
      style={
        {
          '--u': 'min(1vw,1.473vh)',
          color: NAVY,
          background: 'linear-gradient(180deg,#fdfbf6 0%,#ffffff 46%,#f7fbff 74%,#eef6fe 100%)',
        } as CSSProperties
      }
    >
      {/* Upper artwork — hands, staff notes and swoosh, full-bleed from the top.
          Its height is measured in `--u` like everything else, so the swoosh stays
          level with the type on any aspect; it spans the full width regardless,
          which on very wide windows stretches the soft art a little rather than
          leaving gutters down the sides. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[calc(100vw*920/1100)] bg-[length:100%_100%] bg-top bg-no-repeat poster:h-[calc(var(--u)*83.6)]"
        style={{ backgroundImage: "url('/coming-soon/hands.png')" }}
        aria-hidden="true"
      />

      {/* Content — sits at the mockup's 8.8% mark on desktop, centred on phones */}
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center poster:justify-start poster:pb-[calc(var(--u)*2.72)] poster:pt-[calc(var(--u)*5.97)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/logo.png"
          alt="Margaret's MemoryCare Music"
          className="mb-4 h-[clamp(88px,26vw,160px)] w-auto poster:mb-[calc(var(--u)*1.77)] poster:h-[calc(var(--u)*12.8)]"
        />

        <h1 className="font-garamond font-bold uppercase leading-none tracking-[0.015em] text-[clamp(1.75rem,8.5vw,2.6rem)] poster:text-[calc(var(--u)*4.1)]">
          Coming Soon
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/divider.png"
          alt=""
          aria-hidden="true"
          className="mt-3 w-[44vw] poster:mt-[calc(var(--u)*1.63)] poster:w-[calc(var(--u)*19)]"
        />

        {/* Line breaks are pinned in the poster layout so the three lines match the mockup;
            below that the copy wraps naturally to the narrower screen. */}
        <p className="mt-4 max-w-[34rem] text-[1rem] font-normal leading-[1.32] poster:mt-[calc(var(--u)*1.49)] poster:max-w-none poster:text-[calc(var(--u)*1.5)]">
          We&rsquo;re working behind the scenes to bring you a website
          <br className="hidden poster:inline" /> that connects musicians, memory care communities,
          <br className="hidden poster:inline" /> and families through the power of live music.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/thankyou.png"
          alt="Thank you for your patience and support!"
          className="mt-8 w-[78vw] poster:mt-[calc(var(--u)*2.44)] poster:w-[calc(var(--u)*50)]"
        />
      </div>

      {/* Navy wave footer with social links */}
      <footer className="relative z-[2] mt-auto">
        {/* Top edge sweeps up to the right, as in the mockup: a soft white glow,
            a pale-blue ribbon, then the navy fill. */}
        <svg
          className="block h-[9vh] min-h-[52px] w-full poster:h-[calc(var(--u)*11.54)] poster:min-h-0"
          viewBox="0 0 1440 150"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M0,128 C300,120 720,52 1000,26 C1180,10 1320,2 1440,-6 L1440,170 L0,170 Z" fill="#ffffff" opacity="0.65" />
          <path d="M0,138 C300,131 720,65 1000,39 C1180,23 1320,14 1440,6 L1440,170 L0,170 Z" fill="#cfe4f7" opacity="0.85" />
          <path d="M0,147 C300,141 720,78 1000,52 C1180,36 1320,25 1440,17 L1440,170 L0,170 Z" fill={NAVY} />
        </svg>

        <div
          className="-mt-px flex h-[13vh] min-h-[96px] flex-col items-center gap-[2.4vh] px-6 poster:h-[calc(var(--u)*8.83)] poster:min-h-0 poster:gap-[calc(var(--u)*1.63)]"
          style={{ background: NAVY }}
        >
          <p className="-mt-[1.5vh] font-bold text-white text-[clamp(0.78rem,3.4vw,1rem)] poster:-mt-[calc(var(--u)*3.06)] poster:text-[calc(var(--u)*1.3)]">
            Follow us:
          </p>
          <div className="flex items-center gap-[clamp(12px,3.4vw,20px)] poster:gap-[calc(var(--u)*2.1)]">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-flex rounded-full transition duration-150 hover:-translate-y-[3px] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.icon}
                  alt={s.label}
                  className="block h-auto w-[clamp(38px,11vw,56px)] poster:w-[calc(var(--u)*4.3)]"
                />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
