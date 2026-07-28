import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import {
  EDU_BODY_BG,
  EduCard,
  EduDetailHero,
  EduH2,
  EduBodyTitle,
  EduNavyBand,
  EduFaqList,
  EduOrgTable,
  EduRefLinks,
  EduSourceBar,
  EduSubtitle,
} from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Volunteer Resources | Margaret's MemoryCare Music",
  description:
    'Everything you need to confidently bring joy, comfort, and meaningful musical experiences to memory care communities.',
}

const BEFORE_L = ['Confirm your performance schedule', "Review the facility's guidelines", 'Prepare familiar songs']
const BEFORE_R = ['Dress comfortably and professionally', 'Bring any necessary equipment', 'Arrive 15\u201320 minutes early']

const BEST_PRACTICES = [
  '/mmm/pages/edu/volunteer/bp-smile.png',
  '/mmm/pages/edu/volunteer/bp-introduce.png',
  '/mmm/pages/edu/volunteer/bp-speak.png',
  '/mmm/pages/edu/volunteer/bp-participate.png',
  '/mmm/pages/edu/volunteer/bp-patient.png',
  '/mmm/pages/edu/volunteer/bp-familiar.png',
]
const BEST_PRACTICES_ALT = [
  'Smile Often — a warm smile creates a welcoming atmosphere',
  "Introduce Yourself — tell residents your name and what you'll be playing",
  'Speak Slowly — use a calm, clear voice between songs',
  'Encourage Participation — invite singing, clapping, tapping, or dancing',
  'Be Patient — allow residents time to respond',
  'Keep It Familiar — choose songs residents are likely to recognise',
]

const ERAS = [
  '/mmm/pages/edu/volunteer/era-1940s.png',
  '/mmm/pages/edu/volunteer/era-1950s.png',
  '/mmm/pages/edu/volunteer/era-1960s.png',
  '/mmm/pages/edu/volunteer/era-gospel.png',
  '/mmm/pages/edu/volunteer/era-bigband.png',
]
const ERAS_ALT = ['1940s song suggestions', '1950s song suggestions', '1960s song suggestions', 'Gospel & Hymns song suggestions', 'Big Band & Standards song suggestions']

const TIPS = [
  { title: 'Performance Length', body: '30\u201345 minutes is generally ideal.' },
  { title: 'Volume', body: 'Keep music at a comfortable level. Avoid overpowering conversations.' },
  {
    title: 'Interaction',
    body: 'Talk with residents between songs. Ask simple questions like: \u201cDoes anyone remember this song?\u201d or \u201cWould you like to sing along?\u201d',
  },
]

const DO = ['Use names when possible', 'Make eye contact', 'Listen patiently', 'Encourage memories', 'Respond warmly']
const DONT = ['Correct memories', 'Argue', 'Rush conversations', 'Use baby talk', 'Speak too loudly']

const FAQ = [
  { q: 'What if no one sings along?', a: 'Residents may still be listening and enjoying the music.' },
  { q: 'Can I take requests?', a: "Yes, if you're comfortable playing them and they are appropriate." },
  { q: 'What if someone becomes emotional?', a: 'Stay calm. Music often brings back meaningful memories.' },
  { q: 'What should I wear?', a: 'Comfortable, neat clothing suitable for a professional volunteer visit.' },
  { q: 'Do I need to bring my own equipment?', a: 'Yes, unless the facility tells you otherwise.' },
]

const ORGS = [
  { name: "Alzheimer's Association", href: 'https://www.alz.org', find: 'Volunteer communication tips, dementia education, and caregiving guidance.' },
  { name: 'National Institute on Aging', href: 'https://www.nia.nih.gov', find: "Research-backed information on Alzheimer's disease and dementia." },
  { name: 'Library of Congress', href: 'https://www.loc.gov', find: 'Historical music archives and classic song collections that can help volunteers build era-appropriate playlists.' },
  { name: "Alzheimer's Society (UK)", href: 'https://www.alzheimers.org.uk', find: 'Practical communication advice, dementia-friendly approaches, and caregiver resources.' },
  { name: 'Music & Memory', href: 'https://musicandmemory.org', find: 'Best practices for using personalised music to improve the lives of people living with dementia.' },
  { name: 'American Music Therapy Association (AMTA)', href: 'https://www.musictherapy.org', find: 'Evidence-based information about music therapy and therapeutic music practices.' },
]

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2.5 font-poppins text-[14px] leading-snug text-ocean-900 sm:text-[16px]">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-ocean-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {i}
        </li>
      ))}
    </ul>
  )
}

export default function VolunteerResourcesPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/volunteer/hero.png"
        photoAlt="Three volunteer musicians singing and playing instruments"
        title="Volunteer Resources"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1150px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Everything you need to confidently bring joy, comfort, and meaningful musical experiences to memory care
            communities.
          </EduSubtitle>

          {/* Preparing for Your Visit */}
          <EduCard className="mt-10">
            <EduH2>Preparing for Your Visit</EduH2>
            <p className="mt-3 font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[16.5px]">
              A little preparation helps create a positive experience for both you and the residents.
            </p>
            <p className="mt-5 font-poppins text-[15px] font-bold text-ocean-800 sm:text-[16.5px]">Before You Arrive</p>
            <div className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              <CheckList items={BEFORE_L} />
              <CheckList items={BEFORE_R} />
            </div>
          </EduCard>

          {/* Best Practices During a Performance — light card, dark icons (per mockup) */}
          <EduCard className="mt-8">
            <EduH2>Best Practices During a Performance</EduH2>
            <div className="mt-8 grid grid-cols-2 items-start gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
              {BEST_PRACTICES.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={BEST_PRACTICES_ALT[i]} className="mx-auto h-auto w-full max-w-[170px] object-contain" />
              ))}
            </div>
          </EduCard>

          {/* Song Selection Guide */}
          <div className="mt-14">
            <EduBodyTitle>Song Selection Guide</EduBodyTitle>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {ERAS.map((src, i) => (
                <div
                  key={src}
                  className="rounded-2xl p-3 shadow-lg"
                  style={{ background: 'linear-gradient(150deg, #ffffff 0%, #eef4fa 60%, #dce7f5 100%)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={ERAS_ALT[i]} className="mx-auto h-auto w-full object-contain" />
                </div>
              ))}
            </div>
            <EduRefLinks
              className="[&_a]:text-ocean-100 [&_a]:decoration-white/40 hover:[&_a]:text-white"
              links={['https://musicandmemory.org', 'https://www.loc.gov']}
            />
          </div>

          {/* Performance Tips */}
          <EduCard className="mt-8">
            <EduH2 className="text-center">Performance Tips</EduH2>
            <div className="mt-7 grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-ocean-300/60">
              {TIPS.map((t) => (
                <div key={t.title} className="text-center sm:px-4">
                  <h3 className="font-poppins text-[17px] font-bold text-ocean-800 sm:text-[19px]">{t.title}</h3>
                  <p className="mt-3 font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[16px]">{t.body}</p>
                </div>
              ))}
            </div>
          </EduCard>

          {/* Helpful Communication Tips (navy DO / DON'T) */}
          <EduNavyBand className="mt-8">
            <EduBodyTitle>Helpful Communication Tips</EduBodyTitle>
            <div className="mt-7 grid gap-8 sm:grid-cols-2 sm:divide-x sm:divide-white/20">
              <div className="sm:pr-8">
                <h3 className="text-center font-poppins text-[16px] font-bold uppercase tracking-[0.12em] text-white sm:text-[18px]">Do</h3>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  {DO.map((i) => (
                    <li key={i} className="font-poppins text-[14px] text-white/95 sm:text-[16px]">{i}</li>
                  ))}
                </ul>
              </div>
              <div className="sm:pl-8">
                <h3 className="text-center font-poppins text-[16px] font-bold uppercase tracking-[0.12em] text-white sm:text-[18px]">Don&rsquo;t</h3>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  {DONT.map((i) => (
                    <li key={i} className="font-poppins text-[14px] text-white/95 sm:text-[16px]">{i}</li>
                  ))}
                </ul>
              </div>
            </div>
          </EduNavyBand>

          {/* FAQ */}
          <div className="mt-14">
            <EduBodyTitle>Frequently Asked Questions</EduBodyTitle>
            <EduFaqList items={FAQ} />
          </div>

          {/* Helpful Organizations */}
          <div className="mt-14">
            <EduBodyTitle>Helpful Organizations</EduBodyTitle>
            <EduOrgTable rightHeader="What You'll Find" rows={ORGS} />
          </div>

          <EduSourceBar sources={[]} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}