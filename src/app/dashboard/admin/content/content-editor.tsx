'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { ContentGroup } from '@/lib/mmm/site-content'
import { saveSiteContentAction } from './actions'

/**
 * Marketing-copy editor — one page at a time.
 *
 * Fields show the live text; the shipped wording is kept alongside so a field
 * can be put back without anyone having to remember what it said. Saving is
 * per page rather than per field so a set of related edits lands together.
 */
export function ContentEditor({
  groups,
  current,
}: {
  groups: ContentGroup[]
  /** Live value per key: the override if there is one, otherwise the default. */
  current: Record<string, string>
}) {
  const [activeId, setActiveId] = useState(groups[0]?.id ?? '')
  const [values, setValues] = useState<Record<string, string>>(current)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const group = groups.find((g) => g.id === activeId) ?? groups[0]
  if (!group) return null

  const fields = group.sections.flatMap((s) => s.fields)
  const dirty = fields.some((f) => (values[f.key] ?? '') !== (current[f.key] ?? ''))

  const save = () => {
    setStatus('idle')
    startTransition(async () => {
      const payload = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? '']))
      const result = await saveSiteContentAction(group.id, payload)
      if (result.ok) {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2500)
      } else {
        setError(result.error ?? 'Could not save.')
        setStatus('error')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Page picker */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveId(g.id)}
            className={`rounded-lg px-4 py-2 font-poppins text-[12.5px] font-medium transition ${
              g.id === group.id
                ? 'bg-ocean-800 text-white shadow'
                : 'border border-ocean-800/50 bg-white text-ocean-900 hover:bg-ocean-900/5'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-garamond text-lg font-bold text-ocean-900">{group.title}</h2>
          <Link
            href={group.href}
            target="_blank"
            className="font-poppins text-[12.5px] font-medium text-ocean-800 underline underline-offset-2 hover:text-ocean-600"
          >
            View page ↗
          </Link>
        </div>

        {group.sections.map((section) => (
          <section key={section.title} className="mt-7">
            <h3 className="font-poppins text-[11px] font-bold uppercase tracking-[0.08em] text-ocean-900/60">{section.title}</h3>
            <div className="mt-3 space-y-5">
              {section.fields.map((field) => {
                const value = values[field.key] ?? ''
                const changed = value.trim() !== field.default.trim()
                return (
                  <label key={field.key} className="block font-poppins text-[12.5px] font-semibold text-ocean-900/80">
                    <span className="flex flex-wrap items-center gap-2">
                      {field.label}
                      {changed && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          edited
                        </span>
                      )}
                    </span>

                    {field.multiline ? (
                      <textarea
                        value={value}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        rows={3}
                        disabled={pending}
                        className="mt-1.5 w-full resize-y rounded-xl border border-ocean-300 bg-white px-3.5 py-2.5 font-poppins font-normal text-ocean-900 outline-none ring-ocean-500 transition focus:ring-2 disabled:opacity-60"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        disabled={pending}
                        className="mt-1.5 w-full rounded-xl border border-ocean-300 bg-white px-3.5 py-2.5 font-poppins font-normal text-ocean-900 outline-none ring-ocean-500 transition focus:ring-2 disabled:opacity-60"
                      />
                    )}

                    {changed && (
                      <button
                        type="button"
                        onClick={() => setValues((v) => ({ ...v, [field.key]: field.default }))}
                        className="mt-1 font-poppins text-xs font-medium text-ocean-900/60 underline underline-offset-2 hover:text-ocean-900"
                      >
                        Reset to original wording
                      </button>
                    )}
                  </label>
                )
              })}
            </div>
          </section>
        ))}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-lg bg-ocean-800 px-5 py-2.5 font-poppins text-[12.5px] font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save changes'}
          </button>
          {status === 'saved' && <span className="font-poppins text-[12.5px] font-medium text-green-700">Saved — the page is updated.</span>}
          {status === 'error' && <span className="font-poppins text-[12.5px] font-medium text-rose-700">{error}</span>}
        </div>
      </div>
    </div>
  )
}
