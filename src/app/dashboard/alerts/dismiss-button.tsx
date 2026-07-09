'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

interface DismissButtonProps {
  alertId: string
  onDismiss?: () => void
}

export function DismissAlertButton({ alertId, onDismiss }: DismissButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDismiss() {
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId)
      window.dispatchEvent(new CustomEvent('alerts:dismissed', { detail: { alertId } }))
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
      className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
    >
      {isLoading ? 'Dismissing...' : 'Dismiss'}
    </button>
  )
}

