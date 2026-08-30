import { NextApiRequest } from 'next'
import { z } from 'zod'

import { fetchManagementApi } from './management-api'

/**
 * Self-hosted dashboard roles, mapped onto the platform's org-scoped role
 * contract so the existing Team page components work unchanged.
 */
export const SELF_HOSTED_ORG_ROLES = [
  { id: 1, role: 'owner', name: 'Owner', description: 'Full access to the dashboard' },
  {
    id: 2,
    role: 'admin',
    name: 'Administrator',
    description: 'Can manage users, invitations and projects',
  },
  {
    id: 3,
    role: 'developer',
    name: 'Developer',
    description: 'Can use projects but not administer users',
  },
] as const

export type SelfHostedRole = (typeof SELF_HOSTED_ORG_ROLES)[number]['role']

export function roleIdFromRole(role: string): number | null {
  return SELF_HOSTED_ORG_ROLES.find((r) => r.role === role)?.id ?? null
}

export function roleFromRoleId(roleId: number): SelfHostedRole | null {
  return SELF_HOSTED_ORG_ROLES.find((r) => r.id === roleId)?.role ?? null
}

const dashboardRoleSchema = z.enum(['owner', 'admin', 'developer'])

const dashboardUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: dashboardRoleSchema,
  inserted_at: z.string(),
})

export type SelfHostedDashboardUser = z.infer<typeof dashboardUserSchema>

const dashboardInvitationSchema = z.object({
  id: z.number(),
  role: dashboardRoleSchema,
  invited_by: z.string(),
  invited_email: z.string(),
  expires_at: z.string(),
  inserted_at: z.string(),
})

export type SelfHostedDashboardInvitation = z.infer<typeof dashboardInvitationSchema>

export async function listDashboardUsers(
  req?: NextApiRequest
): Promise<SelfHostedDashboardUser[] | null> {
  const response = await fetchManagementApi('/platform/dashboard-users', req)
  if (response === null) return null
  const parsed = z.array(dashboardUserSchema).safeParse(response)
  return parsed.success ? parsed.data : null
}

export async function listDashboardInvitations(
  req?: NextApiRequest
): Promise<SelfHostedDashboardInvitation[] | null> {
  const response = await fetchManagementApi('/platform/dashboard-users/invitations', req)
  if (response === null) return null
  const parsed = z.array(dashboardInvitationSchema).safeParse(response)
  return parsed.success ? parsed.data : null
}

const dashboardIdentitySchema = z.object({
  username: z.string(),
  role: dashboardRoleSchema,
})

export type SelfHostedDashboardIdentity = z.infer<typeof dashboardIdentitySchema>

/** The identity behind the current dashboard session cookie. */
export async function getDashboardIdentity(
  req?: NextApiRequest
): Promise<SelfHostedDashboardIdentity | null> {
  const response = await fetchManagementApi('/platform/profile', req)
  if (response === null) return null
  const parsed = dashboardIdentitySchema.safeParse(response)
  return parsed.success ? parsed.data : null
}
