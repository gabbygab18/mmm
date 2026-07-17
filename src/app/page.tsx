import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

/**
 * Homepage — "Bringing Music to Memory Care" (approved design, July 2026 pack).
 * Sections: Hero · How It Works · Choose Your Path · Why Music Matters · Footer.
 */

const STEPS = [
  {
    n: 1,
    icon: '/mmm/icon-musicians-join.png',
    title: 'Musicians Join',
    body: 'Talented volunteers sign up and create their profile.',
  },
  {
    n: 2,
    icon: '/mmm/icon-facilities-request.png',
    title: 'Facilities Request Performances',
    body: 'Memory care communities find musicians and request live music.',
  },
  {
    n: 3,
    icon: '/mmm/icon-residents-enjoy.png',
    title: 'Residents Enjoy Live Music',
    body: 'Meaningful moments of joy, connection, and comfort.',
  },
]

const BENEFITS = [
  { icon: '/mmm/icon-mood.png', label: 'Improve mood' },
  { icon: '/mmm/icon-social.png', label: 'Encourage Social Interaction' },
  { icon: '/mmm/icon-memories.png', label: 'Spark Memories' },
  { icon: '/mmm/icon-anxiety.png', label: 'Reduce Anxiety' },
]

export default function Home() {
  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden" id="about">
        {/* Photo */}
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: "url('/mmm/home-hero.png')", backgroundPosition: 'center 30%' }}
          aria-hidden="true"
        />
        {/* Left tint so the headline stays legible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(7,37,68,0.82) 0%, rgba(9,44,86,0.45) 34%, rgba(9,44,86,0.10) 58%, rgba(9,44,86,0) 75%)',
          }}
          aria-hidden="true"
        />
        {/* Music-notes texture, lower left */}
        <div
          className="absolute inset-x-0 bottom-0 h-64 bg-no-repeat opacity-50 mix-blend-screen"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundSize: '900px auto', backgroundPosition: 'left -60px bottom' }}
          aria-hidden="true"
        />
        {/* Light streak wave along the bottom edge */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mmm/streak.png"
          alt=""
          aria-hidden="true"
          className="landing-wave-glow pointer-events-none absolute bottom-0 left-1/2 w-[130%] max-w-none -translate-x-1/2 translate-y-[35%] select-none"
        />

        <div className="relative mx-auto flex min-h-[560px] max-w-[1200px] flex-col justify-center px-6 py-20 sm:px-8 lg:min-h-[640px]">
          <h1 className="landing-rise max-w-[640px] font-garamond text-[44px] font-semibold leading-[1.05] text-white drop-shadow-md sm:text-[58px] lg:text-[67px]">
            Bringing Music to Memory Care
          </h1>
          <p className="landing-rise landing-delay-1 mt-6 max-w-[520px] font-poppins text-[16px] leading-relaxed text-white drop-shadow sm:text-[19.7px]">
            Connecting volunteer musicians with memory care communities throughout Palm Beach County, creating
            meaningful moments through live music at no cost.
          </p>

          <div className="landing-rise landing-delay-2 mt-10 flex flex-col items-start gap-4 sm:absolute sm:bottom-36 sm:right-8 sm:mt-0 sm:items-center lg:right-16">
            <Link
              href="/get-started"
              className="rounded-lg bg-[#faf4e7] px-10 py-3 text-center font-poppins text-[17px] font-bold tracking-[0.14em] text-ocean-900 shadow-lg transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Get Started–It&apos;s Free!
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-ocean-300/80 px-12 py-2.5 text-center font-poppins text-[17px] font-bold uppercase tracking-[0.2em] text-white shadow-[inset_0_-2px_5px_rgba(7,37,68,0.35)] backdrop-blur-sm transition hover:bg-ocean-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ============ How It Works ============ */}
      <section
        id="how-it-works"
        className="relative"
        style={{ background: 'linear-gradient(120deg, #faf4e7 0%, #eaf1f8 45%, #cfe0ef 100%)' }}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-14 sm:px-8">
          <h2 className="text-center font-poppins text-[18.2px] font-bold uppercase tracking-[0.12em] text-ocean-900">
            How It Works
          </h2>

          <div className="mt-10 grid items-start gap-10 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="contents">
                <div className="flex flex-col items-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={step.icon} alt="" className="h-48 w-48 object-contain" />
                  <h3 className="mt-6 max-w-[220px] font-garamond text-[20px] font-bold leading-snug text-ocean-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[240px] font-poppins text-[11.4px] leading-relaxed text-ocean-900/90">
                    {step.body}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden items-center justify-center self-center md:flex" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mmm/icon-arrow.png" alt="" className="h-8 w-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Choose Your Path ============ */}
      <section style={{ background: 'linear-gradient(180deg, #10416f 0%, #0a2f5a 100%)' }}>
        <div className="mx-auto grid max-w-[1080px] gap-8 px-6 py-16 sm:px-8 md:grid-cols-2">
          {/* Musician card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-ocean-200/60 shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/mmm/card-musician.png')" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[#faf4e7]/80" aria-hidden="true" />
            <div className="relative flex flex-col items-center px-8 py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-note.png" alt="" className="h-16 w-16 object-contain" />
              <h3 className="mt-4 font-garamond text-[20px] font-bold text-ocean-900">I&apos;m a Musician</h3>
              <p className="mt-1 font-poppins text-[11.4px] leading-relaxed text-ocean-900">
                Share your gift.
                <br />
                Become a volunteer.
              </p>
              <Link
                href="/register/musician"
                className="mt-5 rounded-lg border-[1.5px] border-ocean-800 px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
              >
                Join as Musician
              </Link>
            </div>
          </div>

          {/* Community card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-ocean-200/60 shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/mmm/card-community.png')" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-ocean-500/70" aria-hidden="true" />
            <div className="relative flex flex-col items-center px-8 py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-facility.png" alt="" className="h-16 w-16 object-contain" />
              <h3 className="mt-4 font-garamond text-[20px] font-bold leading-tight text-[#faf4e7]">
                I&apos;m a Memory Care Community
              </h3>
              <p className="mt-1 font-poppins text-[11.4px] leading-relaxed text-white">
                Bring meaningful live performances to your residents
              </p>
              <Link
                href="/signup"
                className="mt-5 rounded-lg bg-[#faf4e7] px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Register Your Facility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Why Music Matters ============ */}
      <section
        id="faq"
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a2f5a 0%, #072544 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundRepeat: 'no-repeat', backgroundSize: '1100px auto', backgroundPosition: 'left -80px top 20px' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 py-14 sm:px-8 lg:flex-row lg:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/icon-heart-clef.png" alt="" className="h-36 w-auto shrink-0 object-contain lg:h-44" />

          <div className="max-w-[420px] text-center lg:text-left">
            <h2 className="font-garamond text-[30.1px] font-bold text-white">Why Music Matters</h2>
            <p className="mt-3 font-poppins text-[13.8px] leading-relaxed text-white/95">
              Music has a unique ability to reach people living with dementia and memory loss.
            </p>
            <p className="mt-3 font-poppins text-[13.8px] leading-relaxed text-white/95">
              Research has shown that familiar songs can:
            </p>
          </div>

          <ul className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
            {BENEFITS.map((b) => (
              <li key={b.label} className="flex flex-col items-center gap-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.icon} alt="" className="h-16 w-16 object-contain" />
                <span className="max-w-[120px] font-poppins text-[13.8px] font-bold leading-snug text-white">{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingFooter variant="full" />
    </main>
  )
}