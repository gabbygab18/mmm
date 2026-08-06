'use client'

import { FormEvent, useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { PasswordInput } from '@/components/mmm/password-input'
import { updateEmailNotificationsAction, deleteAccountAction, notifyPasswordChangedAction } from './actions'

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
  const [currentPassword, setCurrentPassword] = useState('')
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

    // Supabase's updateUser has no "current password" check of its own — an
    // already-open session could otherwise change the password without
    // knowing it. Re-authenticating first closes that gap.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) {
      setPasswordError('Your session has expired — please sign in again.')
      setPasswordStatus('error')
      setPasswordLoading(false)
      return
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (reauthError) {
      setPasswordError('Current password is incorrect.')
      setPasswordStatus('error')
      setPasswordLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
      setPasswordStatus('error')
    } else {
      setPasswordStatus('success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      notifyPasswordChangedAction().catch(() => {})
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
      return
    }

    // Drop the session here rather than letting the server redirect: the cookie
    // would still be valid and the middleware would bounce straight back to the
    // dashboard, which is exactly what "delete" appeared not to do.
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut().catch(() => {})
    window.location.href = '/login?deleted=1'
  }

  return (
    <div className="mt-8 space-y-10">

      {/* ── Change password ── */}
      <section className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6">
        <h2 className="font-garamond text-lg font-bold text-ocean-900">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
          <label className="block font-poppins text-[12.5px] font-semibold text-ocean-900/80">
            Current password
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-ocean-300 bg-white px-3.5 py-2.5 font-poppins text-ocean-900 outline-none ring-ocean-500 transition focus:ring-2"
            />
          </label>
          <label className="block font-poppins text-[12.5px] font-semibold text-ocean-900/80">
            New password
            <PasswordInput
                            value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-ocean-300 bg-white px-3.5 py-2.5 font-poppins text-ocean-900 outline-none ring-ocean-500 transition focus:ring-2"
            />
            <PasswordStrength password={newPassword} />
          </label>
          <label className="block font-poppins text-[12.5px] font-semibold text-ocean-900/80">
            Confirm new password
            <PasswordInput
                            value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-ocean-300 bg-white px-3.5 py-2.5 font-poppins text-ocean-900 outline-none ring-ocean-500 transition focus:ring-2"
            />
          </label>

          {passwordStatus === 'error' && (
            <p className="font-poppins text-[12.5px] font-medium text-red-600">{passwordError}</p>
          )}
          {passwordStatus === 'success' && (
            <p className="font-poppins text-[12.5px] font-medium text-green-700">Password updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="rounded-xl bg-ocean-800 px-5 py-2.5 font-poppins text-[12.5px] font-bold text-white transition hover:bg-ocean-700 disabled:opacity-60"
          >
            {passwordLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>

      {/* ── Email notifications ── */}
      <section className="rounded-2xl border border-ocean-200/70 bg-[#fdfaf3] p-6">
        <h2 className="font-garamond text-lg font-bold text-ocean-900">Email Notifications</h2>
        <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
          Control whether Margaret&apos;s MemoryCare Music sends you email notifications for
          scheduling activity (requests, confirmations, cancellations, completions).
        </p>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-poppins text-[12.5px] font-semibold text-ocean-900">Scheduling email notifications</p>
            <p className="font-poppins text-xs text-ocean-900/60">
              {emailNotifs ? 'You will receive emails for scheduling events.' : 'Email notifications are off. You will still receive in-app alerts.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotifs}
            disabled={notifPending}
            onClick={() => handleNotifToggle(!emailNotifs)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2 disabled:opacity-60 ${
              emailNotifs ? 'bg-ocean-800' : 'bg-ocean-200'
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
          <p className="mt-3 font-poppins text-xs font-medium text-green-700">Preference saved.</p>
        )}
        {notifStatus === 'error' && (
          <p className="mt-3 font-poppins text-xs font-medium text-red-600">Failed to save preference. Please try again.</p>
        )}
      </section>

      {/* ── Danger zone: delete account ── */}
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-garamond text-lg font-bold text-red-900">Delete Account</h2>
        <p className="mt-1 font-poppins text-[12.5px] text-red-700">
          Permanently removes your profile, availability, and personal information. Anonymized records
          of completed events are retained for platform integrity. This cannot be undone.
        </p>
        <form onSubmit={handleDelete} className="mt-5 space-y-4">
          <label className="block font-poppins text-[12.5px] font-semibold text-red-800">
            Type <span className="font-mono font-bold">delete my account</span> to confirm
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
              className="mt-1.5 w-full rounded-xl border border-red-300 bg-white px-3.5 py-2.5 font-poppins text-ocean-900 outline-none ring-red-400 transition focus:ring-2"
            />
          </label>

          {deleteError && (
            <p className="font-poppins text-[12.5px] font-medium text-red-700">{deleteError}</p>
          )}

          <button
            type="submit"
            disabled={
              deleteLoading ||
              deleteConfirmText.trim().toLowerCase() !== 'delete my account'
            }
            className="rounded-xl bg-red-600 px-5 py-2.5 font-poppins text-[12.5px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleteLoading ? 'Deleting account…' : 'Delete my account'}
          </button>
        </form>
      </section>

    </div>
  )
}
