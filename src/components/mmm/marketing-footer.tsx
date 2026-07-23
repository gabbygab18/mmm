import Link from 'next/link'

/**
 * Marketing footer, per the approved MMM design.
 * - "full": dark navy footer with logo, blurb, quick links, socials (homepage).
 * - "simple": cream copyright strip (inner pages).
 */

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: 'About Us', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Why Music Matters', href: '/why-music-matters' },
  { label: 'Education', href: '/education' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

const SOCIALS = [
  { label: 'Facebook', icon: '/mmm/icon-fb.png', href: '#' },
  { label: 'Instagram', icon: '/mmm/icon-ig.png', href: '#' },
  { label: 'YouTube', icon: '/mmm/icon-yt.png', href: '#' },
  { label: 'TikTok', icon: '/mmm/icon-tiktok.png', href: '#' },
]

function CopyrightBar() {
  return (
    <div className="bg-[#faf4e7] py-4">
      <p className="text-center font-poppins text-[10.7px] tracking-[0.08em] text-ocean-900">
        © 2026 Margaret&apos;s MemoryCare Music · All rights reserved.
      </p>
    </div>
  )
}

export function MarketingFooter({ variant = 'simple' }: { variant?: 'full' | 'simple' }) {
  if (variant === 'simple') {
    return (
      <footer>
        <CopyrightBar />
      </footer>
    )
  }

  return (
    <footer id="contact" className="bg-ocean-900">
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('/mmm/notes-bg.png')",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right -40px bottom -30px',
          backgroundSize: '520px auto',
        }}
      >
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-12 sm:px-8 md:grid-cols-[1.3fr_1fr_0.9fr_0.9fr]">
          {/* Brand */}
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mmm/logo.png"
              alt=""
              className="h-24 w-24 shrink-0 rounded-full bg-[#faf4e7] object-contain p-2 shadow-lg"
            />
            <p className="max-w-[240px] pt-2 font-poppins text-[13.8px] leading-relaxed text-white">
              Connecting communities through music to create moments of joy, connection, and comfort.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-poppins text-[13.8px] font-bold uppercase tracking-[0.12em] text-white">Quick Links</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-poppins text-[11.8px] text-white/90 transition hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-poppins text-[13.8px] font-bold uppercase tracking-[0.12em] text-white">Follow Us</h3>
            <div className="mt-4 flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.icon} alt="" className="h-9 w-9 object-contain" />
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-2 md:items-end md:pt-1">
            <Link href="/privacy" className="font-poppins text-[11.8px] tracking-[0.06em] text-white/90 transition hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-poppins text-[11.8px] tracking-[0.06em] text-white/90 transition hover:text-white hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      <CopyrightBar />
    </footer>
  )
}
