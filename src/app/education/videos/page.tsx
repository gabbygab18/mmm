import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { EDU_BODY_BG, EduDetailHero, EduSubtitle } from '@/components/mmm/education-detail-ui'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Videos | Margaret's MemoryCare Music",
  description:
    'Watch inspiring stories, expert interviews, and educational videos about music, dementia, and memory care.',
}

const VIDEOS = [
  {
    title: 'Alzheimer\u2019s: How Music Makes a Difference (TEDx Talk)',
    metaLabel: 'Speaker:',
    metaValue: 'Barbara \u201cBarbie\u201d Schwartz',
    why: 'A moving TEDx talk explaining how familiar music can awaken memories and improve the lives of people living with dementia. The presentation includes real-life examples inspired by the documentary Alive Inside.',
    href: 'https://www.ted.com/talks/alzheimers_how_music_makes_a_difference',
  },
  {
    title: 'Music Moments \u2013 Alzheimer\u2019s Association',
    metaLabel: 'Organization:',
    metaValue: "Alzheimer's Association",
    why: "An inspiring collection of stories from well-known musicians sharing how music preserves memories, creates emotional connections, and raises awareness about Alzheimer's disease.",
    href: 'https://www.alz.org/musicmoments',
  },
  {
    title: 'Alive Inside (Official Trailer)',
    metaLabel: '',
    metaValue: 'Film',
    why: 'An award-winning documentary that follows people living with dementia as they reconnect with memories and emotions through personalised music. It beautifully demonstrates the life-changing impact of music in memory care.',
    href: 'https://www.youtube.com/results?search_query=Alive+Inside+Official+Trailer',
  },
  {
    title: 'Music & Art Therapy \u2013 Alzheimer\u2019s Association',
    metaLabel: 'Organization:',
    metaValue: "Alzheimer's Association",
    why: "Learn how music and creative activities can improve mood, reduce agitation, and encourage engagement for people living with Alzheimer's and other forms of dementia.",
    href: 'https://www.alz.org/help-support/caregiving/daily-care/art-music',
  },
  {
    title: 'Playlist for Life \u2013 How Personal Music Can Help People with Dementia',
    metaLabel: 'Organization:',
    metaValue: 'Playlist for Life',
    why: 'Discover how creating a personalised playlist can spark memories, encourage conversation, and improve wellbeing for people living with dementia. This organisation offers practical guidance for families and caregivers.',
    href: 'https://www.playlistforlife.org.uk',
  },
]

export default function VideosPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero photo="/mmm/pages/edu/videos/hero.png" photoAlt="A red video play button" title="Videos" />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1150px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Watch inspiring stories, expert interviews, and educational videos about music, dementia, and memory care.
          </EduSubtitle>

          <div className="mt-10 space-y-6">
            {VIDEOS.map((v) => (
              <article
                key={v.title}
                className="rounded-[24px] px-6 py-7 shadow-xl sm:px-10 sm:py-9"
                style={{ background: 'linear-gradient(125deg, #ffffff 0%, #eef4fa 55%, #dbe8f5 100%)' }}
              >
                <h2 className="font-garamond text-[25px] font-bold leading-tight text-ocean-800 sm:text-[35.7px]">
                  {v.title}
                </h2>
                <p className="mt-2 font-poppins text-[14px] text-ocean-900 sm:text-[19px]">
                  {v.metaLabel && <span className="font-bold">{v.metaLabel} </span>}
                  {!v.metaLabel ? <span className="font-bold">{v.metaValue}</span> : v.metaValue}
                </p>
                <p className="mt-4 font-poppins text-[15px] font-bold text-ocean-800 sm:text-[18px]">Why Watch?</p>
                <p className="mt-1 font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[19px]">{v.why}</p>
                <p className="mt-4 font-poppins text-[15px] font-bold text-ocean-800 sm:text-[18px]">Watch Here:</p>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block break-all font-poppins text-[14px] text-ocean-500 underline decoration-ocean-300 underline-offset-2 transition hover:text-ocean-700 sm:text-[18px]"
                >
                  {v.href}
                </a>
              </article>
            ))}
          </div>

          {/* Back */}
          <div className="mt-12 flex justify-end">
            <Link
              href="/why-music-matters"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white bg-white/95 px-6 py-2 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-800 shadow-md transition hover:bg-white"
            >
              &larr; Back
            </Link>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
