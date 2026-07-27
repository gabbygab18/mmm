import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import {
  EDU_BODY_BG,
  EduCard,
  EduDetailHero,
  EduH2,
  EduSourceBar,
  EduSourceInline,
  EduSubtitle,
} from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Music and the Brain | Margaret's MemoryCare Music",
  description:
    'Why music reaches parts of the brain that remain active even during memory loss — the pathway from sound to memory, emotion, and movement.',
}

const SOURCES = [
  'https://www.nia.nih.gov/news/could-musical-medicine-influence-healthy-aging',
  'https://www.nccih.nih.gov/health/providers/digest/music-and-health',
]

export default function MusicAndTheBrainPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/brain-hero.png"
        photoAlt="A smiling older woman looking up, with musical notes flowing across the image"
        title="Music and the Brain"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Discover why music reaches parts of the brain that remain active even during memory loss.
          </EduSubtitle>

          <div className="mt-10 space-y-8">
            {/* How Music Travels Through the Brain */}
            <EduCard>
              <EduH2>How Music Travels Through the Brain</EduH2>
              <div className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/pages/edu/brain-travels.png"
                  alt="Flow from Hear Music to Auditory Cortex to Emotional Centers, then Emotional Response, Motor Areas, and Memory Networks"
                  className="mx-auto w-full max-w-[980px] object-contain"
                />
              </div>
            </EduCard>

            {/* Why Familiar Songs Matter */}
            <EduCard>
              <EduH2>Why Familiar Songs Matter</EduH2>
              <p className="mt-4 font-poppins text-[15px] leading-relaxed text-ocean-900 sm:text-[20.9px]">
                Music linked to meaningful life events can trigger emotional memories even when other memories become
                difficult to access. This is why familiar songs are often used in dementia care.
              </p>
              <div className="mt-3">
                <EduSourceInline href="https://www.alz.org/help-support/caregiving/daily-care/reminiscence-and-reminiscence-therapy" />
              </div>
            </EduCard>

            {/* Brain Areas Activated */}
            <div>
              <h2 className="text-center font-garamond text-[26px] font-bold text-white sm:text-[35.7px]">Brain Areas Activated</h2>
              <div className="mt-6 overflow-hidden rounded-[26px] shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/pages/edu/brain-areas.png"
                  alt="Illustration of the brain highlighting the Motor Cortex, Hippocampus, Auditory Cortex, and Amygdala activated by music"
                  className="w-full object-contain"
                />
              </div>
            </div>

            {/* The Power of Familiar Music — outlined card on blue */}
            <div className="rounded-[26px] border-[1.5px] border-white/45 px-6 py-8 sm:px-10 sm:py-9">
              <h2 className="font-garamond text-[26px] font-bold text-white sm:text-[35.7px]">The Power of Familiar Music</h2>
              <p className="mt-3 font-poppins text-[15px] leading-relaxed text-white sm:text-[20.9px]">
                Even in later stages of dementia, familiar songs can encourage singing, smiling, rhythmic movement, and
                meaningful social interaction.
              </p>
              <div className="mt-3">
                <a
                  href="https://www.alz.org/help-support/caregiving/daily-care/art-music"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-poppins text-[10px] text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white sm:text-[10.1px]"
                >
                  https://www.alz.org/help-support/caregiving/daily-care/art-music
                </a>
              </div>
            </div>
          </div>

          <EduSourceBar sources={SOURCES} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
