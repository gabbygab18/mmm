'use client'

import { useFormStatus } from 'react-dom'

/** Spinner shown on a submit button while its form's server action is in flight. */
export function Spinner({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

/** Submit button that shows a spinner + disables itself while its enclosing
    form's server action is pending — useFormStatus reads that from context,
    so no local pending state needs wiring per call site. */
export function SubmitButton({
  pendingLabel,
  className,
  children,
}: {
  pendingLabel: string
  className: string
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}>
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </button>
  )
}
