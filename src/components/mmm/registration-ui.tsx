'use client'

import { ReactNode } from 'react'

/**
 * Wizard chrome shared by the musician and facility registrations so both
 * flows stay pixel-identical: the music-staff step tracker, the circled step
 * heading, and the Back / Next buttons.
 */

export function StepTracker({ steps, current }: { steps: string[][]; current: number }) {
  return (
    <div className="relative mx-auto mt-10 max-w-[840px] overflow-hidden rounded-2xl bg-[#faf4e7]/90 px-3 py-5 shadow-lg sm:px-10 sm:py-6">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url('/mmm/notes-bg.png')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: '760px auto',
          backgroundPosition: 'left -30px center',
        }}
        aria-hidden="true"
      />
      <ol className="relative flex items-start justify-between">
        {steps.map((label, i) => {
          const stepNo = i + 1
          const done = stepNo < current
          const active = stepNo === current
          return (
            <li key={label.join(' ')} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <span
                  className="absolute top-[18px] -z-0 h-[2px] w-full -translate-y-1/2 bg-ocean-700/50 sm:top-7"
                  aria-hidden="true"
                  style={{ right: '50%', width: '100%' }}
                />
              )}
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 font-poppins text-[15px] font-bold sm:h-14 sm:w-14 sm:text-[20px] ${
                  active ? 'border-ocean-900 bg-ocean-900 text-white' : 'border-ocean-900 bg-[#faf4e7] text-ocean-900'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <svg className="h-4 w-4 text-ocean-900 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNo
                )}
              </span>
              <span className="mt-1.5 text-center font-poppins text-[9.5px] leading-tight text-ocean-900 sm:mt-2 sm:text-[13px]">
                {label.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function StepHeading({
  step,
  total = 5,
  title,
  subtitle,
  icon,
}: {
  step: number
  total?: number
  title: string
  subtitle: string
  icon: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-900 text-white sm:h-24 sm:w-24">
        {icon}
      </div>
      <div>
        <p className="font-poppins text-[13px] text-ocean-900">
          Step {step} of {total}
        </p>
        <h2 className="font-garamond text-[30px] font-bold leading-none text-ocean-900 sm:text-[50.8px]">{title}</h2>
        <p className="mt-1 font-poppins text-[13px] text-ocean-900 sm:text-[16.1px]">{subtitle}</p>
      </div>
    </div>
  )
}

/** Circular step icon rendered from the design pack's PNG exports. */
export function StepIcon({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="h-16 w-16 object-contain sm:h-24 sm:w-24" />
  )
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border-[1.5px] border-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
    >
      {label === 'Back' ? <>&larr; {label}</> : label}
    </button>
  )
}

export function NextButton({
  onClick,
  label = 'Next',
  disabled = false,
}: {
  onClick: () => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-ocean-800 px-7 py-2.5 font-poppins text-[11.1px] font-bold uppercase tracking-[0.14em] text-white shadow-[inset_0_-2px_5px_rgba(0,0,0,0.3),0_2px_6px_rgba(7,37,68,0.35)] transition hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label === 'Next' ? <>{label} &rarr;</> : label}
    </button>
  )
}
