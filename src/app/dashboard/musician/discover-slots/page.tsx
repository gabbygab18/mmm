import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DiscoverySlotCalendar } from '@/app/components/DiscoverySlotCalendar'
import { getCurrentUserRole, requireAuthenticatedUser } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function formatDistance(value: number | string | null) {
  if (value == null) return 'Distance unavailable'
  const distance = typeof value === 'string' ? Number(value) : value
  return `${distance.toFixed(1)} mi`
}

function clampRadiusBoost(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(Math.max(value, 0), 30)
}

export default async function MusicianDiscoverSlotsPage({ searchParams }: { searchParams: Promise<{ radiusBoost?: string }> }) {
  const role = await getCurrentUserRole()
  if (role !== 'musician') redirect('/dashboard')

  await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()
  const params = await searchParams
  const radiusBoost = clampRadiusBoost(Number(params.radiusBoost ?? '0'))

  const { data: musician } = await supabase
    .from('musicians')
    .select('travel_radius_miles, willing_to_travel')
    .maybeSingle()

  const baseRadius = musician?.willing_to_travel ? musician.travel_radius_miles ?? 0 : 0
  const effectiveRadius = baseRadius + radiusBoost

  const { data: slots, error } = await supabase.rpc('get_nearby_center_request_slots_for_musician_with_expansion', {
    result_limit: 100,
    days_ahead: 60,
    radius_boost_miles: radiusBoost,
  })

  const locationIds = Array.from(new Set((slots ?? []).map((row: any) => row.location_id).filter(Boolean)))
  const { data: locationProfiles } = locationIds.length
    ? await supabase.from('center_locations').select('id, username').in('id', locationIds)
    : { data: [] as { id: string; username: string }[] }
  const locationUsernameById = new Map((locationProfiles ?? []).map((row) => [row.id, row.username]))

  const calendarSlots =
    slots?.map((slot: any) => ({
      id: `${slot.location_id}-${slot.requested_date}-${slot.start_time}`,
      date: slot.requested_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      title: `${slot.center_name} · ${slot.location_name}`,
      subtitle: `ZIP ${slot.location_zip_code}`,
      distanceLabel: formatDistance(slot.distance_miles),
      profileHref: `/discover/location/${locationUsernameById.get(slot.location_id) ?? slot.location_id}`,
      requestHref: `/dashboard/requests/new?centerLocationId=${slot.location_id}`,
      requestLabel: 'Request center',
    })) ?? []

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nearby Posted Request Slots</h1>
          <p className="mt-1 text-sm text-stone-600">Open center request slots within your travel radius for the next 60 days.</p>
          <p className="mt-1 text-xs text-stone-500">Range: {baseRadius} mi base + {radiusBoost} mi expansion = {effectiveRadius} mi</p>
          {slots && slots.length > 0 && <p className="mt-2 text-xs text-stone-500">Showing {slots.length} slot{slots.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1">
            <Link
              href={`/dashboard/musician/discover-slots?radiusBoost=${Math.max(radiusBoost - 5, 0)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              -5 mi
            </Link>
            <Link
              href="/dashboard/musician/discover-slots"
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Reset
            </Link>
            <Link
              href={`/dashboard/musician/discover-slots?radiusBoost=${Math.min(radiusBoost + 5, 30)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              +5 mi
            </Link>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error.message}</p>}

      <DiscoverySlotCalendar
        heading="Slot Calendar"
        description="Pick any day to see posted center request slots and start a request in one click."
        emptyMessage="No posted request slots found for this date."
        slots={calendarSlots}
      />
    </section>
  )
}
