'use client'

import { useState, useTransition } from 'react'
import type { SiteOptionRow } from '@/lib/mmm/site-options'
import {
  addOptionAction,
  deleteOptionAction,
  moveOptionAction,
  renameOptionAction,
  setOptionActiveAction,
} from './actions'

type Kind = { kind: string; label: string }

/**
 * Category manager — the lists the registration forms offer.
 *
 * Hiding is offered before deleting, and delete asks first: musicians and
 * facilities store these as labels, so removing one does not rewrite anyone's
 * saved profile, it only stops the entry being offered again.
 */
export function CategoriesManager({ kinds, rows }: { kinds: Kind[]; rows: SiteOptionRow[] }) {
  const [activeKind, setActiveKind] = useState(kinds[0]?.kind ?? '')
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const kind = kinds.find((k) => k.kind === activeKind) ?? kinds[0]
  const items = rows.filter((r) => r.kind === kind?.kind)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError('')
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) setError(result.error ?? 'Something went wrong.')
      else after?.()
    })
  }

  if (!kind) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.kind}
            type="button"
            onClick={() => {
              setActiveKind(k.kind)
              setEditingId(null)
              setError('')
            }}
            className={`rounded-lg px-4 py-2 font-poppins text-[12.5px] font-medium transition ${
              k.kind === kind.kind
                ? 'bg-ocean-800 text-white shadow'
                : 'border border-ocean-800/50 bg-white text-ocean-900 hover:bg-ocean-900/5'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6 shadow-sm">
        <h2 className="font-garamond text-lg font-bold text-ocean-900">{kind.label}</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                e.preventDefault()
                run(() => addOptionAction(kind.kind, draft), () => setDraft(''))
              }
            }}
            placeholder={`Add to ${kind.label.toLowerCase()}…`}
            disabled={pending}
            className="min-w-0 flex-1 rounded-lg border border-ocean-300 bg-white px-3 py-2 font-poppins text-[12.5px] text-ocean-900 outline-none ring-ocean-500 transition focus:ring-1 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => run(() => addOptionAction(kind.kind, draft), () => setDraft(''))}
            disabled={pending || !draft.trim()}
            className="rounded-lg bg-ocean-800 px-4 py-2 font-poppins text-[12.5px] font-semibold text-white transition hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {error && <p className="mt-3 font-poppins text-[12.5px] font-medium text-rose-700">{error}</p>}

        {items.length === 0 ? (
          <p className="mt-6 font-poppins text-[12.5px] text-ocean-900/60">
            Nothing stored yet — the forms are showing the built-in list. Adding one here takes over from it.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-ocean-200/70">
            {items.map((item, i) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={pending || i === 0}
                    onClick={() => run(() => moveOptionAction(item.id, 'up'))}
                    className="px-1 text-xs text-ocean-900/50 transition hover:text-ocean-900 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={pending || i === items.length - 1}
                    onClick={() => run(() => moveOptionAction(item.id, 'down'))}
                    className="px-1 text-xs text-ocean-900/50 transition hover:text-ocean-900 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {editingId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      autoFocus
                      disabled={pending}
                      className="min-w-0 flex-1 rounded-lg border border-ocean-300 bg-white px-3 py-1.5 font-poppins text-[12.5px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        run(() => renameOptionAction(item.id, editingLabel), () => setEditingId(null))
                      }
                      disabled={pending || !editingLabel.trim()}
                      className="rounded-lg bg-ocean-800 px-3 py-1.5 font-poppins text-[12.5px] font-medium text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-ocean-800/50 px-3 py-1.5 font-poppins text-[12.5px] font-medium text-ocean-900"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`min-w-0 flex-1 font-poppins text-[12.5px] ${
                        item.active ? 'text-ocean-900' : 'text-ocean-900/40 line-through'
                      }`}
                    >
                      {item.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id)
                        setEditingLabel(item.label)
                      }}
                      disabled={pending}
                      className="rounded-lg border border-ocean-800/50 px-3 py-1.5 font-poppins text-[12.5px] font-medium text-ocean-900 transition hover:bg-ocean-900/5 disabled:opacity-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => setOptionActiveAction(item.id, !item.active))}
                      disabled={pending}
                      className="rounded-lg border border-ocean-800/50 px-3 py-1.5 font-poppins text-[12.5px] font-medium text-ocean-900 transition hover:bg-ocean-900/5 disabled:opacity-50"
                    >
                      {item.active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete “${item.label}”? Profiles that already list it keep it — it just stops being offered. Hiding it does the same and can be undone.`,
                          )
                        ) {
                          run(() => deleteOptionAction(item.id))
                        }
                      }}
                      disabled={pending}
                      className="rounded-lg border border-rose-600/60 px-3 py-1.5 font-poppins text-[12.5px] font-medium text-rose-700 transition hover:bg-rose-600/5 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
