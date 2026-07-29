import type { Metadata } from 'next'

/**
 * Coming Soon placeholder (approved design pack).
 * Shown site-wide while the COMING_SOON env flag is enabled — see middleware.ts.
 * Standalone: no marketing header/footer, no auth.
 */

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
      className="relative flex min-h-screen flex-col overflow-hidden font-poppins text-[#12385f]"
      style={{
        background:
          'linear-gradient(180deg,#fdfbf5 0%,#f6fafd 34%,#eaf3fb 54%,#d9ebfa 72%,#cfe6fa 100%)',
      }}
    >
      {/* Art layer — flowing notes / atmosphere from the brand pack */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-top opacity-90"
        style={{ backgroundImage: "url('/coming-soon/bg-color.png')" }}
        aria-hidden="true"
      />

      {/* Comforting hands, top-right, softly faded in */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/coming-soon/hands.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-[-2%] z-[1] w-[min(46vw,620px)] select-none"
        style={{
          opacity: 0.55,
          WebkitMaskImage: 'linear-gradient(200deg,#000 45%,transparent 88%)',
          maskImage: 'linear-gradient(200deg,#000 45%,transparent 88%)',
        }}
      />

      {/* Content */}
      <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-6 pb-[22vh] pt-[6vh] text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/logo.png"
          alt="Margaret's MemoryCare Music"
          className="mb-6 h-[clamp(96px,13vw,140px)] w-auto"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/coming-soon/coming-soon.png" alt="Coming Soon" className="mb-3.5 w-[min(78vw,360px)]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/coming-soon/divider.png" alt="" aria-hidden="true" className="mb-6 w-[min(52vw,214px)]" />
        <p className="mx-auto max-w-[640px] text-[clamp(15px,1.35vw,19.5px)] leading-[1.65]">
          We&rsquo;re working behind the scenes to bring you a website that connects musicians, memory care
          communities, and families through the power of live music.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coming-soon/thankyou.png"
          alt="Thank you for your patience and support!"
          className="mt-10 w-[min(74vw,440px)]"
        />
      </div>

      {/* Wave footer with social links */}
      <footer className="relative z-[2] mt-auto">
        <svg
          className="block h-[clamp(70px,12vw,150px)] w-full"
          viewBox="0 0 1440 150"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mmmWaveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10416f" />
              <stop offset="100%" stopColor="#0a2f5a" />
            </linearGradient>
          </defs>
          <path
            d="M0,66 C240,26 480,102 720,74 C960,46 1200,104 1440,70 L1440,150 L0,150 Z"
            fill="#ffffff"
            opacity="0.55"
          />
          <path
            d="M0,84 C260,44 520,118 780,90 C1020,64 1240,116 1440,86 L1440,150 L0,150 Z"
            fill="#cfe3f6"
            opacity="0.75"
          />
          <path
            d="M0,98 C260,62 520,128 800,104 C1050,82 1250,124 1440,100 L1440,150 L0,150 Z"
            fill="url(#mmmWaveFill)"
          />
        </svg>

        <div className="-mt-px flex flex-col items-center gap-[18px] px-6 pb-[clamp(26px,5vw,52px)] pt-1"
             style={{ background: 'linear-gradient(180deg,#10416f 0%,#0a2f5a 100%)' }}>
          <div className="flex flex-wrap items-center justify-center gap-[18px] max-[640px]:flex-col max-[640px]:gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/coming-soon/follow-us.png" alt="Follow us:" className="h-[22px] w-auto" />
            <div className="flex items-center gap-[clamp(14px,2vw,24px)]">
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
                  <img src={s.icon} alt={s.label} className="block h-auto w-[clamp(44px,4.4vw,56px)]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
