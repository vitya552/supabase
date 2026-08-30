import { components } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getManagedProjectSettings, getProjectSettings } from '@/lib/api/self-hosted/settings'

type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  if (ref !== 'default') {
    const managed = await getManagedProjectSettings(ref, req)
    if (managed === null) {
      // Never fall back to the default project's settings (and its API keys)
      // for a ref the management API does not know.
      return res.status(404).json({ error: { message: `Project ${ref} not found` } })
    }
    return res.status(200).json(managed)
  }

  return res.status(200).json(getProjectSettings())
}
