'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm max-w-md">
        <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
        <p className="mt-2 text-sm text-stone-600">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

