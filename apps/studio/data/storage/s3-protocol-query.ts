import { useQuery } from '@tanstack/react-query'

import { storageKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type S3ProtocolVariables = { projectRef?: string }

export type S3ProtocolResponse = {
  enabled: boolean
  access_key_id: string | null
  secret_access_key: string | null
}

export async function getS3Protocol(
  { projectRef }: S3ProtocolVariables,
  signal?: AbortSignal
): Promise<S3ProtocolResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetch(`${API_URL}/platform/storage/${projectRef}/s3-protocol`, { signal })
  const body = await response.json()

  if (!response.ok) {
    handleError(body)
  }

  return body
}

export type S3ProtocolData = Awaited<ReturnType<typeof getS3Protocol>>
export type S3ProtocolError = ResponseError

/**
 * Self-hosted only: the S3 protocol credentials configured on the project's
 * storage service (via environment for the default project, generated per
 * project for compose projects).
 */
export const useS3ProtocolQuery = <TData = S3ProtocolData>(
  { projectRef }: S3ProtocolVariables,
  options: UseCustomQueryOptions<S3ProtocolData, S3ProtocolError, TData> = {}
) => {
  const { enabled = true, ...rest } = options

  return useQuery<S3ProtocolData, S3ProtocolError, TData>({
    queryKey: storageKeys.s3Protocol(projectRef),
    queryFn: ({ signal }) => getS3Protocol({ projectRef }, signal),
    enabled: enabled && !IS_PLATFORM && typeof projectRef !== 'undefined',
    ...rest,
  })
}
