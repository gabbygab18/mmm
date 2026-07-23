import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'

export const metadata: Metadata = {
  title: "About | Margaret's MemoryCare Music",
  description:
    "The story behind Margaret's Memorycare Music — how one son's experience caring for his mother became a mission to bring live music to memory care communities.",
}

/** Our Story timeline — four beats, in order, because the order is the story. */
const STORY = [
  {
    icon: '/mmm/pages/about-node-clef.png',
    title: ['Margaret’s Love', 'for Music'],
    body: 'Music was always a part of Margaret’s life, bringing joy to her family and everyone around her.',
  },
  {
    icon: '/mmm/pages/about-node-heart.png',
    title: ['A Son’s', 'Inspiration'],
    body: 'Michael saw how familiar songs could reach his mother in ways nothing else could.',
  },
  {
    icon: '/mmm/pages/about-node-hands.png',
    title: ['A Mission', 'is Born'],
    body: 'That experience inspired Michael to create MMM and serve the broader community.',
  },
  {
    icon: '/mmm/pages/about-node-tree.png',
    title: ['A Legacy that', 'Lives On'],
    body: 'Every performance continues Margaret’s legacy, one song, one smile, one memory at a time.',
  },
]

const PILLARS = [
  {
    title: 'Our Mission',
    body: 'To connect volunteer musicians with memory care communities and bring meaningful live music performances to residents at no cost.',
  },
  {
    title: 'Our Vision',
    body: 'A world where every memory care resident experiences the healing, joy, and connection that live music can bring.',
  },
  {
    title: 'Future Goals',
    body: 'Expand throughout Florida and across the nation so more communities can be touched by the power of music.',
  },
]

export default function AboutPage() {
  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <PageHero
        photo="/mmm/pages/hero-photo-about.png"
        photoAlt="Margaret Roscoe with her son Michael"
        photoWidth="50%"
        notes="/mmm/pages/about-notes-top.png"
        ratioClass="aspect-[1.45] sm:aspect-[1.9] lg:aspect-[2.46]"
        photoWidthSm="40%"
        background="linear-gradient(100deg, #82aeda 0%, #a1c0e2 32%, #adc2dc 60%, #9dbcdd 100%)"
        copyWidth="max-w-[560px]"
        tailColor="#4882bf"
      >
        <h1 className="landing-rise font-garamond text-[27px] font-semibold leading-[1.02] text-white drop-shadow-md sm:text-[40px] md:text-[50px] lg:text-[62px] xl:text-[79.9px]">
          Every Song
          <br />
          Has a Story.
        </h1>

        <div className="landing-rise landing-delay-1 mt-3 flex items-center gap-3 sm:mt-5" aria-hidden="true">
          <span className="h-px flex-1 bg-white/70" />
          <svg className="h-4 w-4 text-ocean-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20s-7-4.5-7-9.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7 2.8C19 15.5 12 20 12 20z" />
          </svg>
          <span className="h-px flex-1 bg-white/70" />
        </div>

        <p className="landing-rise landing-delay-2 mt-3 font-poppins text-[13px] leading-snug text-white drop-shadow sm:text-[18px] md:text-[22px] lg:text-[29.8px]">
          The story behind
          <br />
          Margaret&apos;s Memorycare Music
        </p>
      </PageHero>

      {/* ============ Meet Margaret ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #4882bf 0%, #2f6ba8 100%)' }}>
        <div
          className="absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage: "url('/mmm/pages/about-notes-top.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1100px auto',
            backgroundPosition: 'left -80px center',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-[1150px] items-center gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mmm/pages/about-margaret.png"
            alt="Margaret Roscoe smiling at a family celebration"
            className="mx-auto w-full max-w-[420px] drop-shadow-2xl"
          />

          <div className="text-center lg:text-right">
            <h2 className="font-garamond text-[30px] font-bold leading-tight text-white sm:text-[42.6px]">
              Meet Margaret Roscoe
              <br className="hidden sm:block" /> and her son, Michael
            </h2>
            <p className="mt-5 font-poppins text-[15px] leading-relaxed text-white sm:text-[20.6px]">
              While caring for his mother through memory loss, Michael witnessed how live music brought her joy, comfort,
              and connection. Inspired by those moments, he founded Margaret&apos;s Memorycare Music to connect volunteer
              musicians with memory care communities throughout Palm Beach County — bringing meaningful live performances
              to residents at no cost. Every performance honors Margaret&apos;s legacy, because one familiar song can
              become someone&apos;s favorite memory of the day.
            </p>
          </div>
        </div>
      </section>

      {/* ============ Our Story ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #2f6ba8 0%, #1e5aa0 100%)' }}>
        <div className="relative mx-auto max-w-[1150px] px-6 py-16 sm:px-8">
          <h2 className="text-center font-garamond text-[30px] font-bold text-white sm:text-[42.6px]">Our Story</h2>

          <ol className="relative mt-10 space-y-7 lg:mt-12 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
            {/* Dotted connector: vertical on mobile, horizontal from lg up. */}
            <span
              className="pointer-events-none absolute bottom-6 left-[26px] top-6 border-l-2 border-dotted border-white/40 lg:bottom-auto lg:left-[12.5%] lg:right-[12.5%] lg:top-[44px] lg:border-l-0 lg:border-t-2"
              aria-hidden="true"
            />
            {STORY.map((node) => (
              <li
                key={node.title.join(' ')}
                className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
              >
                <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-ocean-700/40 lg:h-[88px] lg:w-[88px] lg:bg-transparent">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={node.icon} alt="" className="max-h-[34px] w-auto object-contain lg:max-h-[80px]" />
                </span>
                <div className="min-w-0 flex-1 pt-1 lg:pt-0">
                  <h3 className="font-garamond text-[17px] font-bold leading-tight text-white sm:text-[20px] lg:mt-4 lg:text-[25.2px]">
                    {node.title.join(' ')}
                  </h3>
                  <p className="mt-1 font-poppins text-[11px] leading-snug text-white/95 sm:text-[12.5px] lg:mx-auto lg:mt-3 lg:max-w-[260px] lg:text-[13.8px]">
                    {node.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* ---- Mission / Vision / Goals ---- */}
          <div
            className="mt-12 overflow-hidden rounded-2xl bg-transparent shadow-none sm:shadow-2xl"
            style={{ backgroundImage: 'linear-gradient(100deg, #faf4e7 0%, #eef2f7 55%, #dbe6f1 100%)' }}
          >
            <div className="grid gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ocean-300/70">
              {PILLARS.map((p) => (
                <div key={p.title} className="rounded-2xl bg-[#faf4e7] px-6 py-6 text-center sm:rounded-none sm:bg-transparent sm:px-8 sm:py-9">
                  <h3 className="font-garamond text-[19px] font-bold text-ocean-900 sm:text-[25.2px]">{p.title}</h3>
                  <p className="mt-2 font-poppins text-[11.5px] leading-relaxed text-ocean-900 sm:mt-3 sm:text-[16.1px]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ Be Part of the Mission ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e5aa0 0%, #0f3b6b 100%)' }}>
        <div
          className="absolute inset-0 opacity-45 mix-blend-soft-light"
          style={{
            backgroundImage: "url('/mmm/pages/about-notes-bottom.png')",
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1100px auto',
            backgroundPosition: 'center bottom',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-[1150px] flex-col items-center justify-between gap-8 px-6 py-14 sm:px-8 lg:flex-row">
          <div className="text-center lg:text-left">
            <h2 className="font-garamond text-[30px] font-bold text-white sm:text-[42.6px]">Be Part of the Mission</h2>
            <p className="mt-3 max-w-[540px] font-poppins text-[14px] leading-relaxed text-white/95 sm:text-[16.4px]">
              Help us bring more moments of joy, connection, and music to those who need it most.
            </p>
          </div>
          <Link
            href="/get-started"
            className="shrink-0 rounded-lg bg-ocean-300/85 px-9 py-3.5 text-center font-poppins text-[13px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-3px_6px_rgba(7,37,68,0.35),0_3px_8px_rgba(7,37,68,0.3)] transition hover:bg-ocean-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-[15.1px]"
          >
            Become Part of the Mission
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
