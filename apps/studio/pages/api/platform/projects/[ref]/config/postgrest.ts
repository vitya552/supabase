import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { DEFAULT_EXPOSED_SCHEMAS } from '@/lib/api/self-hosted/constants'
import {
  fetchManagementApi,
  IS_MANAGEMENT_API_ENABLED,
  proxyManagementApi,
} from '@/lib/api/self-hosted/management-api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  const fallback: components['schemas']['GetPostgrestConfigResponse'] = {
    db_anon_role: 'anon',
    db_extra_search_path: process.env.PGRST_DB_EXTRA_SEARCH_PATH ?? 'public',
    db_schema: DEFAULT_EXPOSED_SCHEMAS,
    jwt_secret:
      process.env.AUTH_JWT_SECRET ?? 'super-secret-jwt-token-with-at-least-32-characters-long',
    max_rows: Number(process.env.PGRST_DB_MAX_ROWS) || 1000,
    role_claim_key: '.role',
  }

  if (!IS_MANAGEMENT_API_ENABLED) return res.status(200).json(fallback)

  // The management API returns the live (runtime-updatable) subset; fill in
  // the static fields from the environment.
  const managed = await fetchManagementApi('/platform/projects/default/config/postgrest').catch(
    () => null
  )
  if (managed && typeof managed === 'object' && !Array.isArray(managed)) {
    return res.status(200).json({ ...fallback, ...managed })
  }
  return res.status(200).json(fallback)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!IS_MANAGEMENT_API_ENABLED) {
    return res
      .status(405)
      .json({ error: { message: 'Updating PostgREST config requires the management API' } })
  }
  return proxyManagementApi(req, res, '/platform/projects/default/config/postgrest')
}
