/**
 * Renders the request e-mail to an HTML file so the layout can be opened in a
 * browser and checked. Mail-client rendering is the real constraint here and
 * nothing in the type system speaks to it, so having a way to actually look at
 * the thing matters more than usual.
 *
 * Usage: npx tsx scripts/preview-email.ts [outFile] [stage]
 *   stage: sent | accepted | completed | cancelled_before_accept | cancelled_after_accept
 */
import { writeFileSync } from 'node:fs'
import { buildRequestJourneyEmailHtml, type RequestJourneyStage } from '../src/lib/email-template'

const outFile = process.argv[2] ?? 'email-preview.html'
const stage = (process.argv[3] ?? 'sent') as RequestJourneyStage

const body =
  "Hi,\n\nGab V sent you a performance request for Aug 22, 2026 at 10:00 AM - 11:00 AM.\n\nReview and respond from your dashboard.\n\n— Margaret's MemoryCare Music"

writeFileSync(outFile, buildRequestJourneyEmailHtml(body, stage))
console.log(`Wrote ${outFile} (stage: ${stage})`)
