import type { Metadata } from 'next'

/**
 * Coming Soon placeholder — a 1:1 build of the approved design-pack mockup.
 * Shown site-wide while the coming-soon gate is active — see src/middleware.ts.
 * Standalone: no marketing header/footer, no auth.
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
  { label: 'Facebook', icon: '/coming-soon/fb.png', href: 'https://www.facebook.com/profile.php?id=61590198659207' },
  { label: 'Instagram', icon: '/coming-soon/ig.png', href: 'https://www.instagram.com/margaretsmemorycaremusic/' },
  { label: 'YouTube', icon: '/coming-soon/yt.png', href: 'https://www.youtube.com/@MargaretsMemorycareMusic' },
  { label: 'TikTok', icon: '/coming-soon/tiktok.png', href: 'https://www.tiktok.com/@margaretsmemorycaremusic' },
]

export default function ComingSoonPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col overflow-hidden font-poppins"
      style={{
        color: NAVY,
        background: 'linear-gradient(180deg,#fdfbf6 0%,#ffffff 46%,#f7fbff 74%,#eef6fe 100%)',
      }}
    >
      {/* Upper artwork — hands, staff notes and swoosh, full-bleed from the top.
          Width-driven so the swoosh keeps its mockup proportions on wide screens. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 aspect-[1100/920] bg-[length:100%_100%] bg-top bg-no-repeat"
        style={{ backgroundImage: "url('/coming-soon/hands.png')" }}
        aria-hidden="true"
      />

      {/* Content — starts at the mockup's 8.8% mark rather than optically centred */}
      <div className="relative z-[2] flex flex-1 flex-col items-center px-6 pb-[4vh] pt-[8.8vh] text-center max-md:justify-center max-md:pt-[6vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/logo.png"
          alt="Margaret's MemoryCare Music"
          className="mb-[2.6vh] h-[clamp(100px,12.8vw,198px)] w-auto"
        />

        <h1 className="font-garamond font-bold uppercase leading-none tracking-[0.015em] text-[clamp(1.95rem,4.1vw,5.1rem)]">
          Coming Soon
        </h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/divider.png"
          alt=""
          aria-hidden="true"
          className="mt-[2.4vh] w-[min(19vw,382px)] max-md:mt-3 max-md:w-[44vw]"
        />

        {/* Line breaks are pinned from md up so the three lines match the mockup;
            below that the copy wraps naturally to the narrower screen. */}
        <p className="mt-[2.2vh] max-w-[min(46vw,900px)] text-[clamp(1rem,1.5vw,1.85rem)] font-normal leading-[1.32] max-md:max-w-full">
          We&rsquo;re working behind the scenes to bring you a website
          <br className="max-md:hidden" /> that connects musicians, memory care communities,
          <br className="max-md:hidden" /> and families through the power of live music.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/thankyou.png"
          alt="Thank you for your patience and support!"
          className="mt-[3.6vh] w-[min(50vw,860px)] max-md:mt-8 max-md:w-[78vw]"
        />
      </div>

      {/* Navy wave footer with social links */}
      <footer className="relative z-[2] mt-auto">
        {/* Top edge sweeps up to the right, as in the mockup: a soft white glow,
            a pale-blue ribbon, then the navy fill. */}
        <svg
          className="block h-[17vh] min-h-[68px] w-full"
          viewBox="0 0 1440 150"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M0,128 C300,120 720,52 1000,26 C1180,10 1320,2 1440,-6 L1440,150 L0,150 Z" fill="#ffffff" opacity="0.65" />
          <path d="M0,138 C300,131 720,65 1000,39 C1180,23 1320,14 1440,6 L1440,150 L0,150 Z" fill="#cfe4f7" opacity="0.85" />
          <path d="M0,147 C300,141 720,78 1000,52 C1180,36 1320,25 1440,17 L1440,150 L0,150 Z" fill={NAVY} />
        </svg>

        <div
          className="-mt-px flex h-[13vh] min-h-[104px] flex-col items-center gap-[2.4vh] px-6"
          style={{ background: NAVY }}
        >
          <p className="-mt-[4.5vh] font-bold text-white text-[clamp(0.8rem,1.3vw,1.6rem)]">Follow us:</p>
          <div className="flex items-center gap-[clamp(14px,2.1vw,42px)]">
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
                <img src={s.icon} alt={s.label} className="block h-auto w-[clamp(40px,4.3vw,86px)]" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
