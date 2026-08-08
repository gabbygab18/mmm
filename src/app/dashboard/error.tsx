'use client'

import { useEffect } from 'react'

export default function DashboardError({
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
    <div className="flex min-h-screen items-center justify-center bg-ocean-50 px-4 font-poppins">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="font-garamond text-lg font-bold text-red-700">Dashboard error</h2>
        <p className="mt-2 text-sm text-ocean-900/70">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-lg bg-ocean-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ocean-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

