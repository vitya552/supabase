import { type NextApiRequest, type NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { proxyManagementApiRaw } from '@/lib/api/self-hosted/management-api'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handleEndpoint(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST': {
      const slugParam = req.query.slug
      const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
      return proxyManagementApiRaw(
        req,
        res,
        `/platform/projects/default/functions/deploy?slug=${encodeURIComponent(slug ?? '')}`
      )
    }
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}
