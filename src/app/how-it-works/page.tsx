import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

export const metadata: Metadata = {
  title: "How It Works | Margaret's MemoryCare Music",
  description:
    'Two paths, one mission: how volunteer musicians and memory care communities use Margaret’s Memorycare Music to bring live music to residents.',
}

const MUSICIAN_STEPS = [
  { title: 'Register', body: 'Create your musician account in minutes.' },
  { title: 'Complete Profile', body: 'Tell us about yourself, your music, and experience.' },
  { title: 'Set Availability', body: 'Choose the days and times you’re available to perform.' },
  { title: 'Receive Requests', body: 'Facilities will send performance requests.' },
  { title: 'Accept', body: 'Accept the requests that work for you.' },
  { title: 'Perform', body: 'Bring joy through live music!' },
  { title: 'Track Volunteer Hours', body: 'We track your hours so you can see your impact.' },
]

const FACILITY_STEPS = [
  { title: 'Register', body: 'Create your facility account.' },
  { title: 'Search Musicians', body: 'Browse and find musicians that fit your community.' },
  { title: 'Submit Requests', body: 'Send a performance request with your preferences.' },
  { title: 'Schedule', body: 'We’ll match you and confirm the details.' },
  { title: 'Enjoy Performances', body: 'Your residents enjoy meaningful live music.' },
  { title: 'Repeat', body: 'Invite your favorite musicians back anytime.' },
]

function PathColumn({
  title,
  icon,
  steps,
  cta,
  href,
}: {
  title: string
  icon: React.ReactNode
  steps: { title: string; body: string }[]
  cta: string
  href: string
}) {
  return (
    <div
      className="rounded-2xl px-3 py-6 shadow-2xl sm:rounded-3xl sm:px-7 sm:py-10 lg:px-10"
      style={{ background: 'linear-gradient(180deg, #faf4e7 0%, #e6eef7 45%, #c9dcee 100%)' }}
    >
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-5 sm:text-left">
        <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full bg-ocean-900 text-white sm:h-[86px] sm:w-[86px] lg:h-[104px] lg:w-[104px]">
          {icon}
        </span>
        <h2 className="w-full border-b-2 border-ocean-400/70 pb-2 font-garamond text-[19px] font-bold text-ocean-900 sm:text-[30px] lg:text-[41px]">
          {title}
        </h2>
      </div>

      <ol className="relative mt-6 space-y-5 sm:mt-9 sm:space-y-7">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-2.5 sm:gap-5">
            <div className="flex flex-col items-center">
              <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-300 font-poppins text-[11px] font-bold text-white sm:h-9 sm:w-9 sm:text-[14px]">
                {i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className="mt-1 w-0 flex-1 border-l-2 border-dotted border-ocean-400/80" aria-hidden="true" />
              )}
            </div>
            <div className="pb-1">
              <h3 className="font-garamond text-[13.5px] font-bold leading-tight text-ocean-900 sm:text-[21px] lg:text-[23.4px]">
                {step.title}
              </h3>
              <p className="mt-1 font-poppins text-[9px] leading-snug text-ocean-900/90 sm:text-[11px] lg:text-[12.3px]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href={href}
        className="mt-6 block rounded-lg bg-ocean-800 px-3 py-2.5 text-center font-poppins text-[8.5px] font-bold uppercase tracking-[0.1em] text-white sm:mt-9 sm:px-6 sm:py-3 sm:text-[12.2px] sm:tracking-[0.14em] shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
      >
        {cta}
      </Link>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero — two photos framing the promise ============ */}
      <section className="relative overflow-hidden bg-[#faf4e7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mmm/mobile/how-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover sm:hidden"
        />
        <div className="absolute inset-y-0 left-0 hidden w-1/3 sm:block sm:w-[28%]" aria-hidden="true">
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url('/mmm/card-musician.png')" }} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(250,244,231,0) 35%, rgba(250,244,231,0.92) 100%)' }}
          />
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-1/3 sm:block sm:w-[28%]" aria-hidden="true">
          <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: "url('/mmm/card-community.png')" }} />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(270deg, rgba(250,244,231,0) 35%, rgba(250,244,231,0.92) 100%)' }}
          />
        </div>

        <div className="relative mx-auto max-w-[760px] px-6 py-16 text-center sm:px-8 sm:py-20">
          <h1 className="landing-rise font-garamond text-[34px] font-bold text-ocean-900 sm:text-[41px]">How It Works</h1>
          <p className="landing-rise landing-delay-1 mx-auto mt-4 max-w-[560px] font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[19.1px]">
            We make it simple to bring the joy of live music to memory care communities. Two easy paths. One meaningful
            mission.
          </p>
        </div>
      </section>

      {/* ============ The two paths ============ */}
      <section style={{ background: 'linear-gradient(180deg, #0f3b6b 0%, #1e5aa0 55%, #4882bf 100%)' }}>
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-3 py-10 sm:gap-6 sm:px-6 sm:py-14 lg:gap-10 lg:px-8 lg:py-16">
          <PathColumn
            title="For Musicians"
            href="/register/musician"
            cta="Join as a Musician"
            steps={MUSICIAN_STEPS}
            icon={
              <svg className="h-12 w-12 sm:h-14 sm:w-14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 3.5a.9.9 0 0 0-1.1-.9l-8 1.7a.9.9 0 0 0-.7.9v8.7a3.4 3.4 0 1 0 1.8 3v-7.9l6.2-1.3v5.2a3.4 3.4 0 1 0 1.8 3V3.5z" />
              </svg>
            }
          />
          <PathColumn
            title="For Facilities"
            href="/register/facility"
            cta="Register Your Facility"
            steps={FACILITY_STEPS}
            icon={
              <svg className="h-12 w-12 sm:h-14 sm:w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                <path strokeLinejoin="round" d="M4 21V8.5L12 3l8 5.5V21z" />
                <path strokeLinecap="round" d="M4 21h16" />
                <path
                  fill="currentColor"
                  stroke="none"
                  d="M12 15.6s-3-2-3-3.8a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 1.8-3 3.8-3 3.8z"
                />
              </svg>
            }
          />
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
