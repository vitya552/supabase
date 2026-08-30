import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import z from 'zod'

import { INFINITE_PROJECTS_KEY_PREFIX } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type SelfHostedProjectCreateVariables = {
  name: string
  kind: 'compose' | 'external'
  dbConnectionString?: string
}

const createdProjectSchema = z.object({
  ref: z.string(),
  name: z.string(),
  status: z.string(),
})

export type SelfHostedProjectCreateData = z.infer<typeof createdProjectSchema>

// Self-hosted-only endpoint: the platform-typed `post` from data/fetchers
// expects the cloud create-project body, which does not apply here.
export async function createSelfHostedProject({
  name,
  kind,
  dbConnectionString,
}: SelfHostedProjectCreateVariables): Promise<SelfHostedProjectCreateData> {
  const response = await fetch(`${API_URL}/platform/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name,
      kind,
      ...(dbConnectionString !== undefined && dbConnectionString.length > 0
        ? { db_connection_string: dbConnectionString }
        : {}),
    }),
  })
  const body = await response.json()
  if (!response.ok) {
    handleError(typeof body === 'object' && body !== null && 'error' in body ? body.error : body)
  }
  return createdProjectSchema.parse(body)
}

export const useSelfHostedProjectCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    SelfHostedProjectCreateData,
    ResponseError,
    SelfHostedProjectCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SelfHostedProjectCreateData, ResponseError, SelfHostedProjectCreateVariables>({
    mutationFn: (vars) => createSelfHostedProject(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: [INFINITE_PROJECTS_KEY_PREFIX] })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create project: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
