'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Human verification for the public registration and contact forms.
 *
 * Two modes:
 *  - If NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, renders Cloudflare Turnstile and
 *    reports its token. Turnstile is free, privacy-friendly, and usually
 *    invisible to real people.
 *  - Otherwise falls back to a built-in challenge so the forms are never
 *    unprotected while the key is being provisioned.
 *
 * Both modes also run two silent checks that stop most scripted signups:
 *  - a honeypot field that only a bot will fill in, and
 *  - a minimum time-on-form, since bots submit almost instantly.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const MIN_SECONDS_ON_FORM = 4

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

export type HumanCheckValue = {
  /** True when the person has cleared the challenge and the silent checks. */
  verified: boolean
  /** Turnstile token, when Turnstile is in use. */
  token: string | null
}

function makeChallenge() {
  // Small addition problems only — readable for older or less technical users,
  // which matters because activities directors fill this in too.
  const a = Math.floor(Math.random() * 5) + 2
  const b = Math.floor(Math.random() * 5) + 2
  return { a, b, answer: a + b }
}

export function HumanCheck({ onChange }: { onChange: (v: HumanCheckValue) => void }) {
  const mountedAt = useMemo(() => Date.now(), [])
  const [honeypot, setHoneypot] = useState('')
  const [challenge, setChallenge] = useState(makeChallenge)
  const [reply, setReply] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement | null>(null)

  const usingTurnstile = Boolean(SITE_KEY)

  // ---- Turnstile ----
  useEffect(() => {
    if (!usingTurnstile || !widgetRef.current) return

    let widgetId: string | undefined
    const el = widgetRef.current

    const render = () => {
      if (!window.turnstile || !el) return
      widgetId = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        theme: 'light',
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = render
      document.head.appendChild(script)
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [usingTurnstile])

  // ---- Report status upward ----
  const cleared = usingTurnstile ? Boolean(token) : reply.trim() === String(challenge.answer)

  useEffect(() => {
    const fastEnoughToBeABot = (Date.now() - mountedAt) / 1000 < MIN_SECONDS_ON_FORM
    onChange({
      verified: cleared && honeypot === '' && !fastEnoughToBeABot,
      token,
    })
    // `onChange` is intentionally excluded — parents pass inline callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleared, honeypot, token, mountedAt])

  return (
    <div>
      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="mmm-company-website">Company website</label>
        <input
          id="mmm-company-website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {usingTurnstile ? (
        <div className="flex flex-col items-center gap-2">
          <div ref={widgetRef} />
          <p className="font-poppins text-[10px] text-ocean-900/60">Verifying you&apos;re not a robot.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ocean-300 bg-white px-4 py-3.5">
          <p className="font-poppins text-[10.7px] font-bold text-ocean-900">Quick check — are you human?</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-poppins text-[13px] text-ocean-900">
              What is {challenge.a} + {challenge.b}?
            </span>
            <label className="sr-only" htmlFor="mmm-human-check">
              What is {challenge.a} plus {challenge.b}?
            </label>
            <input
              id="mmm-human-check"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              inputMode="numeric"
              maxLength={3}
              className="w-20 rounded-lg border border-ocean-300 px-3 py-1.5 text-center font-poppins text-[13px] text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400"
            />
            <button
              type="button"
              onClick={() => {
                setChallenge(makeChallenge())
                setReply('')
              }}
              className="font-poppins text-[10.5px] font-bold text-ocean-700 underline transition hover:text-ocean-900"
            >
              New question
            </button>
            {cleared && (
              <span className="flex items-center gap-1 font-poppins text-[10.5px] font-bold text-emerald-700">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
