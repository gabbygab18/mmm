import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BroadcastForm } from './broadcast-form'

export const metadata = { title: "Send Announcement | Margaret's MemoryCare Music" }

const AUDIENCE_LABELS: Record<string, string> = {
  musician: 'Musicians',
  center_coordinator: 'Facilities',
}

function formatSentAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function BroadcastPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const supabase = await createSupabaseServerClient()
  const { data: past } = await supabase
    .from('broadcasts')
    .select('id, audiences, subject, recipient_count, sent_count, failed_count, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Send Announcement</h1>
        <p className="mt-1 font-poppins text-[12.5px] text-ocean-900/70">
          E-mail every registered musician, every registered facility, or both.
        </p>
      </div>

      <BroadcastForm />

      <div className="rounded-2xl border border-ocean-200/70 bg-white p-6 shadow-sm">
        <h2 className="font-garamond text-[20px] font-bold text-ocean-900">Recently sent</h2>

        {past && past.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {past.map((row) => (
              <li key={row.id} className="rounded-lg border border-ocean-200/70 bg-ocean-50/50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-poppins text-sm font-semibold text-ocean-900">{row.subject}</p>
                  <span className="font-poppins text-xs text-ocean-900/60">{formatSentAt(row.created_at)}</span>
                </div>
                <p className="mt-1 font-poppins text-xs text-ocean-900/70">
                  {(row.audiences ?? []).map((a: string) => AUDIENCE_LABELS[a] ?? a).join(' · ')}
                  {' — '}
                  {row.sent_count} of {row.recipient_count} delivered
                  {row.failed_count > 0 ? `, ${row.failed_count} failed` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-poppins text-sm text-ocean-900/60">No announcements sent yet.</p>
        )}
      </div>
    </section>
  )
}
