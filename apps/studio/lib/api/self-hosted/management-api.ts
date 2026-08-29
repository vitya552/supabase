import { NextApiRequest, NextApiResponse } from 'next'

// Self-hosted only: URL and token of the local management API service
// (docker/management-api), passed to the Studio container via docker-compose.
const MANAGEMENT_API_URL = process.env.MANAGEMENT_API_URL
const MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN

export const IS_MANAGEMENT_API_ENABLED = Boolean(MANAGEMENT_API_URL && MANAGEMENT_API_TOKEN)

/**
 * Forwards the request to the local management API, returning its response
 * verbatim so the platform API contract is preserved for the client.
 */
export async function proxyManagementApi(req: NextApiRequest, res: NextApiResponse, path: string) {
  if (!MANAGEMENT_API_URL || !MANAGEMENT_API_TOKEN) {
    return res.status(404).json({
      error: {
        message:
          'Management API is not configured. Set MANAGEMENT_API_URL and MANAGEMENT_API_TOKEN on the studio container.',
      },
    })
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const response = await fetch(`${MANAGEMENT_API_URL}${path}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
    },
    body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
  })

  const body = await response.json().catch(() => null)
  return res.status(response.status).json(body)
}
