import { paths } from 'api-types'
import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { POSTGRES_PORT } from '@/lib/api/self-hosted/constants'
import { IS_MANAGEMENT_API_ENABLED } from '@/lib/api/self-hosted/management-api'
import { getManagedProject } from '@/lib/api/self-hosted/projects'
import { PROJECT_DB_HOST, PROJECT_REST_URL } from '@/lib/constants/api'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

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

type ResponseData =
  paths['/platform/projects/{ref}/databases']['get']['responses']['200']['content']['application/json']

type DatabaseStatus = ResponseData[number]['status']

const DATABASE_STATUSES: readonly DatabaseStatus[] = [
  'ACTIVE_HEALTHY',
  'ACTIVE_UNHEALTHY',
  'COMING_UP',
  'GOING_DOWN',
  'INIT_FAILED',
  'INIT_READ_REPLICA',
  'INIT_READ_REPLICA_FAILED',
  'REMOVED',
  'RESIZING',
  'RESTARTING',
  'RESTORING',
  'UNKNOWN',
]

export function toDatabaseStatus(status: string): DatabaseStatus {
  return DATABASE_STATUSES.find((s) => s === status) ?? 'UNKNOWN'
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'

  if (ref !== 'default' && IS_MANAGEMENT_API_ENABLED) {
    const project = await getManagedProject(ref, req)
    if (project === null) {
      return res.status(404).json({ error: { message: `Project ${ref} not found` } })
    }
  }

  const databases: ResponseData = [
    {
      cloud_provider: 'AWS',
      connectionString: '',
      connection_string_read_only: '',
      db_host: PROJECT_DB_HOST,
      db_name: 'postgres',
      db_port: POSTGRES_PORT,
      db_user: 'postgres',
      identifier: ref,
      inserted_at: '',
      region: 'local',
      restUrl: PROJECT_REST_URL,
      size: '',
      status: 'ACTIVE_HEALTHY',
    },
  ]
  return res.status(200).json(databases)
}
