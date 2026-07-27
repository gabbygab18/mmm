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
  title: "Research Behind Music & Memory | Margaret's MemoryCare Music",
  description: 'What studies have discovered about music and dementia — current research, findings, and the questions scientists are still exploring.',
}

const STATS = [
  { img: '/mmm/pages/edu/research-stat-studies.png', alt: '22 studies' },
  { img: '/mmm/pages/edu/research-stat-participants.png', alt: '1K+ participants' },
  { img: '/mmm/pages/edu/research-stat-qol.png', alt: 'Better quality of life' },
  { img: '/mmm/pages/edu/research-stat-wellbeing.png', alt: 'Improved emotional well-being' },
]

const FINDINGS = [
  'Improve mood',
  'Reduce anxiety',
  'Reduce depressive symptoms',
  'Support social engagement',
  'Improve quality of life',
]

const ONGOING = [
  'Personalized playlists',
  'Music therapy',
  'Live music performances',
  'Brain imaging and music',
  'Group singing',
]

const SOURCES = [
  'https://www.nccih.nih.gov/health/providers/digest/music-and-health-science',
  'https://www.nia.nih.gov/news/could-musical-medicine-influence-healthy-aging',
]

export default function ResearchBehindMusicAndMemoryPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/research-hero.png"
        photoAlt="A smiling older woman looking up, with musical notes flowing across the image"
        title="Research Behind Music & Memory"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>What studies have discovered about music and dementia.</EduSubtitle>

          <div className="mt-10 space-y-8">
            {/* Key findings — stat band */}
            <EduNavyBand withStaff>
              <ul className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                {STATS.map((s) => (
                  <li key={s.alt} className="flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt={s.alt} className="h-[120px] w-auto object-contain sm:h-[150px]" />
                  </li>
                ))}
              </ul>
            </EduNavyBand>

            {/* Current Research */}
            <EduCard>
              <EduH2>Current Research</EduH2>
              <p className="mt-4 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Research continues to explore how music-based interventions may support people living with dementia.
              </p>
              <p className="mt-5 font-poppins text-[15px] font-medium text-ocean-900 sm:text-[20.9px]">
                Studies suggest music may help:
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                {FINDINGS.map((item) => (
                  <li key={item} className="font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Researchers continue studying whether music directly improves cognition, but evidence for emotional and
                behavioral benefits is encouraging.
              </p>
              <div className="mt-3">
                <EduSourceInline href="https://www.alz.org/help-support/caregiving/daily-care/art-music" />
              </div>
            </EduCard>

            {/* Ongoing Studies */}
            <EduCard>
              <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
                <div>
                  <EduH2>Ongoing Studies</EduH2>
                  <p className="mt-4 font-poppins text-[15px] font-medium text-ocean-900 sm:text-[20.9px]">
                    Scientists continue researching:
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-6">
                    {ONGOING.map((item) => (
                      <li key={item} className="font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <EduSourceInline href="https://www.nccih.nih.gov/health/providers/digest/music-and-health-science" />
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mmm/pages/edu/research-ongoing.png"
                    alt="Researchers reviewing findings on music and memory"
                    className="w-full object-cover"
                  />
                </div>
              </div>
            </EduCard>
          </div>

          <EduSourceBar sources={SOURCES} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
