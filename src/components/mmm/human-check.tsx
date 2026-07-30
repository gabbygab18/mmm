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

type Challenge = {
  /** Question shown to the person. */
  prompt: string
  /** Accepted replies, compared case-insensitively after trimming. */
  answers: string[]
  /** Drives the on-screen keyboard on phones. */
  kind: 'number' | 'text'
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']

/** Numbers accept digits or the spelled-out word — kinder to older users. */
function numberAnswer(n: number) {
  return NUMBER_WORDS[n] ? [String(n), NUMBER_WORDS[n]] : [String(n)]
}

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const INSTRUMENT_WORDS = ['piano', 'guitar', 'violin', 'flute', 'drum'] as const
const NON_INSTRUMENT_WORDS = ['table', 'window', 'pillow', 'ladder', 'teapot'] as const
const SPELLING_WORDS = ['MUSIC', 'PIANO', 'HEART', 'SONG'] as const
const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'] as const

/**
 * The challenge pool. Everything here is answerable without math beyond single
 * digits or any special knowledge — activities directors and older volunteers
 * fill this in too, so nothing tricky, no puzzles, no image CAPTCHAs.
 */
const GENERATORS: Array<() => Challenge> = [
  // Addition
  () => {
    const a = Math.floor(Math.random() * 5) + 2
    const b = Math.floor(Math.random() * 5) + 2
    return { prompt: `What is ${a} + ${b}?`, answers: numberAnswer(a + b), kind: 'number' }
  },
  // Subtraction — always a positive result
  () => {
    const a = Math.floor(Math.random() * 5) + 5
    const b = Math.floor(Math.random() * 4) + 1
    return { prompt: `What is ${a} − ${b}?`, answers: numberAnswer(a - b), kind: 'number' }
  },
  // Count the letters in a short, familiar word
  () => {
    const word = pick(SPELLING_WORDS)
    return {
      prompt: `How many letters are in the word ${word}?`,
      answers: numberAnswer(word.length),
      kind: 'number',
    }
  },
  // Type a word back
  () => {
    const word = pick(SPELLING_WORDS)
    return { prompt: `Please type the word ${word}.`, answers: [word], kind: 'text' }
  },
  // Which one is an instrument
  () => {
    const instrument = pick(INSTRUMENT_WORDS)
    const others = [...NON_INSTRUMENT_WORDS].sort(() => Math.random() - 0.5).slice(0, 2)
    const options = [instrument, ...others].sort(() => Math.random() - 0.5)
    return {
      prompt: `Which of these is a musical instrument — ${options.join(', ')}?`,
      answers: [instrument],
      kind: 'text',
    }
  },
  // Day that follows
  () => {
    const i = Math.floor(Math.random() * WEEKDAYS.length)
    const next = WEEKDAYS[(i + 1) % WEEKDAYS.length]
    return { prompt: `Which day comes after ${WEEKDAYS[i]}?`, answers: [next], kind: 'text' }
  },
  // Finish the scale — Do, Re, __
  () => {
    const i = Math.floor(Math.random() * (SOLFEGE.length - 2))
    return {
      prompt: `Finish the musical scale: ${SOLFEGE[i]}, ${SOLFEGE[i + 1]}, ___?`,
      answers: [SOLFEGE[i + 2]],
      kind: 'text',
    }
  },
]

const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ')

/** Picks a challenge, avoiding an immediate repeat of the current prompt. */
function makeChallenge(previous?: Challenge): Challenge {
  for (let attempt = 0; attempt < 6; attempt++) {
    const next = pick(GENERATORS)()
    if (!previous || next.prompt !== previous.prompt) return next
  }
  return pick(GENERATORS)()
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
  const cleared = usingTurnstile
    ? Boolean(token)
    : challenge.answers.some((a) => normalize(a) === normalize(reply)) && reply.trim() !== ''

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
            <span className="font-poppins text-[13px] text-ocean-900">{challenge.prompt}</span>
            <label className="sr-only" htmlFor="mmm-human-check">
              {challenge.prompt}
            </label>
            <input
              id="mmm-human-check"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              inputMode={challenge.kind === 'number' ? 'numeric' : 'text'}
              autoComplete="off"
              maxLength={challenge.kind === 'number' ? 8 : 16}
              className={`rounded-lg border border-ocean-300 px-3 py-1.5 text-center font-poppins text-[13px] text-ocean-900 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400 ${
                challenge.kind === 'number' ? 'w-20' : 'w-32'
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setChallenge((cur) => makeChallenge(cur))
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
