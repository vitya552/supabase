import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { listManagedProjects, toOrgProjectItem } from '@/lib/api/self-hosted/projects'
import { DEFAULT_PROJECT } from '@/lib/constants/api'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

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

const DEFAULT_ORG_PROJECT = {
  ...DEFAULT_PROJECT,
  organization_slug: 'default-org-slug',
  databases: [
    {
      identifier: DEFAULT_PROJECT.ref,
      region: DEFAULT_PROJECT.region,
      cloud_provider: DEFAULT_PROJECT.cloud_provider,
      status: DEFAULT_PROJECT.status,
      inserted_at: DEFAULT_PROJECT.inserted_at,
      size: null,
    },
  ],
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const slug = typeof req.query.slug === 'string' ? req.query.slug : 'default-org-slug'
  const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase() : ''
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'name_asc'

  const managed = await listManagedProjects(req)
  let projects =
    managed === null ? [DEFAULT_ORG_PROJECT] : managed.map((p) => toOrgProjectItem(p, slug))

  if (search.length > 0) {
    projects = projects.filter(
      (p) => p.name.toLowerCase().includes(search) || p.ref.toLowerCase().includes(search)
    )
  }

  projects.sort((a, b) => {
    switch (sort) {
      case 'name_desc':
        return b.name.localeCompare(a.name)
      case 'created_asc':
        return a.inserted_at.localeCompare(b.inserted_at)
      case 'created_desc':
        return b.inserted_at.localeCompare(a.inserted_at)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  return res.status(200).json({
    projects,
    pagination: { count: projects.length, limit: projects.length, offset: 0 },
  })
}
