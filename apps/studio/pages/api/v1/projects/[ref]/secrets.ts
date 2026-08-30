import { type NextApiRequest, type NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { proxyManagementApi } from '@/lib/api/self-hosted/management-api'

export default function handleEndpoint(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

function refPath(req: NextApiRequest): string {
  const refParam = req.query.ref
  const ref = (Array.isArray(refParam) ? refParam[0] : refParam) ?? 'default'
  return encodeURIComponent(ref)
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
    case 'POST':
    case 'DELETE':
      return proxyManagementApi(req, res, `/platform/projects/${refPath(req)}/secrets`)
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
