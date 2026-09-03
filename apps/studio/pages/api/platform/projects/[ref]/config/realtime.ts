import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  callManagementApi,
  IS_MANAGEMENT_API_ENABLED,
  proxyManagementApi,
} from '@/lib/api/self-hosted/management-api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

// Tenant limits of a stock self-hosted Realtime; also serves as the base the
// management API's (partial) tenant response is merged onto.
const FALLBACK_CONFIG = {
  private_only: false,
  connection_pool: 2,
  postgres_changes_pool: 2,
  max_concurrent_users: 200,
  max_events_per_second: 100,
  max_bytes_per_second: 100000,
  max_channels_per_client: 100,
  max_joins_per_second: 100,
  max_presence_events_per_second: 100,
  max_payload_size_in_kb: 100,
  suspend: false,
  presence_enabled: true,
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  switch (method) {
    case 'GET': {
      if (!IS_MANAGEMENT_API_ENABLED) return res.status(200).json(FALLBACK_CONFIG)
      const result = await callManagementApi(
        `/platform/projects/${encodeURIComponent(ref)}/config/realtime`,
        { method: 'GET', req }
      )
      if (result === null || result.status !== 200) {
        return res
          .status(result?.status ?? 500)
          .json(result?.body ?? { error: { message: 'Failed to fetch realtime config' } })
      }
      const config = typeof result.body === 'object' && result.body !== null ? result.body : {}
      return res.status(200).json({ ...FALLBACK_CONFIG, ...config })
    }
    case 'PATCH':
      if (!IS_MANAGEMENT_API_ENABLED) {
        return res.status(404).json({
          error: { message: 'Updating realtime settings requires the management API' },
        })
      }
      return proxyManagementApi(
        req,
        res,
        `/platform/projects/${encodeURIComponent(ref)}/config/realtime`
      )
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
