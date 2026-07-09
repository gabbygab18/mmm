import Link from 'next/link'

/**
 * Marketing landing page — matches the approved "Bringing Music to Memory Care" design.
 * All CTAs (header Sign in, Get Started, hero Sign in) route to the sign-in page (/login).
 * Button visuals use the design pack's exported button assets.
 */

const FEATURES = [
  {
    img: '/landing/card-musicians.png',
    alt: 'A volunteer musician playing an acoustic guitar',
    title: 'For Musicians',
    body: 'Share your availability, browse nearby memory care centers, and schedule meaningful volunteer performances in your community.',
  },
  {
    img: '/landing/card-centers.png',
    alt: 'A caregiver sitting with two smiling residents',
    title: 'For Memory Care Centers',
    body: 'Find local volunteer musicians, coordinate scheduling, and bring joyful live music to your residents with ease.',
  },
  {
    img: '/landing/card-free.png',
    alt: 'An older couple smiling together',
    title: 'Always Free',
    body: 'This platform is built entirely to facilitate volunteer connections — no fees, no commissions, no hidden costs.',
  },
]

function Social({ label, href, iconSrc }: { label: string; href: string; iconSrc: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-20 w-20 items-center justify-center transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-900"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="" className="h-full w-full object-contain" />
    </a>
  )
}

export default function Home() {
  const year = new Date().getFullYear()

  return (
    <main className="bg-ocean-900 font-sans">
      {/* ============ Header ============ */}
      <header className="relative z-20 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3" aria-label="Margaret's MemoryCare Music home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/logo.png" alt="Margaret's MemoryCare Music" className="h-14 w-auto" width={112} height={113} />
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-ocean-700 px-7 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-ocean-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        {/* Photo */}
        <div className="landing-hero-photo absolute inset-0" aria-hidden="true" />
        {/* Light blue duotone — keeps the photo bright while unifying the colour */}
        <div className="absolute inset-0 bg-ocean-600/20 mix-blend-multiply" aria-hidden="true" />
        {/* Subtle extra tint on the left so the headline stays legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(7,37,68,0.78) 0%, rgba(7,37,68,0.42) 30%, rgba(9,44,86,0.12) 54%, rgba(9,44,86,0.0) 72%)',
          }}
          aria-hidden="true"
        />
        {/* Fade only the very bottom of the photo into the blue section */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 68%, rgba(7,37,68,0.55) 90%, #072544 100%)' }}
          aria-hidden="true"
        />
        {/* Musical-notes texture (treble clef on the left, staff swirling right) */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-40 mix-blend-screen"
          style={{
            backgroundImage: "url('/landing/notes-center.png')",
            backgroundSize: '140%',
            backgroundPosition: 'center bottom -1200px',
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div
          className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-48 sm:pb-28 sm:pt-56 lg:grid-cols-[1.45fr_1fr] lg:pb-36 lg:pt-64"
          style={{ transform: 'translateY(60px)' }}
        >
          <div>
            <h1 className="landing-rise">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/hero-title.png"
                alt="Bringing Music to Memory Care"
                className="w-full max-w-[600px] drop-shadow"
                width={790}
                height={268}
              />
            </h1>
            <p className="landing-rise landing-delay-1 mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/hero-subtitle.png"
                alt="Connect volunteer musicians with memory care facilities for meaningful, no-cost live performances that uplift residents every day."
                className="w-full max-w-[480px] drop-shadow"
                width={815}
                height={217}
              />
            </p>
          </div>

          <div className="landing-rise landing-delay-2 flex flex-col items-center gap-5 lg:mt-40 lg:self-start">
            <Link
              href="/login"
              aria-label="Get started — it's free"
              className="group inline-block self-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/btn-get-started.png"
                alt="Get started — it's free"
                className="h-[54px] w-auto drop-shadow-xl transition group-hover:-translate-y-0.5 sm:h-[62px]"
              />
            </Link>
            <Link
              href="/login"
              aria-label="Sign in"
              className="group inline-block self-center rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/btn-signin.png"
                alt="Sign in"
                className="h-[54px] w-auto drop-shadow-xl transition group-hover:-translate-y-0.5 sm:h-[62px]"
              />
            </Link>
          </div>
        </div>

      </section>

      {/* ============ Features (blue section) ============ */}
      <section className="relative bg-gradient-to-b from-ocean-800 via-ocean-900 to-ocean-950 px-6 pb-16 pt-10 sm:pb-20">
        {/* Bright light-streak wave — bridges the hero/blue seam. Sits above the blue background (paints after
            the section's own bg) but below the cards and notes (they get z-10, this stays at the default z-0). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/wave.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 w-full -translate-y-[70%] rotate-2 select-none"
          width={1080}
          height={929}
        />

        {/* Note decorations */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/notes-ur.png" alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-6 z-10 w-44 opacity-30 sm:w-64" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/notes-bl.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-6 left-0 z-10 w-44 opacity-30 sm:w-64" />

        <div className="relative z-10 mx-auto mt-40 grid max-w-6xl gap-6 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className={`landing-rise landing-delay-${i + 1} relative overflow-hidden rounded-[2.5rem] shadow-xl`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.img} alt={f.alt} className="block w-full h-auto" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 top-[55%] flex flex-col items-center justify-start px-6 pb-6 pt-2 text-center">
                <h2 className="text-lg font-extrabold uppercase tracking-wider text-ocean-800">{f.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ocean-700">{f.body}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Social links */}
        <div className="relative mt-14 flex justify-center -space-x-8">
          <Social label="Facebook" href="#" iconSrc="/landing/fb-logo.png" />
          <Social label="Instagram" href="#" iconSrc="/landing/ig-logo.png" />
          <Social label="YouTube" href="#" iconSrc="/landing/yt-logo.png" />
          <Social label="TikTok" href="#" iconSrc="/landing/tiktok-logo.png" />
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="bg-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-ocean-800/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Margaret&apos;s MemoryCare Music · Connecting communities through music</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="transition hover:text-ocean-800">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-ocean-800">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}