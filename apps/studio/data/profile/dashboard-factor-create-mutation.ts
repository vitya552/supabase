import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { profileKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DashboardFactorCreateVariables = {
  friendlyName: string
}

export type DashboardFactorCreateResponse = {
  id: number
  friendly_name: string
  status: 'unverified'
  totp: { secret: string; uri: string }
}

export async function createDashboardFactor({ friendlyName }: DashboardFactorCreateVariables) {
  const response = await fetch(`${API_URL}/platform/profile/factors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendly_name: friendlyName }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleError(body)
  }

  return body as DashboardFactorCreateResponse
}

type DashboardFactorCreateData = Awaited<ReturnType<typeof createDashboardFactor>>

/** Self-hosted only: enrolls a new TOTP factor for the dashboard user. */
export const useDashboardFactorCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DashboardFactorCreateData,
    ResponseError,
    DashboardFactorCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DashboardFactorCreateData, ResponseError, DashboardFactorCreateVariables>({
    mutationFn: (vars) => createDashboardFactor(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: profileKeys.dashboardFactors() })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to add factor${data.message ? ': ' + data.message : ''}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
