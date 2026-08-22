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

  async function deleteAlert(alertId: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('alerts').delete().eq('id', alertId)
    if (error) {
      console.error('[AlertsPage] Error deleting alert:', error)
      loadAlerts() // row wasn't actually removed — resync from the server
    }
  }

  async function clearDismissed() {
    const dismissedIds = alerts.filter((a) => a.dismissed).map((a) => a.id)
    if (dismissedIds.length === 0) return
    setAlerts((prev) => prev.filter((a) => !a.dismissed))
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('alerts').delete().in('id', dismissedIds)
    if (error) {
      console.error('[AlertsPage] Error clearing dismissed alerts:', error)
      loadAlerts()
    }
  }

  const unreadCount = alerts.filter((a) => !a.read && !a.dismissed).length
  const dismissedCount = alerts.filter((a) => a.dismissed).length

  const getAlertBadge = (alertType: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      request_initiated: { bg: 'bg-ocean-100', text: 'text-ocean-800', label: 'Request' },
      request_accepted: { bg: 'bg-ocean-100', text: 'text-ocean-800', label: 'Scheduled' },
      request_cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Cancelled' },
      proposal_suggested: { bg: 'bg-ocean-100', text: 'text-ocean-800', label: 'Proposal' },
      event_completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completed' },
      event_cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Cancelled' },
      account_approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved' },
      application_received: { bg: 'bg-ocean-100', text: 'text-ocean-800', label: 'Received' },
    }
    return badges[alertType] || { bg: 'bg-ocean-100', text: 'text-ocean-800', label: 'Alert' }
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
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Notifications</h1>
        </div>
        <p className="font-poppins text-[12.5px] text-ocean-900/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Notifications</h1>
          <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {dismissedCount > 0 && (
          <button
            type="button"
            onClick={clearDismissed}
            className="shrink-0 rounded-lg border border-ocean-300 px-3 py-1.5 font-poppins text-xs font-medium text-ocean-900 transition hover:bg-ocean-50"
          >
            Clear dismissed ({dismissedCount})
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-ocean-200/70 bg-white p-8 text-center">
          <p className="font-poppins text-[12.5px] text-ocean-900/60">No notifications yet. Check back soon!</p>
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
                    ? 'border-ocean-100 bg-ocean-50/50 opacity-60'
                    : alert.read
                      ? 'border-ocean-200/70 bg-white'
                      : 'border-ocean-300 bg-ocean-50'
                }`}
              >
                {/* Badge+content and actions stack as two full-width rows on
                    mobile — side by side, the fixed-width actions column left
                    the content so little room that the title wrapped under
                    the Dismiss button and Delete crowded right against it.
                    They sit back on one row, actions as a right-aligned
                    sidebar, once there's width to spare at sm. */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex flex-1 min-w-0 items-start gap-3">
                    {/* Badge */}
                    <div className={`flex-shrink-0 rounded-full px-3 py-1 font-poppins text-xs font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-poppins font-semibold text-ocean-900 break-words">{alert.title}</h3>
                      <p className="mt-1 font-poppins text-sm text-ocean-900/70 break-words">{alert.message}</p>
                      {/* Nullable in the schema — default, but no NOT NULL. */}
                      {alert.created_at && (
                        <p className="mt-2 font-poppins text-xs text-ocean-900/50">{formatDate(alert.created_at)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center justify-end gap-3 sm:flex-col sm:items-end sm:gap-2">
                    {!alert.dismissed && (
                      <DismissAlertButton alertId={alert.id} unread={!alert.read} onDismiss={() => dismissAlert(alert.id)} />
                    )}
                    {alert.dismissed && <span className="font-poppins text-xs text-ocean-900/50">Dismissed</span>}
                    <button
                      type="button"
                      onClick={() => deleteAlert(alert.id)}
                      className="font-poppins text-xs font-medium text-rose-700 transition hover:text-rose-900 hover:underline"
                    >
                      Delete
                    </button>
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
