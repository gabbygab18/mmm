'use client'

import { ReactNode, useId, useState } from 'react'

/**
 * Shared form controls for the MMM registration and contact flows.
 *
 * Everything here matches the approved design pack: Poppins Bold 10.7 labels,
 * Poppins 10.7 inputs, 1px ocean borders, 8px radius. Keeping them in one place
 * means the musician and facility wizards can't drift apart visually.
 */

export const inputClass =
  'w-full rounded-lg border border-ocean-300 bg-white px-4 py-2.5 font-poppins text-[12px] text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-400'

export const labelClass = 'mb-1.5 block font-poppins text-[10.7px] font-bold text-ocean-900'

export function Field({
  label,
  htmlFor,
  children,
  className = '',
  hint,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  hint?: string
}) {
  return (
    <div className={className}>
      <label className={labelClass} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 font-poppins text-[10px] text-ocean-900/60">{hint}</p>}
    </div>
  )
}

/** Text input wired to a label via a generated id. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  className = '',
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  className?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'url'
  maxLength?: number
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        className={inputClass}
      />
    </Field>
  )
}

/**
 * Dropdown replacement for the free-text fields Michael asked us to constrain.
 * Renders a native select so it stays usable on phones and screen readers.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  placeholder?: string
  className?: string
}) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} appearance-none pr-10 ${value ? '' : 'text-ocean-900/40'}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-ocean-900">
              {opt}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ocean-700"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </Field>
  )
}

/** Multi-choice pill group — used for preferred days and similar sets. */
export function PillGroup({
  label,
  options,
  selected,
  onToggle,
  className = '',
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
  className?: string
}) {
  return (
    <fieldset className={className}>
      <legend className={labelClass}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = selected.includes(opt)
          return (
            <label
              key={opt}
              className={`flex cursor-pointer select-none items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 font-poppins text-[10.7px] font-bold text-ocean-900 transition ${
                checked ? 'border-ocean-800 bg-ocean-100' : 'border-ocean-300 bg-white hover:border-ocean-500'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt)}
                className="h-3.5 w-3.5 rounded border-ocean-400 text-ocean-700 focus:ring-ocean-500"
              />
              {opt}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * Password input with a show/hide toggle (requested by the client, July 2026).
 * The eye button is a real button so it's reachable by keyboard and announces
 * its state; the field itself never loses its value when toggled.
 */
export function PasswordField({
  label = 'Password',
  value,
  onChange,
  placeholder = 'Enter your password',
  autoComplete = 'new-password',
  hint,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  hint?: string
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 flex h-9 w-10 -translate-y-1/2 items-center justify-center rounded-md text-ocean-700 transition hover:bg-ocean-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
        >
          {visible ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.6 10.6a2 2 0 002.8 2.8M9.9 5.2A9.6 9.6 0 0112 5c5 0 9 4.5 9 7a11 11 0 01-2.4 3.4M6.3 6.4A11.6 11.6 0 003 12c0 2.5 4 7 9 7 1.2 0 2.3-.2 3.3-.6"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7z" />
              <circle cx="12" cy="12" r="2.6" />
            </svg>
          )}
        </button>
      </div>
    </Field>
  )
}
