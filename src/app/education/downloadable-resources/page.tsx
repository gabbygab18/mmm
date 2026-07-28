import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { EDU_BODY_BG, EduDetailHero, EduOrgTable, EduSourceBar, EduSubtitle, EduBodyTitle } from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Downloadable Resources | Margaret's MemoryCare Music",
  description:
    'Helpful guides, checklists, and educational materials to support families, volunteers, and memory care communities.',
}

const RESOURCES = [
  {
    title: 'Dementia Communication Guide',
    body: 'Learn practical ways to communicate with people living with dementia using patience, empathy, and understanding.',
    file: '/mmm/downloads/dementia-communication-guide.pdf',
  },
  {
    title: 'Music Playlist Guide',
    body: 'A curated list of familiar songs from the 1940s, 1950s, and 1960s that encourage engagement and memory recall.',
    file: '/mmm/downloads/music-playlist-guide.pdf',
  },
  {
    title: 'Volunteer Performance Checklist',
    body: 'Everything musicians should review before arriving at a memory care performance.',
    file: '/mmm/downloads/volunteer-performance-checklist.pdf',
  },
  {
    title: 'Family Activity Guide',
    body: 'Simple music-based activities families can enjoy with their loved ones at home or during visits.',
    file: '/mmm/downloads/family-activity-guide.pdf',
  },
]

const ORGS = [
  { name: "Alzheimer's Association", href: 'https://www.alz.org', find: 'Caregiver support and educational materials' },
  { name: 'National Institute on Aging', href: 'https://www.nia.nih.gov', find: 'Dementia education and caregiving guides' },
  { name: 'American Music Therapy Association', href: 'https://www.musictherapy.org', find: 'Music therapy information and research' },
  { name: "Alzheimer's Society (UK)", href: 'https://www.alzheimers.org.uk', find: 'Practical dementia resources' },
  { name: 'Music & Memory', href: 'https://musicandmemory.org', find: 'Music-based dementia programmes' },
]

const SOURCES = [
  'https://www.nia.nih.gov/health/alzheimers-and-dementia',
  'https://www.alz.org/help-support/resources',
  'https://www.alzheimers.org.uk/get-support/publications-factsheets',
  'https://musicandmemory.org',
  'https://www.musictherapy.org/research',
]

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 19.5h16" />
    </svg>
  )
}

export default function DownloadableResourcesPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/downloadable/hero.png"
        photoAlt="Close-up of hands typing on a laptop keyboard"
        title="Downloadable Resources"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1150px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Helpful guides, checklists, and educational materials to support families, volunteers, and memory care
            communities.
          </EduSubtitle>

          {/* Resource rows */}
          <div className="mt-10 space-y-6">
            {RESOURCES.map((r) => (
              <div
                key={r.title}
                className="flex flex-col gap-5 rounded-[24px] px-6 py-7 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8"
                style={{ background: 'linear-gradient(120deg, #ffffff 0%, #eef4fa 55%, #d8e6f4 100%)' }}
              >
                <div className="sm:max-w-[70%]">
                  <h2 className="font-garamond text-[26px] font-bold text-ocean-800 sm:text-[35.7px]">{r.title}</h2>
                  <p className="mt-1.5 font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[19px]">{r.body}</p>
                </div>
                <a
                  href={r.file}
                  download={`${r.title}.pdf`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg px-6 py-3 font-poppins text-[13px] font-bold uppercase tracking-[0.12em] text-white shadow-md transition hover:brightness-110 sm:self-auto sm:text-[15.1px]"
                  style={{ background: 'linear-gradient(120deg, #4c7bb0 0%, #2f5f97 100%)' }}
                >
                  Download PDF
                  <DownloadIcon />
                </a>
              </div>
            ))}
          </div>

          {/* Helpful Organizations */}
          <div className="mt-12">
            <EduBodyTitle className="!text-white">Helpful Organizations</EduBodyTitle>
            <EduOrgTable rightHeader="Resource" rows={ORGS} />
          </div>

          <EduSourceBar sources={SOURCES} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
