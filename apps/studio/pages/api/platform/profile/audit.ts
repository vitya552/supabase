import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { fetchManagementApi } from '@/lib/api/self-hosted/management-api'

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

const auditLogRecordSchema = z.object({
  id: z.number(),
  username: z.string(),
  method: z.string(),
  route: z.string(),
  status: z.number(),
  project_ref: z.string().nullable(),
  created_at: z.string(),
})

const auditLogsResponseSchema = z.object({
  result: z.array(auditLogRecordSchema),
  retention_period: z.number(),
})

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { iso_timestamp_start, iso_timestamp_end } = req.query
  const query = new URLSearchParams({
    iso_timestamp_start: typeof iso_timestamp_start === 'string' ? iso_timestamp_start : '',
    iso_timestamp_end: typeof iso_timestamp_end === 'string' ? iso_timestamp_end : '',
  })
  const response = await fetchManagementApi(`/platform/profile/audit?${query.toString()}`, req)
  if (response === null) {
    return res.status(404).json({ error: { message: 'Management API is not configured' } })
  }
  const parsed = auditLogsResponseSchema.safeParse(response)
  if (!parsed.success) {
    return res.status(500).json({ error: { message: 'Unexpected audit log response' } })
  }

  // Reshape onto the platform audit log contract so the existing page renders.
  const result = parsed.data.result.map((log) => ({
    project_ref: log.project_ref ?? undefined,
    request_id: String(log.id),
    action: {
      name: log.route,
      method: log.method,
      route: log.route,
      status: log.status,
    },
    actor: {
      token_type: 'session',
      user_id: log.username,
      email: log.username,
    },
    // The page expects microsecond timestamps.
    timestamp: new Date(log.created_at).getTime() * 1000,
  }))
  return res.status(200).json({ result, retention_period: parsed.data.retention_period })
}
