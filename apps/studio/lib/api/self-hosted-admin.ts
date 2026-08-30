import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'
import z from 'zod'

import { fetchManagementApi } from './self-hosted/management-api'
import { getManagedProject } from './self-hosted/projects'

// Lazy admin client for self-hosted API routes under
// `pages/api/platform/{auth,storage}/**`. SUPABASE_URL and
// SUPABASE_SERVICE_KEY are only set on self-hosted deployments — the
// platform build doesn't need these env vars. But on the TanStack Start
// server, every API route's module gets evaluated when the single function
// handler loads, regardless of whether its URL is hit. Without a lazy
// wrapper, constructing the client at module scope with undefined
// credentials would crash every request on platform.
//
// Proxy defers client construction until a property is actually accessed,
// which only happens inside the handler (i.e. on self-hosted where the env
// vars are set).
let _client: SupabaseClient | undefined

export const selfHostedSupabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    _client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
    return Reflect.get(_client, prop)
  },
})

const apiKeysSchema = z.array(z.object({ api_key: z.string(), tags: z.string() }))

/**
 * Admin client scoped to the project in `req.query.ref`. The default project
 * uses the env-configured client; projects managed by the management API get
 * a client pointed at their own stack (via the management API's `/proj/:ref`
 * service proxy) authenticated with their own service key. Returns null when
 * the ref is unknown or the project has no attached Supabase services (e.g.
 * external database projects).
 */
export async function getProjectSupabaseAdmin(req: NextApiRequest): Promise<SupabaseClient | null> {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'
  if (ref === 'default') return selfHostedSupabaseAdmin

  const project = await getManagedProject(ref, req)
  if (project === null || project.kind !== 'compose') return null

  const managementApiUrl = process.env.MANAGEMENT_API_URL
  if (!managementApiUrl) return null

  const apiKeysResponse = await fetchManagementApi(
    `/platform/projects/${encodeURIComponent(ref)}/api-keys`,
    req
  )
  const apiKeys = apiKeysSchema.safeParse(apiKeysResponse)
  const serviceKey = apiKeys.success
    ? apiKeys.data.find((key) => key.tags === 'service_role')?.api_key
    : undefined
  if (!serviceKey) return null

  const baseUrl = `${managementApiUrl.replace(/\/$/, '')}/proj/${encodeURIComponent(ref)}`
  return createClient(baseUrl, serviceKey, { auth: { persistSession: false } })
}
