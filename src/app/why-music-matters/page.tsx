import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'

export const metadata: Metadata = {
  title: "Why Music Matters | Margaret's MemoryCare Music",
  description:
    'How music reaches people living with dementia and memory loss — the science, the research, and resources for families, caregivers, and volunteer musicians.',
}

const TOPICS = [
  {
    icon: '/mmm/pages/wmm-science.png',
    title: 'Science of Music',
    body: 'Discover how music works in the brain and why it’s so powerful.',
    href: '/education#science',
  },
  {
    icon: '/mmm/pages/wmm-memory.png',
    title: 'Memory & Dementia',
    body: 'Understand how music impacts memory and cognitive function.',
    href: '/education#memory',
  },
  {
    icon: '/mmm/pages/wmm-research.png',
    title: 'Research',
    body: 'Explore studies and data on music and dementia care.',
    href: '/education#research',
  },
  {
    icon: '/mmm/pages/wmm-benefits.png',
    title: 'Benefits',
    body: 'See the many ways music improves the quality of life for residents.',
    href: '/education#benefits',
  },
  {
    icon: '/mmm/pages/wmm-brain.png',
    title: 'Brain Science',
    body: 'Learn about the neurological benefits of music engagement.',
    href: '/education#brain',
  },
  {
    icon: '/mmm/pages/wmm-family.png',
    title: 'Family Resources',
    body: 'Helpful information and support for families and caregivers.',
    href: '/education#families',
  },
  {
    icon: '/mmm/pages/wmm-volunteer.png',
    title: 'Volunteer Resources',
    body: 'Tools, tips, and guides for our amazing volunteer musicians.',
    href: '/education#volunteers',
  },
  {
    icon: '/mmm/pages/wmm-download.png',
    title: 'Downloadable Resources',
    body: 'Access brochures, guides, and helpful printable materials.',
    href: '/education#downloads',
  },
  {
    icon: '/mmm/pages/wmm-videos.png',
    title: 'Videos',
    body: 'Watch inspiring stories, expert interviews, and educational videos.',
    href: '/education#videos',
  },
]

export default function WhyMusicMattersPage() {
  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <PageHero
        photo="/mmm/pages/hero-photo-wmm.png"
        photoAlt="A volunteer musician playing guitar for a memory care resident"
        photoWidth="58%"
        ratioClass="aspect-[1.45] sm:aspect-[1.9] lg:aspect-[2.4]"
        photoWidthSm="46%"
        background="linear-gradient(100deg, #8bb4e0 0%, #9dbde3 32%, #a6c1de 60%, #93b8e0 100%)"
        copyWidth="max-w-[470px]"
        tailColor="#1e5aa0"
      >
        <h1 className="landing-rise font-garamond text-[26px] font-semibold leading-[1.02] text-white drop-shadow-md sm:text-[38px] md:text-[48px] lg:text-[68.5px]">
          Why Music
          <br />
          Matters
        </h1>
        <p className="landing-rise landing-delay-1 mt-3 font-poppins text-[11.5px] leading-snug text-white drop-shadow sm:text-[15px] md:text-[17px] lg:text-[20.9px]">
          Music reaches places words cannot. For individuals living with dementia and memory loss, music can unlock
          memories, lift spirits, and create moments of joy and connection.
        </p>
      </PageHero>

      {/* ============ Explore ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e5aa0 0%, #0f3b6b 100%)' }}>
        <div className="relative mx-auto max-w-[1200px] px-6 py-16 sm:px-8">
          <h2 className="text-center font-garamond text-[32px] font-bold text-white sm:text-[48.6px]">
            Explore the Science and Impact of Music
          </h2>
          <p className="mx-auto mt-3 max-w-[860px] text-center font-poppins text-[15px] leading-relaxed text-white/95 sm:text-[20.9px]">
            Learn how music can transform lives, strengthen connections, and support brain health.
          </p>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <li key={topic.title}>
                <Link
                  href={topic.href}
                  className="group flex h-full items-start gap-4 rounded-2xl px-6 py-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: 'linear-gradient(120deg, #faf4e7 0%, #eaf0f7 55%, #d3e1ef 100%)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={topic.icon} alt="" className="h-16 w-16 shrink-0 object-contain" />
                  <div className="flex-1">
                    <h3 className="font-garamond text-[19px] font-bold leading-tight text-ocean-900 sm:text-[19.7px]">
                      {topic.title}
                    </h3>
                    <p className="mt-1.5 font-poppins text-[11.1px] leading-relaxed text-ocean-900/90">{topic.body}</p>
                  </div>
                  <svg
                    className="mt-auto h-6 w-6 shrink-0 self-end text-ocean-800 transition group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h15m0 0l-5.5-5.5M19 12l-5.5 5.5" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
