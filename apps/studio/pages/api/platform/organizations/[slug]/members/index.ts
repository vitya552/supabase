import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { listDashboardUsers, roleIdFromRole } from '@/lib/api/self-hosted/team'

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

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const users = await listDashboardUsers(req)
  if (users === null) return res.status(200).json([])

  return res.status(200).json(
    users.map((user) => ({
      gotrue_id: user.username,
      username: user.username,
      primary_email: user.username,
      avatar_url: null,
      is_sso_user: false,
      metadata: {},
      mfa_enabled: false,
      role_ids: [roleIdFromRole(user.role) ?? 3],
    }))
  )
}
