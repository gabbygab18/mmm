'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

interface DismissButtonProps {
  alertId: string
  onDismiss?: () => void
}

export function DismissAlertButton({ alertId, onDismiss }: DismissButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleDismiss() {
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId)
      window.dispatchEvent(new CustomEvent('alerts:dismissed', { detail: { alertId } }))
      // The unread badge count is fetched server-side in the dashboard
      // layout — a plain client write here never reaches it, so the red
      // dot stayed stale until a manual reload without this.
      router.refresh()
    } catch (e) {
      console.error('[DismissAlertButton] Error:', e)
    } finally {
      setIsLoading(false)
      if (onDismiss) {
        onDismiss()
      }
    }
  }

  return (
    <button
      onClick={handleDismiss}
      disabled={isLoading}
      className="rounded-md border border-ocean-800/50 px-3 py-1.5 font-poppins text-sm font-medium text-ocean-900 transition hover:bg-ocean-900/5 disabled:opacity-50"
    >
      {isLoading ? 'Dismissing...' : 'Dismiss'}
    </button>
  )
}

