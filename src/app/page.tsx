import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { Lines } from '@/components/mmm/lines'
import { getSiteContent } from '@/lib/mmm/site-content'

/**
 * Homepage — "Bringing Music to Memory Care" (approved design, July 2026 pack).
 * Sections: Hero · How It Works · Choose Your Path · Why Music Matters · Footer.
 */

const STEPS = [
  { n: 1, icon: '/mmm/home-step-1-profile.png', title: 'Create Your Profile' },
  { n: 2, icon: '/mmm/home-step-2-browse.png', title: 'Browse Participating Communities' },
  { n: 3, icon: '/mmm/home-step-3-interest.png', title: 'Express Interest' },
  { n: 4, icon: '/mmm/home-step-4-connect.png', title: 'Review & Connect' },
  { n: 5, icon: '/mmm/home-step-5-schedule.png', title: 'Schedule Your Performance' },
  { n: 6, icon: '/mmm/home-step-6-share.png', title: 'Share the Joy of Live Music' },
]

const BENEFITS = [
  { icon: '/mmm/icon-mood.png', label: 'Improve mood' },
  { icon: '/mmm/icon-social.png', label: 'Encourage Social Interaction' },
  { icon: '/mmm/icon-memories.png', label: 'Spark Memories' },
  { icon: '/mmm/icon-anxiety.png', label: 'Reduce Anxiety' },
]

/**
 * Shared "Choose Your Path" card typography — see the note at the musician card.
 *
 * The widths are deliberately tight: in the pack the community title breaks as
 * "I'm a Memory Care / Community" and its body as two lines, which is what puts
 * both cards on the same rhythm. Given room to sit on one line each, the card
 * ran short and stopped lining up with the musician card beside it.
 */
const cardTitleClass =
  'mt-4 flex min-h-[54px] max-w-[240px] items-center justify-center font-garamond text-[20px] font-bold leading-tight'
const cardBodyClass = 'mt-1 min-h-[76px] max-w-[240px] font-poppins text-[11.4px] leading-relaxed'

export default async function Home() {
  const t = await getSiteContent()

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden" id="hero">
        {/* Photo */}
        <div
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: "url('/mmm/home-hero.png')", backgroundPosition: 'center 30%' }}
          aria-hidden="true"
        />
        {/* Left tint so the headline stays legible. Kept light: the mock-up shows
            the photograph clearly behind the words — at 0.82 the singer and half
            the room were washed out to navy. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, rgba(7,37,68,0.52) 0%, rgba(9,44,86,0.26) 34%, rgba(9,44,86,0.06) 58%, rgba(9,44,86,0) 75%)',
          }}
          aria-hidden="true"
        />
        {/* Music-notes texture, lower left */}
        <div
          className="absolute inset-x-0 bottom-0 h-64 bg-no-repeat opacity-50 mix-blend-screen"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundSize: '900px auto', backgroundPosition: 'left -60px bottom' }}
          aria-hidden="true"
        />
        {/* Light streak wave along the bottom edge.
            The export is a 1099x792 canvas with the glow across its middle, so
            scaling it by width made it ~1350px tall and the section's clipping
            sliced the sweep off flat. Its height is set instead, so the whole
            sweep sits inside the band above the next section. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mmm/streak.png"
          alt=""
          aria-hidden="true"
          className="landing-wave-glow pointer-events-none absolute bottom-0 left-1/2 h-[210px] w-[130%] max-w-none -translate-x-1/2 select-none object-fill sm:h-[260px] lg:h-[300px]"
        />

        <div className="relative mx-auto flex min-h-[620px] max-w-[1200px] flex-col justify-center px-6 pb-40 pt-20 sm:px-8 lg:min-h-[720px] lg:pb-48">
          <h1 className="landing-rise max-w-[640px] font-garamond text-[44px] font-semibold leading-[1.05] text-white drop-shadow-md sm:text-[58px] lg:text-[67px]">
            <Lines text={t('home.hero.title')} />
          </h1>
          <p className="landing-rise landing-delay-1 mt-6 max-w-[520px] font-poppins text-[16px] leading-relaxed text-white drop-shadow sm:text-[19.7px]">
            <Lines text={t('home.hero.body')} />
          </p>

          <div className="landing-rise landing-delay-2 mt-9">
            <Link
              href="/register/musician"
              className="inline-flex items-center justify-center rounded-lg border-2 border-ocean-900 bg-gradient-to-b from-ocean-200 to-ocean-500 px-7 py-3 font-poppins text-[15px] font-bold text-white shadow-[0_2px_8px_rgba(7,37,68,0.35)] transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Start Your Volunteer Journey
            </Link>
            <p className="mt-4 font-poppins text-[13px] text-white drop-shadow">
              Are you a memory care community?{' '}
              <Link href="/register/facility" className="font-bold underline-offset-2 hover:underline">
                Register Your Community →
              </Link>
            </p>
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
          <h2 className="text-center font-poppins text-[13px] font-bold uppercase tracking-[0.22em] text-ocean-900">
            {t('home.how.title')}
          </h2>

          {/* No grid-template below md: undefined columns fall back to one
              implicit column per row, i.e. the steps simply stack — same
              fallback the original 3-step version relied on. */}
          <div className="mt-9 grid items-start gap-y-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-x-3">
            {STEPS.map((step, i) => (
              <div key={step.n} className="contents">
                <div className="flex flex-col items-center text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={step.icon} alt="" className="h-24 w-24 object-contain md:h-16 md:w-16" />
                  <h3 className="mt-3 max-w-[110px] font-garamond text-[12.5px] font-bold leading-snug text-ocean-900 sm:max-w-[130px] sm:text-[14px]">
                    {step.title}
                  </h3>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden items-center justify-center self-center md:flex" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/mmm/icon-arrow.png" alt="" className="h-5 w-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Choose Your Path ============ */}
      <section id="choose-your-path" style={{ background: 'linear-gradient(180deg, #10416f 0%, #0a2f5a 100%)' }}>
        <div className="mx-auto max-w-[1080px] px-6 py-16 sm:px-8">
          <div className="grid gap-8 md:grid-cols-2">
          {/* Musician card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-ocean-200/60 shadow-xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/mmm/card-musician.png')" }}
              aria-hidden="true"
            />
            {/* Thin enough that the guitarist reads through, as in the pack —
                at 0.8 the photo was all but gone. */}
            <div className="absolute inset-0 bg-[#faf4e7]/[0.62]" aria-hidden="true" />
            <div className="relative flex flex-col items-center px-8 py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-note.png" alt="" className="h-16 w-16 object-contain" />
              {/* The two cards share these heading / body boxes so the titles,
                  copy and buttons line up across the pair, as in the design
                  pack — the community title runs to two lines and without the
                  reserved height everything below it sat a line lower. */}
              <h3 className={cardTitleClass + ' text-ocean-900'}>{t('home.path.musician.title')}</h3>
              <p className={cardBodyClass + ' text-ocean-900'}>
                <Lines text={t('home.path.musician.body')} />
              </p>
              <Link
                href="/register/musician"
                className="mt-5 rounded-lg border-[1.5px] border-ocean-800 px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
              >
                {t('home.path.musician.cta')}
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
            <div className="absolute inset-0 bg-ocean-500/[0.58]" aria-hidden="true" />
            <div className="relative flex flex-col items-center px-8 py-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-facility.png" alt="" className="h-16 w-16 object-contain" />
              {/* Shadowed: the photo shows through the wash now, so the white
                  copy needs its own separation from the busier areas. */}
              <h3 className={cardTitleClass + ' text-[#faf4e7] [text-shadow:0_1px_6px_rgba(7,37,68,0.65)]'}>
                <Lines text={t('home.path.community.title')} />
              </h3>
              <p className={cardBodyClass + ' text-white [text-shadow:0_1px_5px_rgba(7,37,68,0.6)]'}>
                <Lines text={t('home.path.community.body')} />
              </p>
              <Link
                href="/register/facility"
                className="mt-5 rounded-lg bg-[#faf4e7] px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t('home.path.community.cta')}
              </Link>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ============ Why Music Matters ============ */}
      <section
        id="why-music-matters"
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a2f5a 0%, #072544 100%)' }}
      >
        {/* Staff artwork runs the full width of the band in the pack, clef at
            the far left through to the notes at the right edge — pinned to a
            fixed pixel width it only covered part of the section. */}
        <div
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundRepeat: 'no-repeat', backgroundSize: '100% auto', backgroundPosition: 'center' }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1200px] flex-col items-center gap-10 px-6 py-14 sm:px-8 lg:flex-row lg:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mmm/icon-heart-clef.png" alt="" className="h-36 w-auto shrink-0 object-contain lg:h-44" />

          <div className="max-w-[420px] text-center lg:text-left">
            <h2 className="font-garamond text-[30.1px] font-bold text-white">{t('home.wmm.title')}</h2>
            <p className="mt-3 font-poppins text-[13.8px] leading-relaxed text-white/95">
              <Lines text={t('home.wmm.body1')} />
            </p>
            <p className="mt-3 font-poppins text-[13.8px] leading-relaxed text-white/95">
              <Lines text={t('home.wmm.body2')} />
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