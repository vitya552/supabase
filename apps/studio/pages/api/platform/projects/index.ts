import { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import {
  createManagedProject,
  listManagedProjects,
  managementProjectSchema,
  toProjectListItem,
} from '@/lib/api/self-hosted/projects'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGetAll(req, res)
    case 'POST':
      return handleCreate(req, res)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const projects = await listManagedProjects(req)
  if (projects === null) return res.status(200).json([DEFAULT_PROJECT])
  return res.status(200).json(projects.map(toProjectListItem))
}

const createBodySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['compose', 'external']).optional(),
  organization_id: z.number().optional(),
  db_connection_string: z.string().optional(),
})

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const parsed = createBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: { message: 'Invalid project payload' } })
  }

  const response = await createManagedProject(parsed.data, req)
  if (response === null) {
    return res
      .status(400)
      .json({ error: { message: 'Project creation requires the management API to be enabled' } })
  }

  if (response.status >= 400) {
    const message =
      typeof response.body === 'object' &&
      response.body !== null &&
      'message' in response.body &&
      typeof response.body.message === 'string'
        ? response.body.message
        : 'Failed to create project'
    return res.status(response.status).json({ error: { message } })
  }

  const project = managementProjectSchema.safeParse(response.body)
  if (!project.success) {
    return res.status(500).json({ error: { message: 'Unexpected management API response' } })
  }
  return res.status(201).json(toProjectListItem(project.data))
}
