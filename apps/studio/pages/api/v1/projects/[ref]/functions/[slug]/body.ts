import { createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { type NextApiRequest, type NextApiResponse } from 'next'

import { z } from 'zod'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getFunctionsArtifactStore } from '@/lib/api/self-hosted/functions'
import { fetchManagementApi, IS_MANAGEMENT_API_ENABLED } from '@/lib/api/self-hosted/management-api'
import { uuidv4 } from '@/lib/helpers'

export default function handlerWithErrorCatching(req: NextApiRequest, res: NextApiResponse) {
  return apiWrapper(req, res, handler, { withAuth: true })
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const functionFilesSchema = z.object({
  files: z.array(z.object({ name: z.string(), content: z.string() })),
})

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) {
    res.status(404).json({ error: { message: `Missing function 'slug' parameter` } })
    return
  }

  if (IS_MANAGEMENT_API_ENABLED) {
    const refParam = req.query.ref
    const ref = (Array.isArray(refParam) ? refParam[0] : refParam) ?? 'default'
    const raw = await fetchManagementApi(
      `/platform/projects/${encodeURIComponent(ref)}/functions/${encodeURIComponent(slug)}/files`,
      req
    )
    const parsed = functionFilesSchema.safeParse(raw)
    if (!parsed.success) {
      res.status(404).json({ error: { message: `Function not found` } })
      return
    }
    return writeMultipart(
      res,
      parsed.data.files.map((file) => ({
        relativePath: file.name,
        size: Buffer.byteLength(file.content, 'utf8'),
        write: async (target: NextApiResponse) => {
          target.write(file.content)
        },
      }))
    )
  }

  const store = getFunctionsArtifactStore()
  const storeEntries = await store.getFileEntriesBySlug(slug)
  return writeMultipart(
    res,
    storeEntries.map((entry) => ({
      relativePath: entry.relativePath,
      size: entry.size,
      write: async (target: NextApiResponse) => {
        await pipeline(createReadStream(entry.absolutePath), target, { end: false })
      },
    }))
  )
}

type MultipartFileEntry = {
  relativePath: string
  size: number
  write: (res: NextApiResponse) => Promise<void>
}

async function writeMultipart(res: NextApiResponse, fileEntries: MultipartFileEntry[]) {

  const boundary = `----FormBoundary${uuidv4().replace(/-/g, '')}`
  const totalSize = fileEntries.reduce((sum, entry) => sum + entry.size, 0)

  const metadata = {
    // mock id, should be "<project_id>_<function_id>_<version>"
    deployment_id: uuidv4(),
    original_size: totalSize,
    compressed_size: totalSize,
    module_count: fileEntries.length,
  }

  res.setHeader('Content-Type', `multipart/form-data; boundary=${boundary}`)
  res.status(200)

  // Write metadata part
  const metadataJson = JSON.stringify(metadata)
  res.write(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="metadata"\r\n` +
      `Content-Type: application/json\r\n` +
      `\r\n` +
      metadataJson +
      `\r\n`
  )

  // Stream each file part
  for (const entry of fileEntries) {
    const safeName = entry.relativePath
      .replace(/[\r\n]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
    const encodedName = encodeURIComponent(entry.relativePath)
    res.write(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${safeName}"; filename*=UTF-8''${encodedName}\r\n` +
        `Content-Type: text/plain\r\n` +
        `\r\n`
    )
    await entry.write(res)
    res.write(`\r\n`)
  }

  // Write closing boundary
  res.write(`--${boundary}--\r\n`)
  res.end()
}
