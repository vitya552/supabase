import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { callManagementApi } from '@/lib/api/self-hosted/management-api'
import { getDashboardIdentity, SelfHostedDashboardIdentity } from '@/lib/api/self-hosted/team'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'PATCH':
      return handlePatch(req, res)
    default:
      res.setHeader('Allow', ['GET', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

function toProfileResponse(identity: SelfHostedDashboardIdentity | null) {
  const username = identity?.username ?? 'johndoe'
  return {
    id: 1,
    gotrue_id: username,
    // Cloud-only surfaces that have no self-hosted backend.
    disabled_features: [
      'organization:show_legal_documents',
      'organization:show_sso_settings',
      'organizations:delete',
      'billing:all',
    ],
    primary_email: identity ? username : 'johndoe@supabase.io',
    username,
    first_name: identity ? identity.first_name : 'John',
    last_name: identity ? identity.last_name : 'Doe',
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
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const identity = await getDashboardIdentity(req)
  return res.status(200).json(toProfileResponse(identity))
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { first_name, last_name } = req.body ?? {}
  const response = await callManagementApi('/platform/profile', {
    method: 'PATCH',
    body: {
      first_name: typeof first_name === 'string' ? first_name : '',
      last_name: typeof last_name === 'string' ? last_name : '',
    },
    req,
  })
  if (response === null) {
    return res.status(404).json({ error: { message: 'Management API is not configured' } })
  }
  if (response.status !== 200) {
    return res.status(response.status).json(response.body)
  }
  const identity = await getDashboardIdentity(req)
  return res.status(200).json(toProfileResponse(identity))
}
