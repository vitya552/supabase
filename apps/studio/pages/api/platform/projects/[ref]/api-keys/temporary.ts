import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { fetchManagementApi, IS_MANAGEMENT_API_ENABLED } from '@/lib/api/self-hosted/management-api'

const wrapper = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrapper

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'POST':
      return handlePost(req, res)
    default:
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const apiKeysSchema = z.array(z.object({ api_key: z.string(), tags: z.string() }))

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  if (IS_MANAGEMENT_API_ENABLED) {
    const response = await fetchManagementApi(
      `/platform/projects/${encodeURIComponent(ref)}/api-keys`,
      req
    )
    const apiKeys = apiKeysSchema.safeParse(response)
    const serviceKey = apiKeys.success
      ? apiKeys.data.find((key) => key.tags === 'service_role')?.api_key
      : undefined
    if (serviceKey) {
      return res.status(200).json({ api_key: serviceKey })
    }
  }

  return res.status(200).json({ api_key: process.env.SUPABASE_SERVICE_KEY ?? '' })
}
