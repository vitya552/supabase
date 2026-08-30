import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  deleteManagedProject,
  getManagedProject,
  getManagedProjectConnectionString,
  toProjectListItem,
} from '@/lib/api/self-hosted/projects'
import { encryptString } from '@/lib/api/self-hosted/util'
import { DEFAULT_PROJECT, PROJECT_REST_URL } from '@/lib/constants/api'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['GET', 'DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  if (ref === DEFAULT_PROJECT.ref) {
    return res.status(200).json({
      ...DEFAULT_PROJECT,
      connectionString: '',
      restUrl: PROJECT_REST_URL,
    })
  }

  const project = await getManagedProject(ref, req)
  if (project === null) {
    return res.status(404).json({ error: { message: 'Project not found' } })
  }

  // The connection string is encrypted with the shared pg-meta key so the
  // browser only ever relays an opaque `x-connection-encrypted` value.
  const rawConnectionString = await getManagedProjectConnectionString(ref, req)
  const connectionString = rawConnectionString !== null ? encryptString(rawConnectionString) : ''

  return res.status(200).json({
    ...toProjectListItem(project),
    connectionString,
    restUrl: project.endpoint !== null ? `${project.endpoint}/rest/v1/` : '',
  })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : ''

  if (ref === DEFAULT_PROJECT.ref) {
    return res.status(400).json({ error: { message: 'The default project cannot be deleted' } })
  }

  const response = await deleteManagedProject(ref, req)
  if (response === null) {
    return res
      .status(400)
      .json({ error: { message: 'Project deletion requires the management API to be enabled' } })
  }
  if (response.status >= 400) {
    return res.status(response.status).json({ error: { message: 'Failed to delete project' } })
  }
  return res.status(200).json({ ref })
}
