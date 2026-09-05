import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/organizations/[slug]/members/invitations/smtp-status'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute(
  '/api/platform/organizations/$slug/members/invitations/smtp-status'
)({
  server: { handlers: { GET: handler } },
})
