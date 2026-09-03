import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { profileKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DashboardFactorDeleteVariables = {
  factorId: number
}

export async function deleteDashboardFactor({ factorId }: DashboardFactorDeleteVariables) {
  const response = await fetch(`${API_URL}/platform/profile/factors/${factorId}`, {
    method: 'DELETE',
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleError(body)
  }

  return body
}

type DashboardFactorDeleteData = Awaited<ReturnType<typeof deleteDashboardFactor>>

/** Self-hosted only: removes a TOTP factor from the dashboard user. */
export const useDashboardFactorDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DashboardFactorDeleteData,
    ResponseError,
    DashboardFactorDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DashboardFactorDeleteData, ResponseError, DashboardFactorDeleteVariables>({
    mutationFn: (vars) => deleteDashboardFactor(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: profileKeys.dashboardFactors() })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to remove factor${data.message ? ': ' + data.message : ''}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
