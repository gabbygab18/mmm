'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/types'

type Alert = Database['public']['Tables']['alerts']['Row']

type NotificationBellProps = {
  tone?: 'light' | 'dark'
  placement?: 'bottom-end' | 'right-start'
}

export function NotificationBell({ tone = 'light', placement = 'bottom-end' }: NotificationBellProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const channelIdRef = useRef(`alerts_changes_${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    loadAlerts()

    // Set up real-time subscription for alert changes
    const supabase = createSupabaseBrowserClient()
    const subscription = supabase
      .channel(channelIdRef.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const next = payload.new as Alert
            if (next.dismissed) return
            setAlerts((prev) => [next, ...prev.filter((row) => row.id !== next.id)].slice(0, 10))
            return
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const next = payload.new as Alert
            setAlerts((prev) => {
              const updated = prev.map((row) => (row.id === next.id ? next : row))
              return next.dismissed ? updated.filter((row) => row.id !== next.id) : updated
            })
            return
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            const removed = payload.old as Alert
            setAlerts((prev) => prev.filter((row) => row.id !== removed.id))
            return
          }
        }
      )
      .subscribe()

    function handleAlertDismissed(event: Event) {
      const customEvent = event as CustomEvent<{ alertId?: string }>
      const alertId = customEvent.detail?.alertId
      if (!alertId) return
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    }

    window.addEventListener('alerts:dismissed', handleAlertDismissed as EventListener)

    return () => {
      void subscription.unsubscribe()
      window.removeEventListener('alerts:dismissed', handleAlertDismissed as EventListener)
    }
  }, [])

  async function loadAlerts() {
    const supabase = createSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[NotificationBell] Error loading alerts:', error)
      setLoading(false)
      return
    }

    setAlerts(data ?? [])
    setLoading(false)
  }

  async function dismiss(alertId: string) {
    // Optimistic update: remove from list immediately
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    window.dispatchEvent(new CustomEvent('alerts:dismissed', { detail: { alertId } }))

    const supabase = createSupabaseBrowserClient()
    try {
      await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId)
    } catch (e) {
      console.error('[NotificationBell] Error dismissing alert:', e)
      // Reload to restore state if error
      loadAlerts()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = alerts.filter((a) => !a.read).length
  const triggerClassName =
    tone === 'dark'
      ? 'relative rounded-lg p-2 text-brand-200 transition hover:bg-white/10 hover:text-white'
      : 'relative rounded-lg p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900'
  const dropdownClassName =
    placement === 'right-start'
      ? 'absolute left-full top-0 ml-3 w-80 rounded-2xl border border-stone-200 bg-white shadow-lg'
      : 'absolute right-0 top-full mt-2 w-80 rounded-2xl border border-stone-200 bg-white shadow-lg'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClassName}
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={dropdownClassName}>
          {/* Header */}
          <div className="border-b border-stone-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">Notifications</h3>
          </div>

          {/* Alerts list */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-stone-500">Loading...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-stone-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {alerts.map((alert) => (
                  <Link
                    key={alert.id}
                    href="/dashboard/alerts"
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 transition ${
                      alert.read ? 'bg-white' : 'bg-brand-50'
                    } hover:bg-stone-50`}
                  >
                    {/* Title + dismiss button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-stone-900 break-words">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-sm text-stone-600 break-words">
                          {alert.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          dismiss(alert.id)
                        }}
                        className="mt-1 flex-shrink-0 text-xs text-stone-500 transition hover:text-stone-700"
                        aria-label="Dismiss notification"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-2">
                      <p className="text-xs text-stone-500">
                        {formatRelativeTime(new Date(alert.created_at))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer link */}
          <div className="border-t border-stone-200 px-4 py-3">
            <Link
              href="/dashboard/alerts"
              onClick={() => setIsOpen(false)}
              className="text-sm text-brand-700 transition hover:text-brand-800"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
