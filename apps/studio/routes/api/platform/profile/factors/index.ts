import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/platform/profile/factors'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/platform/profile/factors/')({
  server: { handlers: { GET: handler, POST: handler } },
})
