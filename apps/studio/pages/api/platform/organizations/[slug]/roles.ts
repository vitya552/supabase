import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { SELF_HOSTED_ORG_ROLES } from '@/lib/api/self-hosted/team'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    org_scoped_roles: SELF_HOSTED_ORG_ROLES.map((role) => ({
      id: role.id,
      base_role_id: role.id,
      name: role.name,
      description: role.description,
      projects: [],
    })),
    project_scoped_roles: [],
  })
}
