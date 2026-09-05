import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/organizations/[slug]/members/[gotrue_id]/roles/[role_id]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute(
  '/api/platform/organizations/$slug/members/$gotrue_id/roles/$role_id'
)({
  server: { handlers: { PUT: handler, DELETE: handler } },
})
