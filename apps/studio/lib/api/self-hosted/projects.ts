import { NextApiRequest } from 'next'
import z from 'zod'

import { callManagementApi, fetchManagementApi } from './management-api'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

export const managementProjectSchema = z.object({
  id: z.number(),
  ref: z.string(),
  name: z.string(),
  organization_id: z.number(),
  kind: z.enum(['default', 'compose', 'external']),
  status: z.string(),
  status_detail: z.string().nullable(),
  inserted_at: z.string(),
  cloud_provider: z.string(),
  region: z.string(),
  endpoint: z.string().nullable(),
  database: z
    .object({
      host: z.string(),
      port: z.number(),
      user: z.string(),
      name: z.string(),
    })
    .nullable(),
})

const connectionStringSchema = z.object({ connection_string: z.string() })

export type ManagementProject = z.infer<typeof managementProjectSchema>

/** All projects known to the management API, or null when it is disabled. */
export async function listManagedProjects(): Promise<ManagementProject[] | null> {
  const response = await fetchManagementApi('/platform/projects')
  if (response === null) return null
  const parsed = z.array(managementProjectSchema).safeParse(response)
  return parsed.success ? parsed.data : null
}

export async function getManagedProject(ref: string): Promise<ManagementProject | null> {
  const response = await fetchManagementApi(`/platform/projects/${encodeURIComponent(ref)}`)
  if (response === null) return null
  const parsed = managementProjectSchema.safeParse(response)
  return parsed.success ? parsed.data : null
}

/**
 * The project's raw database connection string. Server-side only — must never
 * be returned to the browser unencrypted.
 */
export async function getManagedProjectConnectionString(ref: string): Promise<string | null> {
  const response = await fetchManagementApi(
    `/platform/projects/${encodeURIComponent(ref)}/connection-string`
  )
  if (response === null) return null
  const parsed = connectionStringSchema.safeParse(response)
  return parsed.success ? parsed.data.connection_string : null
}

export async function createManagedProject(
  body: {
    name: string
    kind?: string
    organization_id?: number
    db_connection_string?: string
  },
  req?: NextApiRequest
): Promise<{ status: number; body: unknown } | null> {
  return callManagementApi('/platform/projects', { method: 'POST', body, req })
}

export async function deleteManagedProject(
  ref: string,
  req?: NextApiRequest
): Promise<{ status: number; body: unknown } | null> {
  return callManagementApi(`/platform/projects/${encodeURIComponent(ref)}`, {
    method: 'DELETE',
    req,
  })
}

/** Shape expected by the Studio project list (`GET /platform/projects`). */
export function toProjectListItem(project: ManagementProject) {
  if (project.ref === DEFAULT_PROJECT.ref) return DEFAULT_PROJECT
  return {
    id: project.id,
    ref: project.ref,
    name: project.name,
    organization_id: project.organization_id,
    cloud_provider: project.cloud_provider,
    status: project.status,
    region: project.region,
    inserted_at: project.inserted_at,
  }
}

/** Shape expected by the org projects list (`GET /platform/organizations/{slug}/projects`). */
export function toOrgProjectItem(project: ManagementProject, slug: string) {
  return {
    ...toProjectListItem(project),
    organization_slug: slug,
    databases: [
      {
        identifier: project.ref,
        region: 'local',
        cloud_provider: 'localhost',
        status: project.status,
        inserted_at: project.inserted_at,
        size: null,
      },
    ],
  }
}
