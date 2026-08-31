import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getManagedProject, toProjectListItem } from '@/lib/api/self-hosted/projects'
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

  return res.status(200).json({
    ...toProjectListItem(project),
    connectionString: '',
    restUrl: '',
  })
}

const handleDelete = async (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(400).json({ error: { message: 'The default project cannot be deleted' } })
}
