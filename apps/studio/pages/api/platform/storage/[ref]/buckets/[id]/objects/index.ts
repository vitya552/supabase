import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { getProjectSupabaseAdmin } from '@/lib/api/self-hosted-admin'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'DELETE':
      return handleDelete(req, res)
    default:
      res.setHeader('Allow', ['DELETE'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const supabase = await getProjectSupabaseAdmin(req)
  if (supabase === null) {
    return res.status(404).json({ error: { message: 'Storage is not available for this project' } })
  }
  const { id } = req.query
  const { paths } = req.body

  const { data, error } = await supabase.storage.from(id as string).remove(paths as string[])
  if (error) {
    return res.status(400).json({ error: { message: error.message } })
  }

  return res.status(200).json(data)
}
