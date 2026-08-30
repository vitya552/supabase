import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getProjectSupabaseAdmin } from '@/lib/api/self-hosted-admin'

// eslint-disable-next-line import/no-anonymous-default-export
export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    case 'POST':
      return handlePost(req, res)

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = await getProjectSupabaseAdmin(req)
  if (supabase === null) {
    return res.status(404).json({ error: { message: 'Storage is not available for this project' } })
  }
  const { data, error } = await supabase.storage.vectors.listBuckets()
  if (error) return res.status(500).json({ error: { message: error.message } })

  return res.status(200).json(data)
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = await getProjectSupabaseAdmin(req)
  if (supabase === null) {
    return res.status(404).json({ error: { message: 'Storage is not available for this project' } })
  }
  const { bucketName } = req.body
  const { data, error } = await supabase.storage.vectors.createBucket(bucketName)
  if (error) return res.status(400).json({ error: { message: error.message } })
  return res.status(200).json(data)
}
