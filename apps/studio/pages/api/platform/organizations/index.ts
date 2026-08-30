import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { fetchManagementApi, IS_MANAGEMENT_API_ENABLED } from '@/lib/api/self-hosted/management-api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const managedOrganizationsSchema = z.array(
  z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    opt_in_tags: z.array(z.string()).catch([]),
  })
)

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  if (IS_MANAGEMENT_API_ENABLED) {
    const raw = await fetchManagementApi('/platform/organizations', req)
    const parsed = managedOrganizationsSchema.safeParse(raw)
    if (parsed.success) {
      return res.status(200).json(
        parsed.data.map((org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          billing_email: 'billing@supabase.co',
          opt_in_tags: org.opt_in_tags,
          plan: { id: 'enterprise', name: 'Enterprise' },
          usage_billing_enabled: true,
        }))
      )
    }
  }

  // Platform specific endpoint
  const response = [
    {
      id: 1,
      name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
      slug: 'default-org-slug',
      billing_email: 'billing@supabase.co',
      plan: {
        id: 'enterprise',
        name: 'Enterprise',
      },
      usage_billing_enabled: true,
    },
  ]
  return res.status(200).json(response)
}
