'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'

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
    q: 'Do facilities pay?',
    a: 'No. There is no cost for any of our performances. Margaret’s Memorycare Music is a nonprofit organization funded by donations and community support.',
  },
  {
    q: 'Can choirs join?',
    a: 'Absolutely! Choirs and vocal ensembles are encouraged to volunteer. Group performances bring joy and connection to residents.',
  },
  {
    q: 'How long are performances?',
    a: 'Most performances are 30–60 minutes, depending on the residents’ needs and the facility’s preference.',
  },
  {
    q: 'Is insurance provided?',
    a: 'Yes. All volunteer musicians are covered by our liability insurance while performing at partnered facilities.',
  },
  {
    q: 'How do you ensure safety?',
    a: 'We follow strict safety guidelines and work closely with each facility to create a comfortable and secure environment for residents and musicians.',
  },
]

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <PageHero
        photo="/mmm/pages/hero-photo-faq.png"
        photoAlt=""
        photoWidth="35%"
        ratioClass="aspect-[1.7] sm:aspect-[2.4] lg:aspect-[3.4]"
        photoWidthSm="30%"
        waveOffset="19%"
        background="linear-gradient(100deg, #b6d0ef 0%, #a5c5e9 32%, #a4c9f7 60%, #9dc4f2 100%)"
        copyWidth="max-w-[640px]"
        tailColor="#0f3b6b"
      >
        <h1 className="landing-rise font-garamond text-[22px] font-bold leading-tight text-white drop-shadow-md sm:text-[32px] md:text-[40px] lg:text-[52px]">
          Frequently Asked Questions
        </h1>
        <p className="landing-rise landing-delay-1 mt-2 font-poppins text-[11px] leading-snug text-ocean-900 sm:text-[14px] md:text-[16px] lg:text-[19.5px]">
          Find answers to common questions about Margaret&apos;s Memorycare Music and how we bring the joy of live
          music to memory care communities.
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

        {/* ---- Still have questions ---- */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-50 mix-blend-soft-light"
            style={{
              backgroundImage: "url('/mmm/pages/faq-notes.png')",
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1100px auto',
              backgroundPosition: 'center bottom',
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-[1150px] flex-col items-center justify-between gap-6 px-6 pb-16 sm:px-8 lg:flex-row">
            <div className="text-center lg:text-left">
              <h2 className="font-garamond text-[30px] font-bold text-white sm:text-[42.6px]">Still have questions?</h2>
              <p className="mt-2 font-poppins text-[14px] text-white/95 sm:text-[16.4px]">
                We&apos;re happy to help! Reach out to our team anytime.
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
