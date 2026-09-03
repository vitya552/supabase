import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { IS_MANAGEMENT_API_ENABLED, proxyManagementApi } from '@/lib/api/self-hosted/management-api'

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  switch (method) {
    case 'GET':
      if (!IS_MANAGEMENT_API_ENABLED) {
        return res.status(404).json({
          error: { message: 'S3 protocol information requires the management API' },
        })
      }
      return proxyManagementApi(
        req,
        res,
        `/platform/storage/${encodeURIComponent(ref)}/s3-protocol`
      )
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
