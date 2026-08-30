import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { callManagementApi } from '@/lib/api/self-hosted/management-api'
import { roleFromRoleId } from '@/lib/api/self-hosted/team'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'PUT':
      return handleSetRole(req, res)
    case 'DELETE':
      // Dashboard users always hold exactly one role; removal happens by
      // assigning a different role, so an unassign is a no-op here.
      return res.status(200).json({})
    default:
      res.setHeader('Allow', ['PUT', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleSetRole = async (req: NextApiRequest, res: NextApiResponse) => {
  const username = typeof req.query.gotrue_id === 'string' ? req.query.gotrue_id : ''
  const role = roleFromRoleId(Number(req.query.role_id))
  if (role === null) {
    return res.status(400).json({ message: 'Invalid role' })
  }
  const response = await callManagementApi(
    `/platform/dashboard-users/${encodeURIComponent(username)}`,
    { method: 'PATCH', body: { role }, req }
  )
  if (response === null) {
    return res.status(500).json({ message: 'Management API is not available' })
  }
  return res.status(response.status).json(response.body ?? {})
}
