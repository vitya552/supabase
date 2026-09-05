import { createFileRoute } from '@tanstack/react-router'

import { toWebHandler } from '@/compat/next/api'
import nextHandler from '@/pages/api/v1/projects/[ref]/config/database/postgres'

const handler = toWebHandler(nextHandler)

export const Route = createFileRoute('/api/v1/projects/$ref/config/database/postgres')({
  server: { handlers: { GET: handler, PUT: handler } },
})
