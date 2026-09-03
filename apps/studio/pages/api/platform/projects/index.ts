import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { listManagedProjects, toProjectListItem } from '@/lib/api/self-hosted/projects'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return res.status(400).json({
        error: {
          message: 'Self-hosted Supabase runs a single project; creating projects is not supported',
        },
      })
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const managedProjects = await listManagedProjects(req)
  const projects =
    managedProjects === null ? [DEFAULT_PROJECT] : managedProjects.map(toProjectListItem)
  if (req.headers.version === '2') {
    return res.status(200).json({ projects, pagination: { count: projects.length } })
  }
  return res.status(200).json(projects)
}
