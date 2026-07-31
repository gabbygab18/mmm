import { CONTENT_GROUPS, getSiteContent } from '@/lib/mmm/site-content'
import { ContactClient } from './contact-client'

/**
 * Contact — the form itself is interactive, so it stays a client component.
 * This wrapper reads the editable copy on the server and hands it down as a
 * plain object; a lookup function cannot cross that boundary.
 */

const KEYS = CONTENT_GROUPS.find((g) => g.id === 'contact')!
  .sections.flatMap((s) => s.fields)
  .map((f) => f.key)

export default async function ContactPage() {
  const t = await getSiteContent()
  const content = Object.fromEntries(KEYS.map((key) => [key, t(key)]))

  return <ContactClient content={content} />
}
