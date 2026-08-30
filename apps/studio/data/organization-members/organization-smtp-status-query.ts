import { useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type OrganizationSmtpStatusVariables = {
  slug?: string
}

export type OrganizationSmtpStatusResponse = {
  configured: boolean
}

export async function getOrganizationSmtpStatus(
  { slug }: OrganizationSmtpStatusVariables,
  signal?: AbortSignal
): Promise<OrganizationSmtpStatusResponse> {
  if (!slug) throw new Error('slug is required')

  const response = await fetch(
    `${API_URL}/platform/organizations/${slug}/members/invitations/smtp-status`,
    { signal }
  )
  const body = await response.json()

  if (!response.ok) {
    handleError(body)
  }

  return body
}

export type OrganizationSmtpStatusData = Awaited<ReturnType<typeof getOrganizationSmtpStatus>>
export type OrganizationSmtpStatusError = ResponseError

/**
 * Self-hosted only: whether the management API has SMTP configured, which
 * determines if team invitation emails can be delivered.
 */
export const useOrganizationSmtpStatusQuery = <TData = OrganizationSmtpStatusData>(
  { slug }: OrganizationSmtpStatusVariables,
  options: UseCustomQueryOptions<
    OrganizationSmtpStatusData,
    OrganizationSmtpStatusError,
    TData
  > = {}
) => {
  const { enabled = true, ...rest } = options

  return useQuery<OrganizationSmtpStatusData, OrganizationSmtpStatusError, TData>({
    queryKey: organizationKeys.smtpStatus(slug),
    queryFn: ({ signal }) => getOrganizationSmtpStatus({ slug }, signal),
    enabled: enabled && !IS_PLATFORM && typeof slug !== 'undefined',
    staleTime: 60 * 1000,
    ...rest,
  })
}
