import { type NextApiRequest, type NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { IS_MANAGEMENT_API_ENABLED, proxyManagementApi } from '@/lib/api/self-hosted/management-api'

export default function handleEndpoint(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  if (!IS_MANAGEMENT_API_ENABLED) {
    return res.status(405).json({ error: { message: 'MFA factors require the management API' } })
  }

  switch (method) {
    case 'GET':
    case 'POST':
      return proxyManagementApi(req, res, '/platform/profile/factors')
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
