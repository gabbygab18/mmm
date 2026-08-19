'use client'

/**
 * First-Time Education — prepares volunteer musicians before their first
 * performance. Lives inside the dashboard (auth-protected) since it's
 * onboarding/reference material for signed-in volunteers, not general-public
 * marketing content — it used to sit at the public /education route wearing
 * the marketing header/footer with a "Continue to Dashboard" button, which
 * made it look like part of signup while not actually requiring a session.
 *
 * Unlike the old public version, this always shows every section — no
 * mobile-only "Next" pagination. There was never a good reason for a
 * reference page to be split across two screens on a phone.
 */

const DOS = [
  'Smile and maintain a warm, friendly presence.',
  'Introduce yourself and explain what you’ll be doing.',
  'Speak slowly and clearly.',
  'Encourage participation and enjoyment.',
  'Be patient and flexible.',
]

const DONTS = [
  'Don’t correct memories.',
  'Don’t argue or try to reason.',
  'Don’t rush or pressure for responses.',
  'Don’t use complicated jargon.',
  'Don’t overwhelm with too much at once.',
]

const TIPS = [
  { label: 'Length', text: '15-45 minutes is ideal.' },
  { label: 'Volume', text: 'Keep your volume comfortable and moderate.' },
  { label: 'Song Selection', text: 'Choose familiar, meaningful songs.' },
  { label: 'Interaction', text: 'Engage with smiles, eye contact, and conversation.' },
]

const SONGS_COL_1 = ["40's Classic", "50's Favorites", '60s Hits', 'Big Band Era', 'Elvis Presley', 'Frank Sinatra']
const SONGS_COL_2 = ['The Beatles', 'Nat King Cole']

function SectionCard({ children, className = '', decorated = false }: { children: React.ReactNode; className?: string; decorated?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl px-5 py-8 shadow-sm sm:px-10 ${className}`}
      style={{ background: 'linear-gradient(115deg, #faf4e7 0%, #eef3f8 55%, #cfe0ef 100%)' }}
    >
      {decorated && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-contain bg-right bg-no-repeat opacity-25"
          style={{ backgroundImage: "url('/mmm/notes-bg.png')" }}
          aria-hidden="true"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-poppins text-[17px] font-bold text-ocean-900 sm:text-[20.4px]">{children}</h2>
}

export default function DashboardEducationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-garamond text-[28px] font-bold text-ocean-900">First-Time Education</h1>
        <p className="mt-1 font-poppins text-[13px] text-ocean-900/70">
          Thank you for volunteering your music and your heart. Complete these short lessons to help you feel confident
          and prepared for your first performance.
        </p>
      </div>

      <div
        className="space-y-8 rounded-2xl p-4 sm:p-8"
        style={{ background: 'linear-gradient(180deg, #10416f 0%, #0a2f5a 55%, #072544 100%)' }}
      >
        {/* 1. What We Do */}
        <SectionCard>
          <SectionTitle>1.&thinsp;What We Do</SectionTitle>
          <div className="mt-6 grid gap-10 md:grid-cols-2">
            <div className="flex items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-mission.png" alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
              <div>
                <h3 className="font-garamond text-[26px] font-bold text-ocean-900 sm:text-[32px]">Mission</h3>
                <p className="mt-1 max-w-[340px] font-poppins text-[13px] leading-relaxed text-ocean-900 sm:text-[14.6px]">
                  To improve the lives of people with memory-related conditions through the healing power of live music.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mmm/icon-vision.png" alt="" className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
              <div>
                <h3 className="font-garamond text-[26px] font-bold text-ocean-900 sm:text-[32px]">Vision</h3>
                <p className="mt-1 max-w-[420px] font-poppins text-[13px] leading-relaxed text-ocean-900 sm:text-[14.6px]">
                  A world where every person living with memory-related conditions experiences joy, connection, and
                  moments of meaning through music.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 2. Understanding Memory Care */}
        <SectionCard>
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionTitle>2.&thinsp;Understanding Memory Care</SectionTitle>
              <div className="mt-6 space-y-7">
                <div className="flex items-start gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/icon-dementia.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
                  <div>
                    <h3 className="font-garamond text-[20px] font-bold text-ocean-900 sm:text-[23px]">What is Dementia?</h3>
                    <p className="mt-1 max-w-[420px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                      Dementia is not a normal part of aging. It affects memory, thinking, behaviour, and emotions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mmm/icon-music-helps.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
                  <div>
                    <h3 className="font-garamond text-[20px] font-bold text-ocean-900 sm:text-[23px]">Why Music Helps</h3>
                    <p className="mt-1 max-w-[420px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                      Music can reach areas of the brain that remain intact, reducing anxiety, improving mood, and
                      sparking meaningful connections.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden min-h-[240px] overflow-hidden rounded-xl md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mmm/edu-quote.png"
                alt="“When words fail, music speaks.”"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </SectionCard>

        {/* 3 & 4. Do's / Don'ts */}
        <SectionCard decorated>
          <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-ocean-300/70">
            <div>
              <SectionTitle>3.&thinsp;Do&rsquo;s</SectionTitle>
              <ul className="mt-5 list-disc space-y-2 pl-6">
                {DOS.map((item) => (
                  <li key={item} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:pl-10">
              <SectionTitle>4.&thinsp;Don&rsquo;ts</SectionTitle>
              <ul className="mt-5 list-disc space-y-2 pl-6">
                {DONTS.map((item) => (
                  <li key={item} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* 5 & 6. Performance Tips / Suggested Songs */}
        <SectionCard>
          <div className="grid gap-10 md:grid-cols-2 md:divide-x md:divide-ocean-300/70">
            <div>
              <SectionTitle>5.&thinsp;Performance Tips</SectionTitle>
              <ul className="mt-5 list-disc space-y-3 pl-6">
                {TIPS.map((tip) => (
                  <li key={tip.label} className="font-poppins text-[12.5px] text-ocean-900 sm:text-[13.7px]">
                    <span className="font-bold">{tip.label}</span>
                    <br />
                    {tip.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:pl-10">
              <SectionTitle>6.&thinsp;Suggested Songs</SectionTitle>
              <p className="mt-1 pl-1 font-poppins text-[12px] text-ocean-900">
                Explore timeless favorites that residents love.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-6">
                <ul className="list-disc space-y-2 pl-6">
                  {SONGS_COL_1.map((s) => (
                    <li key={s} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                      {s}
                    </li>
                  ))}
                </ul>
                <ul className="list-disc space-y-2 pl-6">
                  {SONGS_COL_2.map((s) => (
                    <li key={s} className="font-poppins text-[12.5px] font-bold text-ocean-900 sm:text-[13.7px]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 7. Performance Videos */}
        <SectionCard>
          <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <SectionTitle>7.&thinsp;Performance Videos</SectionTitle>
              <p className="mt-3 max-w-[300px] font-poppins text-[12.4px] leading-relaxed text-ocean-900">
                Watch helpful videos to see examples, get tips, and feel more confident.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-ocean-900 px-4 py-2 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 14V8l6 4-6 4z" />
                </svg>
                Coming Soon
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex aspect-video items-center justify-center rounded-lg bg-ocean-200/80">
                  <svg className="h-10 w-10 text-ocean-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
