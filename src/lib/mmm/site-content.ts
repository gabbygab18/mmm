import { cache } from 'react'
import { createSupabasePublicClient } from '@/lib/supabase/public'

/**
 * Editable marketing copy.
 *
 * Every field an admin can change is registered here with the text the page
 * shipped with. That default is what renders until somebody edits it — the
 * `site_content` table holds overrides only, so an empty table means the site
 * reads exactly as it did before this existed, and a database that is
 * unreachable degrades to the shipped copy rather than to blank headings.
 *
 * Keys are `page.section.field`. Adding a field is a one-line change here plus
 * reading it in the page; the admin editor builds itself from this registry.
 */

export type ContentField = {
  key: string
  /** Shown as the field's name in the admin editor. */
  label: string
  /** The text compiled into the page. */
  default: string
  /** Renders as a textarea rather than a single line. */
  multiline?: boolean
}

export type ContentGroup = {
  id: string
  /** Page name in the admin editor. */
  title: string
  /** Where to look at the result. */
  href: string
  sections: { title: string; fields: ContentField[] }[]
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'home',
    title: 'Home',
    href: '/',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'home.hero.title', label: 'Headline', default: 'Share the Joy of Live Music with Memory Care Communities' },
          {
            key: 'home.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default:
              "Join Margaret's Memorycare Music by creating your volunteer profile, browsing participating memory care communities, and expressing your interest in serving. We'll help make your first connection a success.",
          },
        ],
      },
      {
        title: 'How It Works',
        fields: [{ key: 'home.how.title', label: 'Section heading', default: 'How It Works' }],
      },
      {
        title: 'Choose Your Path',
        fields: [
          { key: 'home.path.title', label: 'Section heading', default: 'Choose Your Path' },
          {
            key: 'home.path.body',
            label: 'Section sub-heading',
            multiline: true,
            default: 'Volunteer your music, or bring live performances to your residents.',
          },
          { key: 'home.path.musician.title', label: 'Musician card — title', default: 'I’m a Musician' },
          {
            key: 'home.path.musician.body',
            label: 'Musician card — copy',
            multiline: true,
            default:
              "Create your volunteer profile, browse participating memory care communities, and express interest in where you'd like to serve.",
          },
          { key: 'home.path.musician.cta', label: 'Musician card — button', default: 'Join as Musician' },
          {
            key: 'home.path.community.title',
            label: 'Community card — title',
            default: 'I’m a Memory Care Community',
          },
          {
            key: 'home.path.community.body',
            label: 'Community card — copy',
            multiline: true,
            default:
              'Register your community and connect with volunteer musicians who want to share the joy of live music with your residents.',
          },
          { key: 'home.path.community.cta', label: 'Community card — button', default: 'Register Your Community' },
        ],
      },
      {
        title: 'Why Music Matters',
        fields: [
          { key: 'home.wmm.title', label: 'Section heading', default: 'Why Music Matters' },
          {
            key: 'home.wmm.body1',
            label: 'First paragraph',
            multiline: true,
            default: 'Music has a unique ability to reach people living with dementia and memory loss.',
          },
          {
            key: 'home.wmm.body2',
            label: 'Second paragraph',
            multiline: true,
            default: 'Research has shown that familiar songs can:',
          },
        ],
      },
    ],
  },
  {
    id: 'about',
    title: 'About',
    href: '/about',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'about.hero.title', label: 'Headline', multiline: true, default: 'Every Song\nHas a Story.' },
          {
            key: 'about.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default: 'The story behind\nMargaret’s Memorycare Music',
          },
        ],
      },
      {
        title: 'Our Story',
        fields: [{ key: 'about.story.title', label: 'Section heading', default: 'Our Story' }],
      },
    ],
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    href: '/how-it-works',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'how.hero.title', label: 'Headline', default: 'How It Works' },
          {
            key: 'how.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default:
              'We make it simple to bring the joy of live music to memory care communities. Two easy paths. One meaningful mission.',
          },
        ],
      },
    ],
  },
  {
    id: 'why-music-matters',
    title: 'Why Music Matters',
    href: '/why-music-matters',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'wmm.hero.title', label: 'Headline', multiline: true, default: 'Why Music\nMatters' },
          {
            key: 'wmm.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default:
              'Music reaches places words cannot. For individuals living with dementia and memory loss, music can unlock memories, lift spirits, and create moments of joy and connection.',
          },
        ],
      },
      {
        title: 'Explore',
        fields: [
          {
            key: 'wmm.explore.title',
            label: 'Section heading',
            default: 'Explore the Science and Impact of Music',
          },
          {
            key: 'wmm.explore.body',
            label: 'Section sub-heading',
            multiline: true,
            default: 'Learn how music can transform lives, strengthen connections, and support brain health.',
          },
        ],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    href: '/contact',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'contact.hero.title', label: 'Headline', default: 'We’d Love to Hear from You!' },
          {
            key: 'contact.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default:
              'Whether you’re a musician who wants to volunteer or a facility looking to bring live music to your residents, we’re here to help.',
          },
        ],
      },
      {
        title: 'Get in Touch',
        fields: [
          { key: 'contact.touch.title', label: 'Heading', default: 'Get in Touch!' },
          {
            key: 'contact.touch.body',
            label: 'Copy',
            multiline: true,
            default: 'We’d love to connect and answer any questions you may have.',
          },
          { key: 'contact.email', label: 'Contact e-mail address', default: 'info@margaretsmemorycaremusic.org' },
        ],
      },
      {
        title: 'Our Location',
        fields: [
          { key: 'contact.location.title', label: 'Heading', default: 'Our Location' },
          {
            key: 'contact.location.body',
            label: 'Copy',
            multiline: true,
            default: 'Proudly serving memory care communities throughout Palm Beach County, Florida',
          },
        ],
      },
    ],
  },
  {
    id: 'faq',
    title: 'FAQ',
    href: '/faq',
    sections: [
      {
        title: 'Hero',
        fields: [
          { key: 'faq.hero.title', label: 'Headline', default: 'Frequently Asked Questions' },
          {
            key: 'faq.hero.body',
            label: 'Sub-heading',
            multiline: true,
            default:
              'Find answers to common questions about Margaret’s Memorycare Music and how we bring the joy of live music to memory care communities.',
          },
        ],
      },
      {
        title: 'Still have questions',
        fields: [
          { key: 'faq.cta.title', label: 'Heading', default: 'Still have questions?' },
          {
            key: 'faq.cta.body',
            label: 'Copy',
            multiline: true,
            default: 'We’re happy to help! Reach out to our team anytime.',
          },
        ],
      },
    ],
  },
]

/** Every registered field, flattened — used by the editor and for defaults. */
export const CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap((g) =>
  g.sections.flatMap((s) => s.fields),
)

const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, f.default]))

export type SiteContent = (key: string) => string

/**
 * Reads the overrides once per request and returns a lookup that falls back to
 * the shipped copy. `cache` keeps it to a single query even when several
 * sections of a page ask for it.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  let overrides: Record<string, string> = {}

  try {
    const supabase = createSupabasePublicClient()
    const { data, error } = await supabase.from('site_content').select('key, value')
    if (!error && data) {
      overrides = Object.fromEntries(
        (data as { key: string; value: string }[])
          // A cleared field means "use the shipped copy", not "show nothing".
          .filter((row) => row.value.trim().length > 0)
          .map((row) => [row.key, row.value]),
      )
    }
  } catch {
    // Unreachable database falls through to the shipped copy below.
  }

  return (key: string) => overrides[key] ?? DEFAULTS[key] ?? ''
})
