'use client'

import { useState, type InputHTMLAttributes } from 'react'

/**
 * Password box with a show/hide control.
 *
 * Takes the same props as the plain input it replaces — including the caller's
 * own class string — so each form keeps its own styling and only gains the
 * toggle. Room for the button is reserved with `pr-11` rather than by the
 * caller, so no form can forget it and end up with the eye sitting on top of
 * the text.
 *
 * The field starts hidden every time: it is never left revealed across a
 * re-render, and the toggle is not submitted with the form.
 */
export function PasswordInput({
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        // The label says what pressing it does; aria-pressed carries the state.
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        // Not focusable by tab: it sits between the password box and the submit
        // button, and stopping there on the way to signing in is a nuisance.
        tabIndex={-1}
        className="absolute bottom-0 right-0 flex h-[calc(100%-0.375rem)] w-11 items-center justify-center rounded-r-xl text-ocean-800/60 transition hover:text-ocean-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
      >
        {visible ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.6 10.6a2 2 0 002.8 2.8M9.4 5.3A9.6 9.6 0 0112 5c4.6 0 8.4 3.1 9.5 7a11 11 0 01-2.7 4.3M6.2 6.7A11.3 11.3 0 002.5 12c1.1 3.9 4.9 7 9.5 7a9.7 9.7 0 003.6-.7"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12C3.6 8.1 7.4 5 12 5s8.4 3.1 9.5 7c-1.1 3.9-4.9 7-9.5 7s-8.4-3.1-9.5-7z" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </div>
  )
}
