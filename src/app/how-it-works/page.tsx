import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { Lines } from '@/components/mmm/lines'
import { getSiteContent } from '@/lib/mmm/site-content'

export const metadata: Metadata = {
  title: "How It Works | Margaret's MemoryCare Music",
  description:
    'Two paths, one mission: how volunteer musicians and memory care communities use Margaret’s Memorycare Music to bring live music to residents.',
}

const MUSICIAN_STEPS = [
  { title: 'Register', body: 'Create your musician profile and share your information.' },
  { title: 'Review & Approval', body: 'MMM staff will review and approve your registration.' },
  { title: 'Browse Facilities', body: 'Explore memory care communities that are open to live music.' },
  { title: 'Send Message', body: 'Send a message to inquire if they are open for live music.' },
  { title: 'Connect', body: 'Communicate and coordinate details directly.' },
  { title: 'Schedule', body: 'Confirm the date, time, and performance details.' },
  { title: 'Give Feedback', body: 'Share your performance experience and provide suggestions.' },
]

const FACILITY_STEPS = [
  { title: 'Register', body: 'Create your community profile and share your information.' },
  { title: 'Review & Approval', body: 'MMM staff will review and approve your registration.' },
  { title: 'Browse Musicians', body: 'Explore musician profiles and view their videos and information.' },
  { title: 'View Profile & Videos', body: 'Watch performance videos and learn more about the musician.' },
  { title: 'Send Message', body: 'Send a message to ask if they are available for live music.' },
  { title: 'Connect', body: 'Confirm the date, time, and performance details.' },
  { title: 'Submit Feedback', body: "Rate the musician's performance and provide your facility's input." },
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

      <ol className="relative mt-6 sm:mt-9">
        {steps.map((step, i) => (
          <li key={step.title} className={`relative flex items-start gap-2.5 sm:gap-5 ${i < steps.length - 1 ? 'pb-5 sm:pb-7' : ''}`}>
            {/* Absolutely positioned against the li (not stretched via flex)
                so `bottom-0` reaches the li's own padding-bottom — i.e. all
                the way down to the next circle — regardless of how tall this
                step's text happens to be. align-items: stretch only fills the
                content box, which stops short of the padding; that was the
                previous "cut off" line. */}
            {i < steps.length - 1 && (
              <span
                className="absolute left-[13px] top-7 bottom-0 border-l-2 border-dotted border-ocean-400/80 sm:left-[17px] sm:top-9"
                aria-hidden="true"
              />
            )}
            <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-300 font-poppins text-[11px] font-bold text-white sm:h-9 sm:w-9 sm:text-[14px]">
              {i + 1}
            </span>
            <div>
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

export default async function HowItWorksPage() {
  const t = await getSiteContent()

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero — the design pack's composed band ============
          Guitarist, cream centre and the nurse with a resident, exported as one
          image. The two card photos that used to be cropped in at either edge
          were the wrong pictures. From `sm` up the export runs at its own
          ratio and the copy is laid over it; on phones it is too wide to read
          that way, so there it sits behind the copy instead.

          The export also carries ~2.5% of cream at its left edge and ~4% at its
          right; left as-is those showed as pale gutters beside the band, so it
          is scaled up and nudged until the photographs reach both page edges. */}
      <section className="relative overflow-hidden bg-[#faf4e7]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mmm/mobile/how-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full max-w-none select-none object-cover sm:relative sm:ml-[-2.7%] sm:h-auto sm:w-[107.1%] sm:object-fill"
        />

        <div className="relative sm:absolute sm:inset-0 sm:flex sm:items-center">
          <div className="mx-auto max-w-[860px] px-6 py-16 text-center sm:px-8 sm:py-0">
            <h1 className="landing-rise font-garamond text-[30px] font-bold text-ocean-900 sm:text-[32px] md:text-[40px] lg:text-[52px] xl:text-[58px]">
              <Lines text={t('how.hero.title')} />
            </h1>
            <p className="landing-rise landing-delay-1 mx-auto mt-3 max-w-[660px] font-poppins text-[14px] leading-relaxed text-ocean-900 sm:text-[13.5px] md:text-[16px] lg:text-[20px] xl:text-[22px]">
              <Lines text={t('how.hero.body')} />
            </p>
          </div>
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
