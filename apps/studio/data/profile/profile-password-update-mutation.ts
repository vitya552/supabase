import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ProfilePasswordUpdateVariables = {
  currentPassword: string
  newPassword: string
}

export async function updateProfilePassword({
  currentPassword,
  newPassword,
}: ProfilePasswordUpdateVariables) {
  const response = await fetch(`${API_URL}/platform/profile/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    handleError(body)
  }

  return body
}

type ProfilePasswordUpdateData = Awaited<ReturnType<typeof updateProfilePassword>>

/**
 * Self-hosted only: rotates the signed-in dashboard user's password via the
 * management API.
 */
export const useProfilePasswordUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    ProfilePasswordUpdateData,
    ResponseError,
    ProfilePasswordUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  return useMutation<ProfilePasswordUpdateData, ResponseError, ProfilePasswordUpdateVariables>({
    mutationFn: (vars) => updateProfilePassword(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update password${data.message ? ': ' + data.message : ''}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
