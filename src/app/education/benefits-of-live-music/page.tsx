import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { EDU_BODY_BG, EduCard, EduDetailHero, EduSourceBar, EduSubtitle } from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Benefits of Live Music | Margaret's MemoryCare Music",
  description: 'How live music enriches the lives of people living with memory loss — emotionally, socially, cognitively, and physically.',
}

const BENEFITS = [
  { title: 'Emotional Benefits', items: ['Reduces loneliness', 'Improves mood', 'Promotes relaxation'] },
  { title: 'Social Benefits', items: ['Encourages conversation', 'Strengthens family connection', 'Encourages participation'] },
  { title: 'Cognitive Benefits', items: ['Stimulates memory', 'Encourages recognition of familiar songs', 'Supports reminiscence'] },
  { title: 'Physical Benefits', items: ['Clapping', 'Gentle movement', 'Rhythm participation'] },
]

const SOURCES = [
  'https://www.alz.org/help-support/caregiving/daily-care/art-music',
  'https://www.nccih.nih.gov/health/providers/digest/music-and-health',
]

export default function BenefitsOfLiveMusicPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/benefits-hero.png"
        photoAlt="A joyful group of older adults laughing and singing together"
        title="Benefits of Live Music"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>How music enriches the lives of people living with memory loss.</EduSubtitle>

          {/* Benefit cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <EduCard key={b.title} className="px-6 py-8 sm:px-7 sm:py-9">
                <h2 className="text-center font-garamond text-[28px] font-bold leading-tight text-ocean-800 sm:text-[35.7px]">
                  {b.title}
                </h2>
                <ul className="mt-5 list-disc space-y-2.5 pl-5">
                  {b.items.map((item) => (
                    <li key={item} className="font-poppins text-[15px] leading-snug text-ocean-900 sm:text-[19.8px]">
                      {item}
                    </li>
                  ))}
                </ul>
              </EduCard>
            ))}
          </div>

          {/* Quote band */}
          <div
            className="relative mt-8 overflow-hidden rounded-[26px] border-2 border-[#9dc2e8]/75 px-14 py-12 shadow-xl sm:px-24 sm:py-14"
            style={{ background: 'linear-gradient(105deg, #082a4e 0%, #103a67 42%, #235c94 100%)' }}
          >
            {/* The marks flank the line at mid height in the pack rather than
                sitting in the corners of the panel. `top-1/2` with a nudge
                down: the glyph's ink sits in the upper half of its em box. */}
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-[62%] font-garamond text-[70px] leading-none text-[#c5d8ec]/70 sm:left-7 sm:text-[110px]"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-[38%] font-garamond text-[70px] leading-none text-[#c5d8ec]/70 sm:right-7 sm:text-[110px]"
              aria-hidden="true"
            >
              &rdquo;
            </span>
            <p className="relative mx-auto max-w-[900px] text-center font-garamond text-[27px] font-semibold leading-snug text-white sm:text-[44px]">
              Music provides a way to connect, even after verbal communication has become difficult.
            </p>
          </div>

          <EduSourceBar sources={SOURCES} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
