import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'
import { Lines } from '@/components/mmm/lines'
import { getSiteContent } from '@/lib/mmm/site-content'

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
    href: '/education/science-of-music',
  },
  {
    icon: '/mmm/pages/wmm-memory.png',
    title: 'Memory & Dementia',
    body: 'Understand how music impacts memory and cognitive function.',
    href: '/education/understanding-memory-and-dementia',
  },
  {
    icon: '/mmm/pages/wmm-research.png',
    title: 'Research',
    body: 'Explore studies and data on music and dementia care.',
    href: '/education/research-behind-music-and-memory',
  },
  {
    icon: '/mmm/pages/wmm-benefits.png',
    title: 'Benefits',
    body: 'See the many ways music improves the quality of life for residents.',
    href: '/education/benefits-of-live-music',
  },
  {
    icon: '/mmm/pages/wmm-brain.png',
    title: 'Brain Science',
    body: 'Learn about the neurological benefits of music engagement.',
    href: '/education/music-and-the-brain',
  },
  {
    icon: '/mmm/pages/wmm-family.png',
    title: 'Family Resources',
    body: 'Helpful information and support for families and caregivers.',
    href: '/education/family-resources',
  },
  {
    icon: '/mmm/pages/wmm-volunteer.png',
    title: 'Volunteer Resources',
    body: 'Tools, tips, and guides for our amazing volunteer musicians.',
    href: '/education/volunteer-resources',
  },
  {
    icon: '/mmm/pages/wmm-download.png',
    title: 'Downloadable Resources',
    body: 'Access brochures, guides, and helpful printable materials.',
    href: '/education/downloadable-resources',
  },
  {
    icon: '/mmm/pages/wmm-videos.png',
    title: 'Videos',
    body: 'Watch inspiring stories, expert interviews, and educational videos.',
    href: '/education/videos',
  },
]

export default async function WhyMusicMattersPage() {
  const t = await getSiteContent()

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============
          The photo has a bright white transition band partway down, which
          white hero text is unreadable over. Rather than crop tightly to
          dodge it — that turned out fragile, since a short box then clips
          (via overflow-hidden) whatever text doesn't fit at a given wrap
          length — PageHero now scrims the whole band with a dark gradient,
          which guarantees contrast regardless of what's in the photo
          underneath. mobileHeroAspect here just needs to be tall enough for
          the wrapped title+body to never clip; it no longer has to dodge
          anything in the image itself. */}
      <PageHero
        heroImage="/mmm/pages/wmm-hero.png"
        heroAspect="1100 / 545"
        mobileHeroAspect="1100 / 620"
        // Centred within the full band, the copy sat noticeably lower than
        // /about's hero (which centres within its top 62%). Trimmed so the
        // block lifts toward the same height — not all the way to 62%, since
        // this hero's body copy runs several lines longer than /about's
        // two-line subtitle and would ride up into the header.
        copyBand="82%"
        // Tablet needs a little more trim than desktop: the band is the same
        // wide shape but far shorter in absolute pixels there, while the copy
        // barely shrinks, so the same percentage leaves the block sitting
        // lower in the frame than it does on a full-width desktop hero.
        tabletCopyBand="76%"
        // Centring — even in a shrunk band — kept drifting the text down
        // toward the couple in the photo as it wrapped to more/fewer lines.
        // Pinned to the top instead: it stays in the lighter upper portion
        // of the photo no matter how many lines the copy wraps to. The band
        // height still sizes the scrim behind it, so it's kept tall enough
        // to cover the text plus some breathing room.
        mobileCopyBand="72%"
        mobileCopyAlign="start"
        // Narrower on mobile only — Tria's reference wraps the body into
        // several short lines rather than our 3 longer ones. A width cap
        // reflows it that way for any edit to the copy, instead of baking
        // one specific wrap into the CMS content as hard breaks (which held
        // regardless of how much text was there, and is what pushed the
        // block tall enough to overlap the photo before).
        // Percentage, not a fixed px: the photo's clear left area is a share
        // of the image width, so it grows with the viewport while a fixed
        // cap would not — at wider phone widths the text drifted out of it.
        // Held through tablet for the same reason: 470px of a ~700px tablet
        // container is two thirds of the width, which ran the copy straight
        // over the couple. The fixed px only takes over at `lg`, where it
        // already works out to roughly the same share of the container.
        copyWidth="max-w-[44%] sm:max-w-[46%] lg:max-w-[470px]"
        tailColor="#1e5aa0"
      >
        {/* Tria's spec, confirmed over Slack: title 23.5px Cormorant Garamond,
            body 7.8px Poppins — her reference screenshot only looks bigger
            because the Figma frame itself was captured zoomed in; these are
            the real values at mobile width. */}
        <h1 className="landing-rise font-garamond text-[23.5px] font-semibold leading-[1.02] text-white [text-shadow:0_1px_8px_rgba(10,47,90,0.8)] sm:text-[38px] md:text-[48px] lg:text-[68.5px]">
          <Lines text={t('wmm.hero.title')} />
        </h1>
        {/* Body size tracks the copy column's width so the block keeps the
            same proportions the desktop hero has (20.9px in a 470px column).
            The old 15/17px were sized for a full-width tablet column and ran
            several lines too tall once that column was capped. */}
        <p className="landing-rise landing-delay-1 mt-2 font-poppins text-[7.8px] leading-tight text-white [text-shadow:0_1px_8px_rgba(10,47,90,0.8)] sm:mt-3 sm:leading-snug sm:text-[12px] md:text-[14px] lg:text-[20.9px]">
          <Lines text={t('wmm.hero.body')} />
        </p>
      </PageHero>

      {/* ============ Explore ============ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1e5aa0 0%, #0f3b6b 100%)' }}>
        <div className="relative mx-auto max-w-[1200px] px-6 py-16 sm:px-8">
          <h2 className="text-center font-garamond text-[32px] font-bold text-white sm:text-[48.6px]">
            <Lines text={t('wmm.explore.title')} />
          </h2>
          {/* Wide enough to keep the line unbroken on desktop, as in the pack. */}
          <p className="mx-auto mt-3 max-w-[1100px] text-center font-poppins text-[15px] leading-relaxed text-white/95 sm:text-[20.9px]">
            <Lines text={t('wmm.explore.body')} />
          </p>

          {/* auto-rows-fr: every tile the same height, not just the ones sharing
              a row — the copy runs to three lines in some and two in others. */}
          <ul className="mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
