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

function Social({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ocean-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-ocean-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-900"
    >
      {children}
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
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
          style={{ backgroundImage: "url('/landing/notes-center.png')" }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-44 pt-20 sm:pb-56 sm:pt-24 lg:grid-cols-[1.45fr_1fr] lg:pb-64 lg:pt-28">
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

          <div className="landing-rise landing-delay-2 flex flex-col items-stretch gap-5 sm:items-end lg:mt-24 lg:self-start">
            <Link
              href="/login"
              aria-label="Get started — it's free"
              className="group inline-block self-start rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-800 sm:self-end"
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
              className="group inline-block self-start rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-800 sm:self-end"
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

        <div className="relative z-10 mx-auto mt-24 grid max-w-6xl gap-6 sm:grid-cols-3">
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
        <div className="relative mt-14 flex justify-center gap-5">
          <Social label="Facebook" href="#">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
          </Social>
          <Social label="Instagram" href="#">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z"/></svg>
          </Social>
          <Social label="YouTube" href="#">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </Social>
          <Social label="TikTok" href="#">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </Social>
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