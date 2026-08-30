import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getDashboardIdentity } from '@/lib/api/self-hosted/team'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const identity = await getDashboardIdentity(req)
  const username = identity?.username ?? 'johndoe'
  const response = {
    id: 1,
    gotrue_id: username,
    // Cloud-only surfaces that have no self-hosted backend.
    disabled_features: [
      'organization:show_legal_documents',
      'organization:show_sso_settings',
      'organization:show_security_settings',
      'organizations:delete',
      'billing:all',
    ],
    primary_email: identity ? username : 'johndoe@supabase.io',
    username,
    first_name: identity ? username : 'John',
    last_name: identity ? '' : 'Doe',
    organizations: [
      {
        id: 1,
        name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
        slug: 'default-org-slug',
        billing_email: 'billing@supabase.co',
        projects: [{ ...DEFAULT_PROJECT, connectionString: '' }],
      },
    ],
  }
  return res.status(200).json(response)
}
