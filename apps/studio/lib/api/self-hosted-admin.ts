import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'

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

/**
 * Admin client scoped to the project in `req.query.ref`. Self-hosted runs a
 * single project, so only the default ref resolves to a client.
 */
export async function getProjectSupabaseAdmin(req: NextApiRequest): Promise<SupabaseClient | null> {
  const ref = typeof req.query.ref === 'string' ? req.query.ref : 'default'
  if (ref === 'default') return selfHostedSupabaseAdmin
  return null
}
