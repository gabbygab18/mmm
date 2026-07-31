import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import {
  EDU_BODY_BG,
  EduCard,
  EduDetailHero,
  EduH2,
  EduNavyBand,
  EduSourceBar,
  EduSourceInline,
  EduSubtitle,
} from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Understanding Memory & Dementia | Margaret's MemoryCare Music",
  description: 'What dementia is, why music helps, and simple, compassionate tips for supporting people living with memory loss.',
}

const HELP_LEFT = ['Feel calmer', 'Recall meaningful memories', 'Connect with family']
const HELP_RIGHT = ['Express emotions', 'Participate socially']

const TIPS = [
  'Use familiar songs',
  'Encourage singing',
  'Smile',
  'Avoid correcting forgotten memories',
  'Keep performances interactive',
]

const SOURCES = [
  'https://www.nccih.nih.gov/health/providers/digest/music-and-health',
  'https://www.nia.nih.gov/news/could-musical-medicine-influence-healthy-aging',
]

export default function UnderstandingMemoryDementiaPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/memory-hero.png"
        photoAlt="A pensive older person beside a softly lit clock, evoking memory and the passage of time"
        title="Understanding Memory & Dementia"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>Supporting people through compassion, patience, and music.</EduSubtitle>

          <div className="mt-10 space-y-8">
            {/* What is Dementia? */}
            <EduCard>
              <EduH2>What is Dementia?</EduH2>
              <p className="mt-4 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Dementia is not a single disease. It is a general term describing changes in memory, thinking, reasoning,
                and daily functioning that interfere with everyday life. Alzheimer&rsquo;s disease is the most common form
                of dementia.
              </p>
              <div className="mt-3">
                <EduSourceInline href="https://www.alz.org/help-support/caregiving/daily-care/art-music" />
              </div>
            </EduCard>

            {/* Why Does Music Help? */}
            <EduCard>
              <EduH2>Why Does Music Help?</EduH2>
              <p className="mt-4 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Although short-term memories may fade, musical memories and emotionally meaningful songs often remain
                accessible for much longer.
              </p>
              <p className="mt-5 font-poppins text-[15px] font-medium text-ocean-900 sm:text-[20.9px]">
                Familiar music may help people:
              </p>
              <div className="mt-2 grid gap-x-10 gap-y-1 sm:grid-cols-2">
                <ul className="list-disc space-y-1.5 pl-6">
                  {HELP_LEFT.map((item) => (
                    <li key={item} className="font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                      {item}
                    </li>
                  ))}
                </ul>
                <ul className="list-disc space-y-1.5 pl-6">
                  {HELP_RIGHT.map((item) => (
                    <li key={item} className="font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3">
                <EduSourceInline href="https://www.alz.org/help-support/caregiving/daily-care/art-music" />
              </div>
            </EduCard>

            {/* Helpful Tips */}
            <EduNavyBand withStaff>
              <div className="grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="font-garamond text-[26px] font-bold text-white sm:text-[35.7px]">Helpful Tips</h2>
                  <ul className="mt-5 list-disc space-y-2 pl-6">
                    {TIPS.map((tip) => (
                      <li key={tip} className="font-poppins text-[15px] leading-relaxed text-white sm:text-[20.9px]">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bookmark box */}
                {/* Card fill and bookmark both taken from the pack's export —
                    the cream warms towards the right rather than cooling to
                    grey-blue, and the ribbon is the drawn one. */}
                <div className="relative overflow-hidden rounded-2xl px-7 py-7 shadow-lg" style={{ background: 'linear-gradient(100deg, #fffefc 0%, #fffcf5 55%, #fff9ed 100%)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mmm/pages/edu/memory-bookmark.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute left-6 top-0 h-10 w-auto select-none object-contain"
                  />
                  <h3 className="mt-6 font-poppins text-[18px] font-bold text-ocean-800 sm:text-[20px]">Music Creates Connection</h3>
                  <p className="mt-2 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[19.8px]">
                    Instead of asking, &ldquo;Do you remember?&rdquo; Music allows people to simply experience joy
                    together.
                  </p>
                </div>
              </div>
            </EduNavyBand>
          </div>

          <EduSourceBar sources={SOURCES} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
