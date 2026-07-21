'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

/**
 * First-Time Education — prepares volunteer musicians before their first performance
 * (approved design). Sections 1–7 + "Continue to Dashboard".
 *
 * Mobile (<md) follows the approved mobile mock: full-width section bands and the
 * content split into two pages — 1–5 (Next →) and 6–7 (← Back).
 * Desktop (md+) shows everything on one page, unchanged.
 */

const DOS = [
  'Smile and maintain a warm, friendly presence.',
  'Introduce yourself and explain what you’ll be doing.',
  'Speak slowly and clearly.',
  'Encourage participation and enjoyment.',
  'Be patient and flexible.',
]

const DONTS = [
  'Don’t correct memories.',
  'Don’t argue or try to reason.',
  'Don’t rush or pressure for responses.',
  'Don’t use complicated jargon.',
  'Don’t overwhelm with too much at once.',
]

const TIPS = [
  { label: 'Length', text: '15-45 minutes is ideal.' },
  { label: 'Volume', text: 'Keep your volume comfortable and moderate.' },
  { label: 'Song Selection', text: 'Choose familiar, meaningful songs.' },
  { label: 'Interaction', text: 'Engage with smiles, eye contact, and conversation.' },
]

const SONGS_COL_1 = ["40's Classic", "50's Favorites", '60s Hits', 'Big Band Era', 'Elvis Presley', 'Frank Sinatra']
const SONGS_COL_2 = ['The Beatles', 'Nat King Cole']

function SectionCard({ children, className = '', decorated = false }: { children: React.ReactNode; className?: string; decorated?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden px-5 py-8 shadow-xl sm:rounded-2xl sm:px-10 ${className}`}
      style={{ background: 'linear-gradient(115deg, #faf4e7 0%, #eef3f8 55%, #cfe0ef 100%)' }}
    >
      {decorated && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-contain bg-right bg-no-repeat opacity-25"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')" }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-poppins text-[17px] font-bold text-ocean-900 sm:text-[20.4px]">{children}</h2>
}

function SuggestedSongs() {
  return (
    <>
      <SectionTitle>6.&thinsp;Suggested Songs</SectionTitle>
      <p className="mt-1 pl-1 font-poppins text-[12px] text-ocean-900">
        Explore timeless favorites that residents love.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-x-6">
        <ul className="list-disc space-y-2 pl-6">
          {SONGS_COL_1.map((s) => (
            <li key={s} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
              {s}
            </li>
          ))}
        </ul>
        <ul className="list-disc space-y-2 pl-6">
          {SONGS_COL_2.map((s) => (
            <li key={s} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
              {s}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-right font-poppins text-[12.4px] italic text-ocean-900">
        *The list is expandable by Admin.
      </p>
    </>
  )
}

function PerformanceTips() {
  return (
    <>
      <SectionTitle>5.&thinsp;Performance Tips</SectionTitle>
      <ul className="mt-5 list-disc space-y-3 pl-6">
        {TIPS.map((tip) => (
          <li key={tip.label} className="font-poppins text-[12.5px] text-ocean-900 sm:text-[13.7px]">
            <span className="font-bold">{tip.label}</span>
            <br />
            {tip.text}
          </li>
        ))}
      </ul>
    </>
  )
}

export default function EducationPage() {
  // Mobile-only pagination (md+ always shows everything).
  const [mobilePage, setMobilePage] = useState<1 | 2>(1)

  const goMobilePage = (page: 1 | 2) => {
    setMobilePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(105deg, #4f7fb5 0%, #7fa8d8 40%, #b3d0ee 70%, #d9e8f7 100%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 w-[52%] bg-cover bg-left md:w-1/2"
          style={{
            backgroundImage: "url('/mmm/edu-hero.png')",
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1150px] px-5 py-10 sm:px-8 sm:py-16">
          <h1 className="landing-rise max-w-[720px] font-garamond text-[34px] font-semibold leading-tight text-white drop-shadow-md sm:text-[56px] lg:text-[65.9px]">
            First-Time Education
          </h1>
          <p className="landing-rise landing-delay-1 mt-4 max-w-[340px] font-poppins text-[15px] leading-relaxed text-ocean-950 sm:max-w-[560px] sm:text-[19.5px]">
            Thank you for volunteering your music and your heart. Complete these short lessons to help you feel confident
            and prepared for your first performance.
          </p>
        </div>
      </section>

      {/* ============ Lessons ============ */}
      <div
        className="relative"
        style={{ background: 'linear-gradient(180deg, #10416f 0%, #0a2f5a 55%, #072544 100%)' }}
      >
        <div className="mx-auto max-w-[1150px] px-0 py-10 sm:px-8 sm:py-12">
          {/* ---------- Page 1 (mobile): sections 1–5 ---------- */}
          <div className={`space-y-8 ${mobilePage === 1 ? '' : 'hidden md:block'}`}>
            {/* 1. What We Do */}
            <SectionCard>
              <SectionTitle>1.&thinsp;What We Do</SectionTitle>
              <div className="mt-6 grid gap-10 md:grid-cols-2">
                <div className="flex items-start gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/icon-mission.png" alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
                  <div>
                    <h3 className="font-garamond text-[30px] font-bold text-ocean-900 sm:text-[37.9px]">Mission</h3>
                    <p className="mt-1 max-w-[340px] font-poppins text-[13px] leading-relaxed text-ocean-900 sm:text-[14.6px]">
                      To improve the lives of people with memory-related conditions through the healing power of live music.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/icon-vision.png" alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
                  <div>
                    <h3 className="font-garamond text-[30px] font-bold text-ocean-900 sm:text-[37.9px]">Vision</h3>
                    <p className="mt-1 max-w-[420px] font-poppins text-[13px] leading-relaxed text-ocean-900 sm:text-[14.6px]">
                      A world where every person living with memory-related conditions experiences joy, connection, and
                      moments of meaning through music.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 2. Understanding Memory Care */}
            <SectionCard>
              <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <SectionTitle>2.&thinsp;Understanding Memory Care</SectionTitle>
                  <div className="mt-6 space-y-7">
                    <div className="flex items-start gap-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mmm/icon-dementia.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
                      <div>
                        <h3 className="font-garamond text-[22px] font-bold text-ocean-900 sm:text-[25.5px]">What is Dementia?</h3>
                        <p className="mt-1 max-w-[420px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                          Dementia is not a normal part of aging. It affects memory, thinking, behaviour, and emotions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mmm/icon-music-helps.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
                      <div>
                        <h3 className="font-garamond text-[22px] font-bold text-ocean-900 sm:text-[25.5px]">Why Music Helps</h3>
                        <p className="mt-1 max-w-[420px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                          Music can reach areas of the brain that remain intact, reducing anxiety, improving mood, and
                          sparking meaningful connections.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Quote — the artwork already includes the text, so it renders as-is (desktop only, per the mobile mock). */}
                <div className="hidden min-h-[240px] overflow-hidden rounded-xl md:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mmm/edu-quote.png"
                    alt="“When words fail, music speaks.”"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </SectionCard>

            {/* 3 & 4. Do's / Don'ts */}
            <SectionCard decorated>
              <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-ocean-300/70">
                <div>
                  <SectionTitle>3.&thinsp;Do&rsquo;s</SectionTitle>
                  <ul className="mt-5 list-disc space-y-2 pl-6">
                    {DOS.map((item) => (
                      <li key={item} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:pl-10">
                  <SectionTitle>4.&thinsp;Don&rsquo;ts</SectionTitle>
                  <ul className="mt-5 list-disc space-y-2 pl-6">
                    {DONTS.map((item) => (
                      <li key={item} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>

            {/* 5 & 6. Performance Tips / Suggested Songs — combined card on desktop */}
            <SectionCard className="hidden md:block">
              <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-ocean-300/70">
                <div>
                  <PerformanceTips />
                </div>
                <div className="md:pl-10">
                  <SuggestedSongs />
                </div>
              </div>
            </SectionCard>

            {/* 5. Performance Tips — own band on mobile, ends page 1 */}
            <SectionCard className="md:hidden">
              <PerformanceTips />
              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() => goMobilePage(2)}
                  className="rounded-full bg-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400"
                >
                  Next &rarr;
                </button>
              </div>
            </SectionCard>
          </div>

          {/* ---------- Page 2 (mobile): sections 6–7 ---------- */}
          <div className={`mt-0 space-y-8 md:mt-8 ${mobilePage === 2 ? '' : 'hidden md:block'}`}>
            {/* 6. Suggested Songs — own band on mobile only (desktop shows it in the combined card above) */}
            <SectionCard className="md:hidden" decorated>
              <SuggestedSongs />
            </SectionCard>

            {/* 7. Performance Videos */}
            <SectionCard>
              <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr]">
                <div>
                  <SectionTitle>7.&thinsp;Performance Videos</SectionTitle>
                  <p className="mt-3 max-w-[300px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                    Watch helpful videos to see examples, get tips, and feel more confident.
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-ocean-900 px-4 py-2 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14V8l6 4-6 4z" />
                    </svg>
                    Coming Soon
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex aspect-video items-center justify-center rounded-lg bg-ocean-200/80">
                      <svg className="h-10 w-10 text-ocean-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
              {/* Back to page 1 — mobile only */}
              <div className="mt-7 flex md:hidden">
                <button
                  type="button"
                  onClick={() => goMobilePage(1)}
                  className="rounded-full border-[1.5px] border-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                >
                  &larr; Back
                </button>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ============ Your almost ready ============ */}
        <div
          className={`mx-auto max-w-[1150px] flex-col items-center gap-8 px-6 pb-16 sm:px-8 lg:flex-row lg:justify-between ${
            mobilePage === 2 ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-ocean-300/40 sm:h-28 sm:w-28">
              <svg className="h-12 w-12 text-ocean-950 sm:h-14 sm:w-14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3L1 8l11 5 9-4.09V15h2V8L12 3zm-7 9.18V16c0 2.21 3.13 4 7 4s7-1.79 7-4v-3.82l-7 3.18-7-3.18z" />
              </svg>
            </div>
            <div>
              <h2 className="font-garamond text-[30px] font-bold text-white sm:text-[37.9px]">Your almost ready!</h2>
              <p className="mt-1 max-w-[380px] font-poppins text-[12.5px] leading-relaxed text-white sm:text-[13.5px]">
                Once you&apos;ve completed these lessons, you&apos;ll be ready to bring joy through music.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border-[1.5px] border-white/80 bg-ocean-800/60 px-8 py-3 font-poppins text-[13px] font-bold uppercase tracking-[0.16em] text-white shadow-lg transition hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-[15.3px]"
          >
            Continue to Dashboard &rarr;
          </Link>
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
