import { type NextApiRequest, type NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { proxyManagementApi } from '@/lib/api/self-hosted/management-api'

export default function handleEndpoint(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const tpaIdParam = req.query.tpaId
  const tpaId = Array.isArray(tpaIdParam) ? tpaIdParam[0] : tpaIdParam

  switch (method) {
    case 'GET':
    case 'DELETE':
      return proxyManagementApi(
        req,
        res,
        `/platform/projects/default/config/auth/third-party-auth/${encodeURIComponent(tpaId ?? '')}`
      )
    default:
      res.setHeader('Allow', ['GET', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
