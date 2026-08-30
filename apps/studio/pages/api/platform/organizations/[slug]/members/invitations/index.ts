import { NextApiRequest, NextApiResponse } from 'next'

import { apiWrapper } from '@/lib/api/apiWrapper'
import { callManagementApi } from '@/lib/api/self-hosted/management-api'
import {
  listDashboardInvitations,
  roleFromRoleId,
  roleIdFromRole,
} from '@/lib/api/self-hosted/team'

const wrappedHandler = (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

export default wrappedHandler

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

const DISPLAY_EXPIRY_WINDOW_MS = 24 * 60 * 60 * 1000

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const invitations = await listDashboardInvitations(req)
  if (invitations === null) return res.status(200).json({ invitations: [] })

  return res.status(200).json({
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      // The Team page treats invites older than 24h as expired, so the
      // timestamp is anchored to the real expiry rather than creation time.
      invited_at: new Date(
        new Date(invitation.expires_at).getTime() - DISPLAY_EXPIRY_WINDOW_MS
      ).toISOString(),
      invited_email: invitation.invited_email || `invited by ${invitation.invited_by}`,
      role_id: roleIdFromRole(invitation.role) ?? 3,
    })),
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const emails: string[] = Array.isArray(req.body?.emails)
    ? req.body.emails.filter((email: unknown): email is string => typeof email === 'string')
    : []
  const roleId = Number(req.body?.role_id)
  const role = roleFromRoleId(roleId)
  if (role === null) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  const targets = emails.length > 0 ? emails : ['']
  const succeeded: string[] = []
  const invite_urls: {
    email: string
    url: string
    email_sent: boolean
    email_error: string | null
  }[] = []
  const failed: { email: string; error: string }[] = []

  for (const email of targets) {
    const response = await callManagementApi('/platform/dashboard-users/invitations', {
      method: 'POST',
      body: { role, invited_email: email },
      req,
    })
    if (response === null || response.status !== 201) {
      const message =
        response !== null &&
        typeof response.body === 'object' &&
        response.body !== null &&
        'message' in response.body &&
        typeof response.body.message === 'string'
          ? response.body.message
          : 'Failed to create invitation'
      failed.push({ email, error: message })
      continue
    }
    const body: Record<string, unknown> =
      typeof response.body === 'object' && response.body !== null
        ? (response.body as Record<string, unknown>)
        : {}
    const token = typeof body.token === 'string' ? body.token : ''
    succeeded.push(email)
    invite_urls.push({
      email,
      url: `/join?token=${token}`,
      email_sent: body.email_sent === true,
      email_error: typeof body.email_error === 'string' ? body.email_error : null,
    })
  }

  if (succeeded.length === 0 && failed.length > 0) {
    return res.status(403).json({ message: failed[0].error })
  }
  return res.status(201).json({ succeeded, failed, invite_urls })
}
