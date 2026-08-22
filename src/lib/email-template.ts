/**
 * The HTML for request/performance e-mails.
 *
 * Kept apart from notifications.ts, which pulls in the service-role Supabase
 * client and is therefore server-only. Nothing here touches the database or
 * the network, so the template can be rendered and eyeballed on its own —
 * which is the only practical way to check an e-mail layout, since the real
 * constraint is what mail clients do with it rather than what TypeScript says.
 */

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Shared type and colour tokens. Declared up front because everything below
// builds strings out of them.
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const SERIF = "Georgia, 'Times New Roman', serif"
const NAVY = '#0a2f5a'
const INK = '#123556'
const MUTED = '#6b7b8d'
const RULE = '#dde5ee'

/**
 * Absolute origin for images in the signature.
 *
 * Mail clients have no page to resolve a relative path against, so every asset
 * needs a full URL. Not the Vercel preview host: those rotate per deployment
 * and would leave dead images in mail already sent.
 */
const ASSET_ORIGIN = 'https://margaretsmemorycaremusic.org'

/**
 * The brand signature, as the approved artwork itself rather than a rebuild.
 *
 * A single image is what the client supplied and what they want sent, so it is
 * used whole. Two consequences worth knowing:
 *
 *  - Many mail clients block remote images by default, and an image-only
 *    signature disappears entirely when they do. The alt text therefore
 *    carries the contact details in plain words, and a text line beneath
 *    repeats the address and site so the essentials survive with images off.
 *  - The file is served from the production origin, not a Vercel preview
 *    host, since those rotate per deployment and would break images in mail
 *    already delivered.
 *
 * Shown at the card's full 536px content width, from a 1072px source — that
 * is exactly 2x, so it stays sharp on retina without shipping more pixels
 * than any client will use.
 */
function renderSignatureHtml(): string {
  const alt = 'Margaret’s Memorycare Music — Bringing Joy Through Live Music. Connecting Musicians. Enriching Lives. info@margaretsmemorycaremusic.org · www.margaretsmemorycaremusic.org'

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="left">
        <a href="${ASSET_ORIGIN}" style="text-decoration: none;">
          <img src="${ASSET_ORIGIN}/mmm/email-signature.png"
               alt="${alt}"
               width="536"
               style="display: block; width: 100%; max-width: 536px; height: auto; border: 0;">
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 10px; font-family: ${SANS}; font-size: 12px; line-height: 18px; color: ${MUTED};">
        <a href="mailto:info@margaretsmemorycaremusic.org" style="color: ${MUTED}; text-decoration: none;">info@margaretsmemorycaremusic.org</a>
        &nbsp;&middot;&nbsp;
        <a href="${ASSET_ORIGIN}" style="color: ${MUTED}; text-decoration: none;">www.margaretsmemorycaremusic.org</a>
      </td>
    </tr>
  </table>`
}

/** Where a request/performance is in its lifecycle, for the step checklist
    appended to journey emails. The two "cancelled" variants exist because
    cancelling before vs. after acceptance leaves a different number of
    earlier steps checked off. */
export type RequestJourneyStage =
  | 'sent'
  | 'accepted'
  | 'completed'
  | 'cancelled_before_accept'
  | 'cancelled_after_accept'

const JOURNEY_STEPS = ['Request sent', 'Accepted & scheduled', 'Performance completed']


/**
 * The step checklist, as a table rather than a <ul>.
 *
 * Outlook ignores list padding and renders bullets it was not asked for, so
 * each step is a row: a fixed-width cell for the marker, a flexible one for
 * the label. That also lets the rows breathe, which a list could not do
 * consistently across clients.
 */
function renderJourneyStepsHtml(stage: RequestJourneyStage): string {
  const isCancelled = stage === 'cancelled_before_accept' || stage === 'cancelled_after_accept'
  const completedCount =
    stage === 'sent' || stage === 'cancelled_before_accept' ? 1 : stage === 'accepted' || stage === 'cancelled_after_accept' ? 2 : 3

  const rows = JOURNEY_STEPS.map((label, index) => {
    const done = index + 1 <= completedCount
    const marker = done
      ? `<span style="color: #1f7a5c; font-size: 15px; font-weight: 700;">&#10003;</span>`
      : `<span style="color: #b9c6d4; font-size: 15px;">&#9675;</span>`
    const labelStyle = done
      ? `color: ${MUTED}; text-decoration: line-through;`
      : `color: ${INK}; font-weight: 600;`
    return `<tr>
      <td width="26" valign="top" style="padding: 7px 0; line-height: 20px;">${marker}</td>
      <td valign="top" style="padding: 7px 0; font-family: ${SANS}; font-size: 14px; line-height: 20px; ${labelStyle}">${escapeHtml(label)}</td>
    </tr>`
  }).join('')

  const cancelledRow = isCancelled
    ? `<tr>
        <td width="26" valign="top" style="padding: 7px 0; line-height: 20px;"><span style="color: #b91c1c; font-size: 15px; font-weight: 700;">&#10005;</span></td>
        <td valign="top" style="padding: 7px 0; font-family: ${SANS}; font-size: 14px; line-height: 20px; color: #b91c1c; font-weight: 700;">Cancelled</td>
      </tr>`
    : ''

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}${cancelledRow}</table>`
}

/**
 * Wraps a plain-text email body plus a request-journey checklist into a
 * branded HTML message.
 *
 * Built from nested tables with inline styles, which is the only layout that
 * survives every mail client — Outlook in particular ignores flexbox, grid,
 * and most of a <style> block. The plain-text `text` part still carries the
 * same content for anyone reading without HTML.
 */
export function buildRequestJourneyEmailHtml(bodyText: string, stage: RequestJourneyStage): string {
  // The plain-text bodies open with "Hi," and close with a signature line.
  // Both are rendered by the layout here — the greeting as the lead paragraph
  // and the sign-off as the footer — so the signature is dropped to avoid
  // printing the brand name twice in a row.
  const paragraphs = bodyText
    .split('\n\n')
    .map((para) => para.trim())
    .filter((para) => para && !para.startsWith('—'))
    .map(
      (para) =>
        `<p style="margin: 0 0 14px 0; font-family: ${SANS}; font-size: 15px; line-height: 24px; color: ${INK};">${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Margaret's MemoryCare Music</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f7; -webkit-font-smoothing: antialiased;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #eef2f7;">
  <tr>
    <td align="center" style="padding: 28px 16px;">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(10,47,90,0.08);">

        <tr>
          <td style="background-color: ${NAVY}; padding: 22px 32px;">
            <p style="margin: 0; font-family: ${SERIF}; font-size: 20px; line-height: 26px; font-weight: 700; color: #ffffff;">Margaret&rsquo;s MemoryCare Music</p>
          </td>
        </tr>

        <tr>
          <td style="padding: 32px 32px 8px 32px;">${paragraphs}</td>
        </tr>

        <tr>
          <td style="padding: 8px 32px 28px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f7fafd; border: 1px solid ${RULE}; border-radius: 10px;">
              <tr>
                <td style="padding: 18px 22px;">
                  <p style="margin: 0 0 6px 0; font-family: ${SANS}; font-size: 11px; line-height: 16px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 700; color: ${MUTED};">Request status</p>
                  ${renderJourneyStepsHtml(stage)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="border-top: 1px solid ${RULE}; padding: 24px 32px 8px 32px;">
            ${renderSignatureHtml()}
          </td>
        </tr>

        <tr>
          <td style="padding: 4px 32px 26px 32px;">
            <p style="margin: 0; font-family: ${SANS}; font-size: 11px; line-height: 17px; color: ${MUTED};">
              You&rsquo;re receiving this because you have an account with Margaret&rsquo;s MemoryCare Music.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`
}

