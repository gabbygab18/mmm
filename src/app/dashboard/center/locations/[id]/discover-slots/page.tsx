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

export default async function CenterDiscoverSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ radiusBoost?: string }>
}) {
  const role = await getCurrentUserRole()
  if (role !== 'center_coordinator') redirect('/dashboard')

  await requireAuthenticatedUser()
  const supabase = await createSupabaseServerClient()
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const radiusBoost = clampRadiusBoost(Number(resolvedSearchParams.radiusBoost ?? '0'))

  const expansionResponse = await supabase.rpc('get_nearby_musician_slots_for_center_with_expansion', {
    target_location_id: id,
    result_limit: 100,
    days_ahead: 60,
    radius_boost_miles: radiusBoost,
  })
  const expansionRpcMissing =
    expansionResponse.error?.message?.includes(
      'Could not find the function public.get_nearby_musician_slots_for_center_with_expansion'
    ) ?? false

  const fallbackResponse = expansionRpcMissing
    ? await supabase.rpc('get_nearby_musician_availability_slots_for_center', {
        target_location_id: id,
        result_limit: 100,
        days_ahead: 60,
      })
    : null

  const slots = fallbackResponse?.data ?? expansionResponse.data
  const error = fallbackResponse ? fallbackResponse.error : expansionResponse.error
  const expansionTemporarilyUnavailable = expansionRpcMissing && !fallbackResponse?.error
  const showExpansionUnavailableNotice = expansionTemporarilyUnavailable && radiusBoost > 0

  const musicianIds = Array.from(new Set((slots ?? []).map((row: any) => row.musician_id).filter(Boolean)))
  const { data: musicianProfiles } = musicianIds.length
    ? await supabase.from('musicians').select('id, username').in('id', musicianIds)
    : { data: [] as { id: string; username: string }[] }
  const musicianUsernameById = new Map((musicianProfiles ?? []).map((row) => [row.id, row.username]))

  const calendarSlots =
    slots?.map((slot: any) => ({
      id: `${slot.musician_id}-${slot.available_date}-${slot.start_time}`,
      date: slot.available_date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      title: slot.musician_name,
      subtitle: `ZIP ${slot.musician_zip_code}`,
      distanceLabel: formatDistance(slot.distance_miles),
      profileHref: `/discover/musician/${musicianUsernameById.get(slot.musician_id) ?? slot.musician_id}`,
      requestHref: `/dashboard/requests/new?centerLocationId=${id}&musicianId=${slot.musician_id}`,
      requestLabel: 'Request musician',
    })) ?? []

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nearby Musician Availability Slots</h1>
          <p className="mt-1 text-sm text-stone-600">Posted musician availability within range of this location for the next 60 days.</p>
          <p className="mt-1 text-xs text-stone-500">Distance expansion: +{radiusBoost} mi</p>
          {slots && slots.length > 0 && <p className="mt-2 text-xs text-stone-500">Showing {slots.length} slot{slots.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 p-1">
            <Link
              href={`/dashboard/center/locations/${id}/discover-slots?radiusBoost=${Math.max(radiusBoost - 5, 0)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              -5 mi
            </Link>
            <Link
              href={`/dashboard/center/locations/${id}/discover-slots`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Reset
            </Link>
            <Link
              href={`/dashboard/center/locations/${id}/discover-slots?radiusBoost=${Math.min(radiusBoost + 5, 30)}`}
              className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              +5 mi
            </Link>
          </div>
          <Link
            href={`/dashboard/center/locations/${id}/discover`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            Back to discover
          </Link>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error.message}</p>}
      {showExpansionUnavailableNotice && (
        <p className="text-sm font-medium text-amber-700">
          Radius expansion is temporarily unavailable because the new RPC is not visible in Supabase API schema cache yet. Showing base-range slots only.
        </p>
      )}

      <DiscoverySlotCalendar
        heading="Slot Calendar"
        description="Pick any day to see nearby musician availability and send a prefilled request instantly."
        emptyMessage={`No nearby musician availability slots found for this date${radiusBoost > 0 ? ` (including +${radiusBoost} mi expansion)` : ''}.`}
        slots={calendarSlots}
      />
    </section>
  )
}
