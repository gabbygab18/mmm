import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-sm font-bold text-stone-900">Margaret&apos;s MemoryCare Music</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-6xl font-bold text-stone-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Page not found</h1>
        <p className="mt-3 text-stone-500">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
          >
            Back to home
          </Link>
        </div>
      </main>

      <div className="mx-auto max-w-3xl px-6">
        <SiteFooter theme="light" />
      </div>
    </div>
  )
}
