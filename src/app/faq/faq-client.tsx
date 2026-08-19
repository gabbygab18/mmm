'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'
import { Lines } from '@/components/mmm/lines'

/**
 * FAQ — accordion per the approved design. The first question opens by default
 * so the panel never looks like a dead list of headings.
 */

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes! All performances are provided at no cost to memory care communities. Our volunteer musicians donate their time and talent to share the power of music.',
  },
  {
    q: 'Who can volunteer?',
    a: 'Musicians of all ages and skill levels are welcome! Whether you’re a solo artist, band, or part of a group, your music can make a meaningful difference.',
  },
  {
    q: 'Can choirs join?',
    a: 'Absolutely! Choirs and vocal ensembles are encouraged to volunteer. Group performances bring joy and connection to residents.',
  },
  {
    q: 'How long are performances?',
    a: 'Most performances are 30–60 minutes, depending on the residents’ needs and the facility’s preference.',
  },
]

export function FaqClient({ content }: { content: Record<string, string> }) {
  const t = (key: string) => content[key] ?? ''

  const [open, setOpen] = useState<number | null>(0)

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============
          Body paragraph was dark ocean-900, which only reads on the hero
          photo's pale area — this photo turns white early (~33% down), and
          there's no dedicated mobile export, so wrapped text on narrow
          phones could land on that white area or spill onto the plain dark
          section below. Fixed with white text + PageHero's scrim (guarantees
          contrast regardless of what's in the photo) instead of cropping
          tightly to dodge the white area — a short crop just clips whatever
          text doesn't fit via overflow-hidden. mobileHeroAspect only needs
          enough room for the wrapped title+body to never clip. */}
      <PageHero
        heroImage="/mmm/pages/faq-hero.png"
        heroAspect="1100 / 355"
        mobileHeroAspect="1100 / 480"
        copyBand="76%"
        mobileCopyBand="90%"
        copyWidth="max-w-[580px]"
        align="left"
        tailColor="#0f3b6b"
      >
        <h1 className="landing-rise font-garamond text-[22px] font-bold leading-tight text-white drop-shadow-md sm:text-[32px] md:text-[40px] lg:text-[52px]">
          <Lines text={t('faq.hero.title')} />
        </h1>
        <p className="landing-rise landing-delay-1 mt-2 font-poppins text-[11px] leading-snug text-white [text-shadow:0_1px_8px_rgba(10,47,90,0.8)] sm:text-[14px] md:text-[16px] lg:text-[19.5px]">
          <Lines text={t('faq.hero.body')} />
        </p>
      </PageHero>

      {/* ============ Accordion ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0f3b6b 0%, #0a2f5a 100%)' }}>
        <div className="mx-auto max-w-[1150px] px-6 py-16 sm:px-8">
          <ul className="space-y-5">
            {FAQS.map((item, i) => {
              const isOpen = open === i
              return (
                <li
                  key={item.q}
                  className="overflow-hidden rounded-2xl shadow-xl"
                  style={{ background: 'linear-gradient(100deg, #faf4e7 0%, #eef2f7 55%, #d7e3ef 100%)' }}
                >
                  <h2>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      className="flex w-full items-center justify-between gap-6 px-7 py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ocean-500 sm:px-10"
                    >
                      <span className="font-garamond text-[24px] font-bold text-ocean-900 sm:text-[33.9px]">{item.q}</span>
                      <svg
                        className={`h-6 w-6 shrink-0 text-ocean-800 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </h2>
                  <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-button-${i}`} hidden={!isOpen}>
                    <p className="px-7 pb-7 font-poppins text-[14px] leading-relaxed text-ocean-900 sm:px-10 sm:text-[16.4px]">
                      {item.a}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ---- Still have questions ----
             The staff artwork that sat across the lower right of this band was
             dropped at the client's request. */}
        <div className="relative overflow-hidden">
          <div className="relative mx-auto flex max-w-[1150px] flex-col items-center justify-between gap-6 px-6 pb-16 sm:px-8 lg:flex-row">
            <div className="text-center lg:text-left">
              <h2 className="font-garamond text-[30px] font-bold text-white sm:text-[42.6px]">{t('faq.cta.title')}</h2>
              <p className="mt-2 font-poppins text-[14px] text-white/95 sm:text-[16.4px]">
                <Lines text={t('faq.cta.body')} />
              </p>
            </div>
            <Link
              href="/contact"
              className="shrink-0 rounded-lg bg-ocean-300/85 px-10 py-3.5 font-poppins text-[13px] font-bold uppercase tracking-[0.18em] text-white shadow-[inset_0_-3px_6px_rgba(7,37,68,0.35),0_3px_8px_rgba(7,37,68,0.3)] transition hover:bg-ocean-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-[15.1px]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
