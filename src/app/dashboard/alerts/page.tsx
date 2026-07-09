'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { DismissAlertButton } from './dismiss-button'
import type { Database } from '@/lib/supabase/types'

type Alert = Database['public']['Tables']['alerts']['Row']

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()

    // Set up real-time subscription
    const supabase = createSupabaseBrowserClient()
    const subscription = supabase
      .channel('alerts_changes_page')
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
            setAlerts((prev) => [next, ...prev.filter((row) => row.id !== next.id)])
            return
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const next = payload.new as Alert
            setAlerts((prev) => prev.map((row) => (row.id === next.id ? next : row)))
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
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)))
    }

    window.addEventListener('alerts:dismissed', handleAlertDismissed as EventListener)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('alerts:dismissed', handleAlertDismissed as EventListener)
    }
  }, [])

  async function loadAlerts() {
    const supabase = createSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AlertsPage] Error loading alerts:', error)
      setLoading(false)
      return
    }

    setAlerts(data ?? [])
    setLoading(false)
  }

  function dismissAlert(alertId: string) {
    // Optimistic update: keep row visible but mark dismissed
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)))
  }

  const unreadCount = alerts.filter((a) => !a.read && !a.dismissed).length

  const getAlertBadge = (alertType: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      request_initiated: { bg: 'bg-brand-100', text: 'text-brand-800', label: 'Request' },
      request_accepted: { bg: 'bg-brand-100', text: 'text-brand-800', label: 'Scheduled' },
      request_cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Cancelled' },
      proposal_suggested: { bg: 'bg-brand-100', text: 'text-brand-800', label: 'Proposal' },
      event_completed: { bg: 'bg-brand-100', text: 'text-brand-800', label: 'Completed' },
      event_cancelled: { bg: 'bg-stone-100', text: 'text-stone-700', label: 'Cancelled' },
    }
    return badges[alertType] || { bg: 'bg-stone-100', text: 'text-stone-700', label: 'Alert' }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        </div>
        <p className="text-sm text-stone-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-stone-500">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-500">No notifications yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const badge = getAlertBadge(alert.alert_type)
            return (
              <div
                key={alert.id}
                className={`rounded-2xl border px-5 py-4 transition ${
                  alert.dismissed
                    ? 'border-stone-100 bg-stone-50 opacity-60'
                    : alert.read
                      ? 'border-stone-200 bg-white'
                      : 'border-brand-200 bg-brand-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge */}
                  <div className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-900">{alert.title}</h3>
                    <p className="mt-1 text-sm text-stone-600">{alert.message}</p>
                    <p className="mt-2 text-xs text-stone-400">{formatDate(alert.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    {!alert.dismissed && (
                      <DismissAlertButton alertId={alert.id} onDismiss={() => dismissAlert(alert.id)} />
                    )}
                    {alert.dismissed && (
                      <span className="text-xs text-stone-400">Dismissed</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
