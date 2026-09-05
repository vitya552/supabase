import { NextApiRequest, NextApiResponse } from 'next'

// Self-hosted only: URL and token of the local management API service
// (docker/management-api), passed to the Studio container via docker-compose.
const MANAGEMENT_API_URL = process.env.MANAGEMENT_API_URL
const MANAGEMENT_API_TOKEN = process.env.MANAGEMENT_API_TOKEN

export const IS_MANAGEMENT_API_ENABLED = Boolean(MANAGEMENT_API_URL && MANAGEMENT_API_TOKEN)

const SESSION_COOKIE = 'sb-dashboard-session'

/**
 * Forwards only the dashboard session cookie so the management API can apply
 * per-user role checks. Other cookies stay on the Studio side.
 */
function sessionCookieHeader(req: NextApiRequest | undefined): Record<string, string> {
  const token = req?.cookies?.[SESSION_COOKIE]
  return token ? { Cookie: `${SESSION_COOKIE}=${token}` } : {}
}

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
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
      ...sessionCookieHeader(req),
    },
    body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
  })

  const setCookie = response.headers.get('set-cookie')
  if (setCookie) res.setHeader('Set-Cookie', setCookie)
  const body = await response.json().catch(() => null)
  return res.status(response.status).json(body)
}

/**
 * Server-side GET against the management API, for routes that merge its
 * response with locally derived fields.
 */
export async function fetchManagementApi(path: string, req?: NextApiRequest): Promise<unknown> {
  if (!MANAGEMENT_API_URL || !MANAGEMENT_API_TOKEN) return null

  const response = await fetch(`${MANAGEMENT_API_URL}${path}`, {
    redirect: 'error',
    headers: { Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`, ...sessionCookieHeader(req) },
  })
  if (!response.ok) return null
  return response.json().catch(() => null)
}

/**
 * Server-side call against the management API with an explicit method/body,
 * for routes that translate between the platform and management contracts.
 */
export async function callManagementApi(
  path: string,
  init: { method: string; body?: unknown; req?: NextApiRequest } = { method: 'GET' }
): Promise<{ status: number; body: unknown } | null> {
  if (!MANAGEMENT_API_URL || !MANAGEMENT_API_TOKEN) return null

  const response = await fetch(`${MANAGEMENT_API_URL}${path}`, {
    method: init.method,
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
      ...sessionCookieHeader(init.req),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

/**
 * Forwards the request body verbatim (e.g. multipart uploads). The calling
 * route must disable Next's body parser (`config.api.bodyParser = false`).
 */
export async function proxyManagementApiRaw(
  req: NextApiRequest,
  res: NextApiResponse,
  path: string
) {
  if (!MANAGEMENT_API_URL || !MANAGEMENT_API_TOKEN) {
    return res.status(404).json({
      error: {
        message:
          'Management API is not configured. Set MANAGEMENT_API_URL and MANAGEMENT_API_TOKEN on the studio container.',
      },
    })
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${MANAGEMENT_API_TOKEN}`,
    ...sessionCookieHeader(req),
  }
  const contentType = req.headers['content-type']
  if (contentType) headers['Content-Type'] = contentType

  const response = await fetch(`${MANAGEMENT_API_URL}${path}`, {
    method: req.method,
    redirect: 'error',
    headers,
    body: Buffer.concat(chunks),
  })

  const body = await response.json().catch(() => null)
  return res.status(response.status).json(body)
}
