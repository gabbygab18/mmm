'use client'

import Link from 'next/link'
import { EmptyState } from '@/components/mmm/dashboard-ui'
import { SubmitButton } from '@/components/mmm/submit-button'

/**
 * Account list shared by the Musicians and Facilities screens.
 *
 * Both show the same thing — who signed up, whether their profile is finished,
 * whether they are approved — so they share one table rather than two that
 * drift apart. The approve/disable control is a plain form posting to a server
 * action, so it works before JavaScript loads.
 */

export type AdminAccountRow = {
  id: string
  userId: string
  name: string
  /** Second line under the name: ZIP for musicians, resident count for facilities. */
  detail: string
  profileComplete: boolean
  approved: boolean
  /** Facilities only — a second gate past `approved`, set once admin has
      verified the facility directly. Undefined on the musicians screen. */
  confirmed?: boolean
  deletedAt: string | null
  createdAt: string
  /** Public profile, when there is one to link to. */
  href?: string
}

function formatJoined(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  )
}

export function AdminAccountTable({
  rows,
  action,
  removeAction,
  confirmAction,
  emptyMessage,
}: {
  rows: AdminAccountRow[]
  action: (formData: FormData) => Promise<void>
  removeAction: (formData: FormData) => Promise<void>
  /** Facilities only — omit on the musicians screen. */
  confirmAction?: (formData: FormData) => Promise<void>
  emptyMessage: string
}) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ocean-200/70 bg-white px-4 py-3.5 shadow-sm"
        >
          <div className="min-w-0">
            <p className="font-poppins text-[14px] font-semibold text-ocean-900">
              {row.href ? (
                <Link href={row.href} className="underline-offset-2 hover:underline">
                  {row.name}
                </Link>
              ) : (
                row.name
              )}
            </p>
            <p className="font-poppins text-[11.5px] text-ocean-900/70">
              {row.detail} · joined {formatJoined(row.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {row.deletedAt && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-poppins text-[10.5px] font-medium text-rose-800">
                Deleted
              </span>
            )}
            {!row.profileComplete && (
              <span className="rounded-full bg-ocean-100 px-2.5 py-0.5 font-poppins text-[10.5px] font-medium text-ocean-900">
                Profile unfinished
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 font-poppins text-[10.5px] font-medium ${
                row.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {row.approved ? 'Approved' : 'Awaiting review'}
            </span>

            {confirmAction && row.approved && (
              <span
                className={`rounded-full px-2.5 py-0.5 font-poppins text-[10.5px] font-medium ${
                  row.confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {row.confirmed ? 'Confirmed' : 'Not yet confirmed'}
              </span>
            )}

            {confirmAction && row.approved && !row.deletedAt && (
              <form action={confirmAction}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="confirmed" value={String(row.confirmed ?? false)} />
                <SubmitButton
                  pendingLabel="Working…"
                  className="flex items-center gap-1.5 rounded-lg border border-ocean-800/60 px-3.5 py-1.5 font-poppins text-[11px] font-bold uppercase tracking-[0.1em] text-ocean-900 transition hover:bg-ocean-900/5"
                >
                  {row.confirmed ? 'Unconfirm' : 'Confirm'}
                </SubmitButton>
              </form>
            )}

            {!row.deletedAt && !row.approved && !row.profileComplete && (
              <span
                title="Profile isn't finished yet — nothing to review"
                className="rounded-lg border border-ocean-200/70 px-3.5 py-1.5 font-poppins text-[11px] font-bold uppercase tracking-[0.1em] text-ocean-900/30"
              >
                Approve
              </span>
            )}

            {!row.deletedAt && (row.approved || row.profileComplete) && (
              <form action={action}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="approved" value={String(row.approved)} />
                <SubmitButton
                  pendingLabel="Working…"
                  className="flex items-center gap-1.5 rounded-lg border border-ocean-800/60 px-3.5 py-1.5 font-poppins text-[11px] font-bold uppercase tracking-[0.1em] text-ocean-900 transition hover:bg-ocean-900/5"
                >
                  {row.approved ? 'Disable' : 'Approve'}
                </SubmitButton>
              </form>
            )}

            {!row.deletedAt && (
              <form
                action={removeAction}
                onSubmit={(e) => {
                  if (!window.confirm(`Remove ${row.name}'s account? This cancels their requests and permanently disables sign-in.`)) {
                    e.preventDefault()
                  }
                }}
              >
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="userId" value={row.userId} />
                <SubmitButton
                  pendingLabel="Removing…"
                  className="flex items-center gap-1.5 rounded-lg border border-rose-600/60 px-3.5 py-1.5 font-poppins text-[11px] font-bold uppercase tracking-[0.1em] text-rose-700 transition hover:bg-rose-600/5"
                >
                  Remove
                </SubmitButton>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
