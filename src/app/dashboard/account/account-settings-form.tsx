'use client'

import { FormEvent, useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { updateEmailNotificationsAction, deleteAccountAction } from './actions'

function passwordStrength(pw: string): { score: number; label: string } {
  if (pw.length === 0) return { score: 0, label: '' }
  if (pw.length < 8) return { score: 1, label: 'Too short' }
  let score = 1
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Too short', 'Weak', 'Fair', 'Strong']
  return { score, label: labels[score] }
}

const STRENGTH_COLORS = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-green-500']
const STRENGTH_TEXT = ['', 'text-red-600', 'text-amber-600', 'text-yellow-600', 'text-green-700']

function PasswordStrength({ password }: { password: string }) {
  const { score, label } = passwordStrength(password)
  if (!label) return null
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? STRENGTH_COLORS[score] : 'bg-stone-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${STRENGTH_TEXT[score]}`}>{label}</p>
    </div>
  )
}

export function AccountSettingsForm({
  userId,
  emailNotificationsEnabled,
}: {
  userId: string
  emailNotificationsEnabled: boolean
}) {
  // ── Password change ────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      setPasswordStatus('error')
      return
    }
    setPasswordLoading(true)
    setPasswordStatus('idle')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
      setPasswordStatus('error')
    } else {
      setPasswordStatus('success')
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  // ── Notification preference ────────────────────────────────────────────
  const [emailNotifs, setEmailNotifs] = useState(emailNotificationsEnabled)
  const [notifPending, startNotifTransition] = useTransition()
  const [notifStatus, setNotifStatus] = useState<'idle' | 'success' | 'error'>('idle')

  function handleNotifToggle(checked: boolean) {
    setEmailNotifs(checked)
    startNotifTransition(async () => {
      const result = await updateEmailNotificationsAction(userId, checked)
      setNotifStatus(result.ok ? 'success' : 'error')
      setTimeout(() => setNotifStatus('idle'), 2500)
    })
  }

  // ── Delete account ─────────────────────────────────────────────────────
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (deleteConfirmText.trim().toLowerCase() !== 'delete my account') return
    setDeleteLoading(true)
    setDeleteError('')
    const result = await deleteAccountAction(userId)
    if (!result.ok) {
      setDeleteError(result.error ?? 'Something went wrong. Please try again.')
      setDeleteLoading(false)
    }
    // On success, the server action redirects to /login?deleted=1
  }

  return (
    <div className="mt-8 space-y-10">

      {/* ── Change password ── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-bold text-stone-900">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-stone-700">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2"
            />
            <PasswordStrength password={newPassword} />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Confirm new password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2.5 text-stone-900 outline-none ring-brand-500 transition focus:ring-2"
            />
          </label>

          {passwordStatus === 'error' && (
            <p className="text-sm font-medium text-red-600">{passwordError}</p>
          )}
          {passwordStatus === 'success' && (
            <p className="text-sm font-medium text-green-700">Password updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {passwordLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* ── Email notifications ── */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-bold text-stone-900">Email Notifications</h2>
        <p className="mt-1 text-sm text-stone-500">
          Control whether Margaret&apos;s MemoryCare Music sends you email notifications for
          scheduling activity (requests, confirmations, cancellations, completions).
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-800">Scheduling email notifications</p>
            <p className="text-xs text-stone-500">
              {emailNotifs ? 'You will receive emails for scheduling events.' : 'Email notifications are off. You will still receive in-app alerts.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotifs}
            disabled={notifPending}
            onClick={() => handleNotifToggle(!emailNotifs)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 ${
              emailNotifs ? 'bg-brand-600' : 'bg-stone-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                emailNotifs ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {notifStatus === 'success' && (
          <p className="mt-3 text-xs font-medium text-green-700">Preference saved.</p>
        )}
        {notifStatus === 'error' && (
          <p className="mt-3 text-xs font-medium text-red-600">Failed to save preference. Please try again.</p>
        )}
      </section>

      {/* ── Danger zone: delete account ── */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-base font-bold text-red-900">Delete Account</h2>
        <p className="mt-1 text-sm text-red-700">
          Permanently removes your profile, availability, and personal information. Anonymized records
          of completed events are retained for platform integrity. This cannot be undone.
        </p>
        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <label className="block text-sm font-semibold text-red-800">
            Type <span className="font-mono font-bold">delete my account</span> to confirm
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
              className="mt-1.5 w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 text-stone-900 outline-none ring-red-400 transition focus:ring-2"
            />
          </label>

          {deleteError && (
            <p className="text-sm font-medium text-red-700">{deleteError}</p>
          )}

          <button
            type="submit"
            disabled={
              deleteLoading ||
              deleteConfirmText.trim().toLowerCase() !== 'delete my account'
            }
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleteLoading ? 'Deleting account…' : 'Delete my account'}
          </button>
        </form>
      </section>

    </div>
  )
}
