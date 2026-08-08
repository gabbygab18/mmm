'use client'

import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUsersAction, updateUserRoleAction } from './actions'

type AppRole = 'musician' | 'center_coordinator' | 'admin'
const ROLE_OPTIONS: AppRole[] = ['musician', 'center_coordinator', 'admin']

export type AdminUserRow = {
  id: string
  email: string
  phone: string | null
  displayName: string
  role: string | null
  provider: string | null
  createdAt: string | null
  confirmedAt: string | null
  lastSignInAt: string | null
  bannedUntil: string | null
  isSsoUser: boolean
  raw: Record<string, unknown>
}

const ROLE_STYLES: Record<string, string> = {
  musician: 'bg-emerald-100 text-emerald-800',
  center_coordinator: 'bg-sky-100 text-sky-800',
  admin: 'bg-ocean-200 text-ocean-900',
}

const ROLE_LABELS: Record<string, string> = {
  musician: 'Musician',
  center_coordinator: 'Coordinator',
  admin: 'Admin',
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return <span className="text-ocean-900/40">—</span>
  const cls = ROLE_STYLES[role] ?? 'bg-ocean-100 text-ocean-900'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function fmt(dt: string | null) {
  if (!dt) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dt))
}

/* Minimal inline icons — avoids adding an icon dependency. */
const Icon = {
  user: (c = '') => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  ),
  trash: (c = '') => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  ),
  x: (c = '') => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  search: (c = '') => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
    </svg>
  ),
  chevron: (c = '') => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={c}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
}

/* Lightweight JSON syntax highlighter → HTML string. */
function highlightJson(value: unknown) {
  const json = JSON.stringify(value, null, 2)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return json.replace(
    /("(\\.|[^"\\])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-600'
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'text-sky-700' : 'text-emerald-700'
      else if (/true|false/.test(match)) cls = 'text-violet-700'
      else if (/null/.test(match)) cls = 'text-ocean-900/40'
      return `<span class="${cls}">${match}</span>`
    },
  )
}

function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ocean-100 py-2 last:border-0">
      <div className="text-xs text-ocean-900/60">{label}</div>
      <div className={`break-all text-sm text-ocean-900 ${mono ? 'font-mono text-[13px]' : ''}`}>{children}</div>
    </div>
  )
}

function RoleEditor({ user, canEdit }: { user: AdminUserRow; canEdit: boolean }) {
  const router = useRouter()
  const [nextRole, setNextRole] = useState<AppRole>((user.role as AppRole) ?? 'musician')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Reset when a different user opens.
  useEffect(() => {
    setNextRole((user.role as AppRole) ?? 'musician')
    setError(null)
    setSaved(false)
  }, [user.id, user.role])

  const changed = nextRole !== user.role

  const save = () => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, nextRole)
      if (!res.ok) {
        setError(res.error ?? 'Could not update role.')
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="mt-4 rounded-xl border border-ocean-200/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ocean-900/60">Role</p>
      {canEdit ? (
        <>
          <div className="mt-2 flex items-center gap-2">
            <select
              value={nextRole}
              onChange={(e) => {
                setNextRole(e.target.value as AppRole)
                setSaved(false)
              }}
              disabled={isPending}
              className="flex-1 rounded-lg border border-ocean-300 bg-white px-3 py-2 text-sm text-ocean-900 focus:border-ocean-700 focus:outline-none focus:ring-1 focus:ring-ocean-700 disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              onClick={save}
              disabled={!changed || isPending}
              className="rounded-lg bg-ocean-800 px-3 py-2 text-sm font-medium text-white hover:bg-ocean-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Update role'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          {saved && !changed && <p className="mt-2 text-xs text-emerald-600">Role updated.</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-ocean-900/60">
          You can’t change your own role here. Ask another admin.
        </p>
      )}
    </div>
  )
}

function Drawer({
  user,
  onClose,
  onRequestDelete,
  canDelete,
  canEditRole,
}: {
  user: AdminUserRow
  onClose: () => void
  onRequestDelete: (ids: string[]) => void
  canDelete: boolean
  canEditRole: boolean
}) {
  const [tab, setTab] = useState<'overview' | 'logs' | 'raw'>('overview')

  useEffect(() => setTab('overview'), [user.id])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const banned = Boolean(user.bannedUntil && new Date(user.bannedUntil) > new Date())

  // Derived timeline from the auth record. True GoTrue audit entries live in
  // auth.audit_log_entries and need elevated schema access to query.
  const logs = [
    user.lastSignInAt && { label: 'Last signed in', at: user.lastSignInAt, tag: 'login' },
    user.confirmedAt && { label: 'Email confirmed', at: user.confirmedAt, tag: 'user_confirmation' },
    user.createdAt && { label: 'Account created', at: user.createdAt, tag: 'user_signedup' },
  ].filter(Boolean) as { label: string; at: string; tag: string }[]

  return (
    <aside className="flex w-full max-w-[460px] shrink-0 flex-col border-l border-ocean-200/70 bg-white">
      <div className="flex items-center gap-1 border-b border-ocean-200/70 px-3">
        {(['overview', 'logs', 'raw'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative px-3 py-3 text-sm capitalize transition-colors ${
              tab === id ? 'text-ocean-900' : 'text-ocean-900/60 hover:text-ocean-900'
            }`}
          >
            {id === 'raw' ? 'Raw JSON' : id}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-ocean-800" />}
          </button>
        ))}
        <button
          onClick={onClose}
          className="ml-auto rounded p-1.5 text-ocean-900/40 hover:bg-ocean-100 hover:text-ocean-900"
          aria-label="Close panel"
        >
          {Icon.x('h-4 w-4')}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'overview' && (
          <div className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-100 text-ocean-900/60">
                {Icon.user('h-5 w-5')}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-ocean-900">
                  {user.displayName || <span className="text-ocean-900/40">No display name</span>}
                </div>
                <div className="truncate text-xs text-ocean-900/60">{user.email}</div>
              </div>
              {banned && (
                <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                  Banned
                </span>
              )}
            </div>

            <div className="rounded-xl border border-ocean-200/70 px-4">
              <Field label="User UID" mono>{user.id}</Field>
              <Field label="Display name">{user.displayName || '—'}</Field>
              <Field label="Email">{user.email}</Field>
              <Field label="Role"><RoleBadge role={user.role} /></Field>
              <Field label="Phone">{user.phone || '—'}</Field>
              <Field label="Provider">{user.provider || '—'}</Field>
              <Field label="Created at">{fmt(user.createdAt)}</Field>
              <Field label="Confirmed at">
                {user.confirmedAt ? fmt(user.confirmedAt) : <span className="text-amber-600">Waiting for verification</span>}
              </Field>
              <Field label="Last sign in">{fmt(user.lastSignInAt)}</Field>
            </div>

            <RoleEditor user={user} canEdit={canEditRole} />

            {canDelete && (
              <button
                onClick={() => onRequestDelete([user.id])}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
              >
                {Icon.trash('h-4 w-4')} Delete user
              </button>
            )}
          </div>
        )}

        {tab === 'logs' && (
          <div className="p-4">
            <ol className="relative border-l border-ocean-200/70 pl-5">
              {logs.map((log, i) => (
                <li key={i} className="mb-5 last:mb-0">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-ocean-700 ring-4 ring-white" />
                  <div className="text-sm text-ocean-900">{log.label}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ocean-900/60">
                    <code className="rounded bg-ocean-100 px-1.5 py-0.5 text-ocean-700">{log.tag}</code>
                    <span>{fmt(log.at)}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-ocean-900/40">
              Derived from the account record. Full sign-in history requires the GoTrue audit log.
            </p>
          </div>
        )}

        {tab === 'raw' && (
          <pre className="m-4 overflow-x-auto rounded-lg border border-ocean-200/70 bg-ocean-50 p-4 font-mono text-[13px] leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlightJson(user.raw) }} />
          </pre>
        )}
      </div>
    </aside>
  )
}

function ConfirmDelete({
  ids,
  busy,
  onCancel,
  onConfirm,
}: {
  ids: string[] | null
  busy: boolean
  onCancel: () => void
  onConfirm: (ids: string[]) => void
}) {
  if (!ids) return null
  const n = ids.length
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-ocean-200/70 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-poppins text-base font-semibold text-ocean-900">
          Delete {n} user{n > 1 ? 's' : ''}?
        </h2>
        <p className="mt-2 text-sm text-ocean-900/70">
          This permanently removes {n > 1 ? 'these accounts' : 'this account'} and all associated auth data. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-ocean-300 px-3 py-1.5 text-sm font-medium text-ocean-900 hover:bg-ocean-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(ids)}
            disabled={busy}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
          >
            {busy ? 'Deleting…' : `Delete ${n > 1 ? `${n} users` : 'user'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UsersManager({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q),
    )
  }, [users, query])

  const openUser = users.find((u) => u.id === openId) ?? null
  const allVisibleSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.id))

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => (filtered.every((u) => prev.has(u.id)) ? new Set() : new Set(filtered.map((u) => u.id))))
  }, [filtered])

  const runDelete = useCallback(
    (ids: string[]) => {
      setError(null)
      startTransition(async () => {
        const res = await deleteUsersAction(ids)
        if (!res.ok) {
          setError(res.error ?? res.failed.map((f) => f.error).join('; ') ?? 'Delete failed.')
          if (res.deleted.length === 0) return
        }
        setSelected((prev) => {
          const next = new Set(prev)
          res.deleted.forEach((id) => next.delete(id))
          return next
        })
        if (openId && res.deleted.includes(openId)) setOpenId(null)
        setPendingDelete(null)
        router.refresh()
      })
    },
    [openId, router],
  )

  const selectedCount = selected.size

  return (
    <section className="mx-auto flex h-[calc(100vh-8rem)] max-w-[1240px] flex-col overflow-hidden rounded-2xl border border-ocean-200/70 bg-white font-poppins shadow-sm">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-ocean-200/70 px-4">
        {selectedCount > 0 ? (
          <>
            <button
              onClick={() => setPendingDelete([...selected])}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
            >
              {Icon.trash('h-4 w-4')} Delete {selectedCount} user{selectedCount > 1 ? 's' : ''}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-ocean-300 p-1.5 text-ocean-900/60 hover:bg-ocean-50"
              aria-label="Clear selection"
            >
              {Icon.x('h-4 w-4')}
            </button>
          </>
        ) : (
          <>
            {/* No h1 here — the page above already has one; a second h1 in
                this toolbar was a duplicate heading. */}
            <div className="relative ml-auto">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ocean-900/40">
                {Icon.search('h-4 w-4')}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by email, name, or UID"
                className="w-72 rounded-lg border border-ocean-300 bg-white py-1.5 pl-8 pr-3 text-sm text-ocean-900 placeholder:text-ocean-900/40 focus:border-ocean-700 focus:outline-none focus:ring-1 focus:ring-ocean-700"
              />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-ocean-50">
              <tr className="border-b border-ocean-200/70 text-xs font-medium text-ocean-900/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer accent-ocean-800"
                    aria-label="Select all"
                  />
                </th>
                <th className="w-10 px-2 py-3" />
                <th className="px-4 py-3">UID</th>
                <th className="px-4 py-3">Display name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isOpen = u.id === openId
                return (
                  <tr
                    key={u.id}
                    onClick={() => setOpenId(u.id)}
                    className={`cursor-pointer border-b border-ocean-100 text-sm transition-colors ${
                      isOpen ? 'bg-ocean-50' : 'hover:bg-ocean-50'
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggleOne(u.id)}
                        className="h-4 w-4 cursor-pointer accent-ocean-800"
                        aria-label={`Select ${u.email}`}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ocean-100 text-ocean-900/60">
                        {Icon.user('h-3.5 w-3.5')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-ocean-900/70">{u.id}</td>
                    <td className="px-4 py-3 text-ocean-900">
                      {u.displayName || <span className="text-ocean-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-ocean-900">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-2 py-3 text-ocean-300">
                      {Icon.chevron(`h-4 w-4 ${isOpen ? 'text-ocean-900/60' : ''}`)}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-ocean-900/60">
                    No users match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {openUser && (
          <Drawer
            user={openUser}
            onClose={() => setOpenId(null)}
            onRequestDelete={(ids) => setPendingDelete(ids)}
            canDelete={openUser.id !== currentUserId}
            canEditRole={openUser.id !== currentUserId}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex h-9 shrink-0 items-center border-t border-ocean-200/70 px-4 text-xs text-ocean-900/60">
        Total: {users.length} user{users.length !== 1 ? 's' : ''}
        {selectedCount > 0 && <span className="ml-2 text-ocean-900/70">· {selectedCount} selected</span>}
      </div>

      <ConfirmDelete ids={pendingDelete} busy={isPending} onCancel={() => setPendingDelete(null)} onConfirm={runDelete} />
    </section>
  )
}
