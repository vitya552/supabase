import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/profile/factors/[id]/verify'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/profile/factors/$id/verify')({
  server: { handlers: { POST: handler } },
})
