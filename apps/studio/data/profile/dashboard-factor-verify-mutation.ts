import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'
import { profileKeys } from './keys'

export type DashboardFactorVerifyVariables = {
  factorId: number
  code: string
}

export async function verifyDashboardFactor({ factorId, code }: DashboardFactorVerifyVariables) {
  const response = await fetch(`${API_URL}/platform/profile/factors/${factorId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleError(body)
  }

  return body as { id: number; status: 'verified' }
}

type DashboardFactorVerifyData = Awaited<ReturnType<typeof verifyDashboardFactor>>

/** Self-hosted only: verifies a newly enrolled TOTP factor with a code. */
export const useDashboardFactorVerifyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    DashboardFactorVerifyData,
    ResponseError,
    DashboardFactorVerifyVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DashboardFactorVerifyData, ResponseError, DashboardFactorVerifyVariables>({
    mutationFn: (vars) => verifyDashboardFactor(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: profileKeys.dashboardFactors() })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to verify factor${data.message ? ': ' + data.message : ''}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
