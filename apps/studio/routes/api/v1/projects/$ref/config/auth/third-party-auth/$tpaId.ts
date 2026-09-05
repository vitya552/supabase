import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/v1/projects/[ref]/config/auth/third-party-auth/[tpaId]'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/v1/projects/$ref/config/auth/third-party-auth/$tpaId')({
  server: { handlers: { GET: handler, DELETE: handler } },
})
