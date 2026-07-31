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
  EduSubtitle,
} from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "The Science of Music | Margaret's MemoryCare Music",
  description:
    'How music activates the brain, strengthens emotions, and creates meaningful connections — even when words become difficult.',
}

const PROCESSES = [
  { icon: '/mmm/pages/edu/sci-rhythm.png', label: 'Rhythm' },
  { icon: '/mmm/pages/edu/sci-melody.png', label: 'Melody' },
  { icon: '/mmm/pages/edu/sci-memory.png', label: 'Memory' },
  { icon: '/mmm/pages/edu/sci-emotion.png', label: 'Emotion' },
  { icon: '/mmm/pages/edu/sci-hearing.png', label: 'Hearing' },
  { icon: '/mmm/pages/edu/sci-movement.png', label: 'Movement' },
]

const MUSIC_CAN = [
  'Trigger memories',
  'Improve mood',
  'Reduce stress',
  'Encourage movement',
  'Increase social interaction',
  'Promote emotional expression',
]

const DID_YOU_KNOW = [
  'Listening to familiar songs activates emotional and memory-related brain networks.',
  'Music engages multiple areas of the brain simultaneously.',
  'Music can reduce stress hormones while increasing positive emotions.',
]

const SOURCES = [
  'https://www.nccih.nih.gov/health/providers/digest/music-and-health',
  'https://www.nia.nih.gov/news/could-musical-medicine-influence-healthy-aging',
]

export default function ScienceOfMusicPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/sci-hero.png"
        photoAlt="A volunteer musician playing guitar and singing with a group of smiling older adults"
        title="The Science of Music"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Discover how music activates the brain, strengthens emotions, and creates meaningful connections, even when
            words become difficult.
          </EduSubtitle>

          <div className="mt-10 space-y-8">
            {/* What Happens When We Listen to Music? */}
            <EduCard>
              <EduH2>What Happens When We Listen to Music?</EduH2>
              <p className="mt-4 max-w-[820px] font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Music is one of the few activities that activate multiple regions of the brain at the same time. When you
                listen to music, your brain processes:
              </p>

              <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
                {PROCESSES.map((p) => (
                  <li key={p.label} className="flex flex-col items-center text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.icon} alt="" className="h-20 w-20 object-contain sm:h-24 sm:w-24" />
                    <span className="mt-2 font-poppins text-[13px] font-bold text-ocean-900 sm:text-[13.9px]">{p.label}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 max-w-[900px] font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Unlike many activities, music stimulates both sides of the brain simultaneously, making it especially
                powerful for older adults.
              </p>
            </EduCard>

            {/* Why Is Music So Powerful? */}
            <EduCard>
              <EduH2>Why Is Music So Powerful?</EduH2>
              <div className="mt-6 grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <p className="font-poppins text-[15px] font-medium text-ocean-900 sm:text-[20.9px]">Music can:</p>
                  <ul className="mt-3 list-disc space-y-1.5 pl-6">
                    {MUSIC_CAN.map((item) => (
                      <li key={item} className="font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bookmark quote box */}
                <div className="relative overflow-hidden rounded-2xl px-7 py-7 shadow-lg" style={{ background: 'linear-gradient(150deg, #17457a 0%, #0d3360 100%)' }}>
                  <svg className="absolute left-6 top-0 h-9 w-7 text-ocean-200" viewBox="0 0 24 30" fill="currentColor" aria-hidden="true">
                    <path d="M4 0h16v26l-8-5-8 5z" />
                  </svg>
                  <p className="mt-6 font-poppins text-[16px] leading-relaxed text-white sm:text-[19.8px]">
                    Even when speech becomes difficult, many people living with dementia can still recognize and enjoy
                    familiar songs.
                  </p>
                  <div className="mt-3">
                    <a
                      href="https://www.alz.org/help-support/caregiving/daily-care/art-music"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-poppins text-[10px] text-ocean-200 underline decoration-ocean-300/60 underline-offset-2 transition hover:text-white sm:text-[10.1px]"
                    >
                      https://www.alz.org/help-support/caregiving/daily-care/art-music
                    </a>
                  </div>
                </div>
              </div>
            </EduCard>

            {/* Did You Know? */}
            <EduNavyBand withStaff>
              <div className="flex items-center justify-center gap-3">
                {/* The pack's own bulb export. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mmm/pages/edu/sci-bulb.png" alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11" />
                <h2 className="text-center font-garamond text-[26px] font-bold text-white sm:text-[35.7px]">Did You Know?</h2>
              </div>
              <div className="mt-8 grid gap-8 text-center sm:grid-cols-3">
                {DID_YOU_KNOW.map((fact) => (
                  <p key={fact} className="font-poppins text-[15px] leading-relaxed text-white sm:text-[19.8px]">
                    {fact}
                  </p>
                ))}
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
