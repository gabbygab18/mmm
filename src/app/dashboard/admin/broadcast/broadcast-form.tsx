'use client'

import { useEffect, useState } from 'react'
import {
  countBroadcastRecipientsAction,
  sendBroadcastAction,
  type BroadcastAudience,
} from './actions'

/**
 * Compose and send a platform-wide e-mail.
 *
 * Deliberately two-step. A broadcast cannot be recalled once it leaves, so
 * the send button opens a confirmation that names the exact number of people
 * about to be mailed rather than firing straight away.
 */

const AUDIENCES: { value: BroadcastAudience; label: string; hint: string }[] = [
  { value: 'musician', label: 'Volunteer musicians', hint: 'Everyone registered as a musician' },
  { value: 'center_coordinator', label: 'Facilities', hint: 'Everyone registered as a memory care community' },
]

export function BroadcastForm() {
  const [audiences, setAudiences] = useState<BroadcastAudience[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; skipped: number } | null>(null)

  // Keep the headline count honest as the selection changes — it is the one
  // number someone will read before committing to send.
  useEffect(() => {
    let cancelled = false
    if (audiences.length === 0) {
      setRecipientCount(0)
      return
    }
    setCounting(true)
    countBroadcastRecipientsAction(audiences)
      .then(({ count }) => {
        if (!cancelled) setRecipientCount(count)
      })
      .finally(() => {
        if (!cancelled) setCounting(false)
      })
    return () => {
      cancelled = true
    }
  }, [audiences])

  const toggleAudience = (value: BroadcastAudience) =>
    setAudiences((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    )

  const canSend = audiences.length > 0 && subject.trim() !== '' && body.trim() !== '' && !sending

  const send = async () => {
    setSending(true)
    setError(null)
    const outcome = await sendBroadcastAction(audiences, subject, body)
    setSending(false)
    setConfirming(false)

    if (!outcome.ok) {
      setError(outcome.error)
      return
    }

    setResult({
      sent: outcome.sentCount,
      failed: outcome.failedCount,
      total: outcome.recipientCount,
      skipped: outcome.skippedCount,
    })
    setSubject('')
    setBody('')
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="font-garamond text-[22px] font-bold text-emerald-900">Broadcast sent</h2>
        <p className="mt-2 font-poppins text-sm text-emerald-900/80">
          Delivered to {result.sent} of {result.total} recipients.
          {result.failed > 0 ? ` ${result.failed} could not be sent.` : ''}
        </p>
        {result.skipped > 0 && (
          <p className="mt-1.5 font-poppins text-xs text-emerald-900/70">
            {result.skipped} test {result.skipped === 1 ? 'account was' : 'accounts were'} skipped — addresses on
            placeholder domains like example.com cannot receive mail.
          </p>
        )}
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-2 font-poppins text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
        >
          Write another
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ocean-200/70 bg-white p-6 shadow-sm">
        <fieldset>
          <legend className="font-poppins text-sm font-semibold text-ocean-900">Send to</legend>
          <p className="mt-0.5 font-poppins text-[12.5px] text-ocean-900/60">
            Pick one or both. Each group is mailed separately.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {AUDIENCES.map((option) => {
              const checked = audiences.includes(option.value)
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${
                    checked ? 'border-ocean-800 bg-ocean-50' : 'border-ocean-200 bg-white hover:border-ocean-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAudience(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
                  />
                  <span>
                    <span className="block font-poppins text-sm font-semibold text-ocean-900">{option.label}</span>
                    <span className="block font-poppins text-xs text-ocean-900/60">{option.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <p className="mt-4 font-poppins text-[12.5px] text-ocean-900/70">
          {counting
            ? 'Counting recipients…'
            : audiences.length === 0
              ? 'Choose an audience to see how many people this reaches.'
              : `This will reach ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}.`}
        </p>
        <p className="mt-1 font-poppins text-[11.5px] text-ocean-900/50">
          Excluded automatically: anyone who turned e-mail notifications off, deleted accounts, and test
          accounts on placeholder domains such as example.com.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-ocean-200/70 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="font-poppins text-sm font-semibold text-ocean-900">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. New performance opportunities this month"
            className="mt-1.5 w-full rounded-lg border border-ocean-300 px-3 py-2.5 font-poppins text-sm text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
          />
        </label>

        <label className="block">
          <span className="font-poppins text-sm font-semibold text-ocean-900">Message</span>
          <span className="mt-0.5 block font-poppins text-xs text-ocean-900/60">
            Plain text. Leave a blank line between paragraphs. The branded header and signature are added automatically.
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            placeholder={'Hi,\n\nHere is what’s new this month...\n\nThank you for being part of Margaret’s MemoryCare Music.'}
            className="mt-1.5 w-full resize-y rounded-lg border border-ocean-300 px-3 py-2.5 font-poppins text-sm text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
          />
        </label>

        {error && <p className="font-poppins text-sm font-medium text-red-700">{error}</p>}

        <button
          type="button"
          disabled={!canSend}
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-ocean-800 px-6 py-2.5 font-poppins text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Review and send
        </button>
      </div>

      {confirming && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="broadcast-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/60 px-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="broadcast-confirm-title" className="font-garamond text-[22px] font-bold text-ocean-900">
              Send to {recipientCount} {recipientCount === 1 ? 'person' : 'people'}?
            </h2>
            <p className="mt-2 font-poppins text-sm text-ocean-900/75">
              This sends immediately and cannot be recalled.
            </p>
            <div className="mt-4 rounded-lg border border-ocean-200 bg-ocean-50/60 p-3">
              <p className="font-poppins text-xs font-semibold uppercase tracking-wide text-ocean-900/50">Subject</p>
              <p className="mt-0.5 font-poppins text-sm font-medium text-ocean-900">{subject}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={send}
                disabled={sending}
                className="rounded-lg bg-ocean-800 px-5 py-2.5 font-poppins text-sm font-bold text-white transition hover:bg-ocean-700 disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send now'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={sending}
                className="rounded-lg border border-ocean-300 px-5 py-2.5 font-poppins text-sm font-semibold text-ocean-900 transition hover:bg-ocean-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
