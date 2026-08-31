import { components } from 'api-types'
import { NextApiRequest } from 'next'
import z from 'zod'

import { POSTGRES_PORT } from './constants'
import { fetchManagementApi } from './management-api'
import { getManagedProject } from './projects'
import { assertSelfHosted } from './util'
import { PROJECT_DB_HOST, PROJECT_ENDPOINT, PROJECT_ENDPOINT_PROTOCOL } from '@/lib/constants/api'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}

export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

/**
 * Per-project settings for projects managed by the management API.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function getManagedProjectSettings(
  ref: string,
  req?: NextApiRequest
): Promise<ProjectSettings | null> {
  assertSelfHosted()

  const project = await getManagedProject(ref, req)
  if (project === null) return null

  const apiKeysResponse = await fetchManagementApi(
    `/platform/projects/${encodeURIComponent(ref)}/api-keys`,
    req
  )
  const apiKeys = z
    .array(z.object({ api_key: z.string(), name: z.string(), tags: z.string() }))
    .safeParse(apiKeysResponse)

  const endpoint = project.endpoint !== null ? project.endpoint.replace(/^https?:\/\//, '') : ''
  const protocol = project.endpoint?.startsWith('https') ? 'https' : 'http'

  return {
    app_config: {
      db_schema: 'public',
      endpoint,
      storage_endpoint: endpoint,
      protocol,
    },
    cloud_provider: 'localhost',
    db_dns_name: '-',
    db_host: project.database?.host ?? '',
    db_ip_addr_config: 'legacy' as const,
    db_name: project.database?.name ?? 'postgres',
    db_port: project.database?.port ?? POSTGRES_PORT,
    db_user: project.database?.user ?? 'postgres',
    inserted_at: project.inserted_at,
    name: project.name,
    ref: project.ref,
    region: 'local',
    service_api_keys: apiKeys.success ? apiKeys.data : [],
    ssl_enforced: false,
    status: project.status,
  } satisfies ProjectSettings
}

/**
 * Gets self-hosted project settings
 *
 * _Only call this from server-side self-hosted code._
 */
export function getProjectSettings() {
  assertSelfHosted()

  const response = {
    app_config: {
      db_schema: 'public',
      endpoint: PROJECT_ENDPOINT,
      storage_endpoint: PROJECT_ENDPOINT,
      // manually added to force the frontend to use the correct URL
      protocol: PROJECT_ENDPOINT_PROTOCOL,
    },
    cloud_provider: 'AWS',
    db_dns_name: '-',
    db_host: PROJECT_DB_HOST,
    db_ip_addr_config: 'legacy' as const,
    db_name: 'postgres',
    db_port: POSTGRES_PORT,
    db_user: 'postgres',
    inserted_at: '2021-08-02T06:40:40.646Z',
    name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
    ref: 'default',
    // Must match the storage service's REGION so SigV4-signed requests
    // (e.g. the S3 Vectors foreign data wrapper) validate against it.
    region: process.env.STORAGE_REGION || 'local',
    service_api_keys: [
      {
        api_key: process.env.SUPABASE_ANON_KEY ?? '',
        name: 'anon key',
        tags: 'anon',
      },
      {
        api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
        name: 'service_role key',
        tags: 'service_role',
      },
    ],
    ssl_enforced: false,
    status: 'ACTIVE_HEALTHY',
  } satisfies ProjectSettings

  return response
}
