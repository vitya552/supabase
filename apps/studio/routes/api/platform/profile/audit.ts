import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/profile/audit'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/profile/audit')({
  server: { handlers: { GET: handler } },
})
