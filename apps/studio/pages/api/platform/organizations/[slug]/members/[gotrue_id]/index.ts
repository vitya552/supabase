import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { callManagementApi, proxyManagementApi } from '@/lib/api/self-hosted/management-api'
import { roleFromRoleId } from '@/lib/api/self-hosted/team'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  const username = typeof req.query.gotrue_id === 'string' ? req.query.gotrue_id : ''
  const target = `/platform/dashboard-users/${encodeURIComponent(username)}`

  switch (method) {
    case 'DELETE':
      return proxyManagementApi(req, res, target)
    case 'PATCH':
      return handleAssignRole(req, res, target)
    default:
      res.setHeader('Allow', ['DELETE', 'PATCH'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleAssignRole = async (req: NextApiRequest, res: NextApiResponse, target: string) => {
  const role = roleFromRoleId(Number(req.body?.role_id))
  if (role === null) {
    return res.status(400).json({ message: 'Invalid role' })
  }
  const response = await callManagementApi(target, { method: 'PATCH', body: { role }, req })
  if (response === null) {
    return res.status(500).json({ message: 'Management API is not available' })
  }
  return res.status(response.status).json(response.body ?? {})
}
