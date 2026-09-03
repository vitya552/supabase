import { useQuery } from '@tanstack/react-query'

import { profileKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DashboardFactor = {
  id: number
  friendly_name: string
  status: 'unverified' | 'verified'
  inserted_at: string
}

export async function getDashboardFactors(signal?: AbortSignal) {
  const response = await fetch(`${API_URL}/platform/profile/factors`, { signal })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleError(body)
  }

  return body as DashboardFactor[]
}

type DashboardFactorsData = Awaited<ReturnType<typeof getDashboardFactors>>

/**
 * Self-hosted only: TOTP factors of the signed-in dashboard user, stored in
 * the management API.
 */
export const useDashboardFactorsQuery = (
  options: Omit<
    UseCustomQueryOptions<DashboardFactorsData, ResponseError>,
    'queryKey' | 'queryFn'
  > = {}
) =>
  useQuery<DashboardFactorsData, ResponseError>({
    queryKey: profileKeys.dashboardFactors(),
    queryFn: ({ signal }) => getDashboardFactors(signal),
    enabled: !IS_PLATFORM && (options.enabled ?? true),
    ...options,
  })
