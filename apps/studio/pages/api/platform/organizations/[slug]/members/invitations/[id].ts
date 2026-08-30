import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { proxyManagementApi } from '@/lib/api/self-hosted/management-api'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const id = typeof req.query.id === 'string' ? req.query.id : ''

  switch (method) {
    case 'DELETE':
      return proxyManagementApi(
        req,
        res,
        `/platform/dashboard-users/invitations/${encodeURIComponent(id)}`
      )
    default:
      res.setHeader('Allow', ['DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
