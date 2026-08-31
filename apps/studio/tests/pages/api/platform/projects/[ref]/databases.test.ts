import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../pages/api/platform/projects/[ref]/databases'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', () => ({
  IS_PLATFORM: false,
  API_URL: 'https://api.example.com',
}))

vi.mock('@/lib/api/self-hosted/management-api', () => ({
  IS_MANAGEMENT_API_ENABLED: true,
}))

const { getManagedProjectMock } = vi.hoisted(() => ({
  getManagedProjectMock: vi.fn(),
}))

vi.mock('@/lib/api/self-hosted/projects', () => ({
  getManagedProject: getManagedProjectMock,
}))

describe('/api/platform/projects/[ref]/databases', () => {
  beforeEach(() => {
    mswServer.close()
    getManagedProjectMock.mockReset()
  })

  it('returns 405 for non-GET methods', async () => {
    const { req, res } = createMocks({ method: 'POST', query: { ref: 'default' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('returns the default database for ref=default without hitting the management API', async () => {
    const { req, res } = createMocks({ method: 'GET', query: { ref: 'default' } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(1)
    expect(data[0].identifier).toBe('default')
    expect(data[0].status).toBe('ACTIVE_HEALTHY')
    expect(getManagedProjectMock).not.toHaveBeenCalled()
  })

  it('returns 404 for a ref the management API does not know', async () => {
    getManagedProjectMock.mockResolvedValue(null)

    const { req, res } = createMocks({ method: 'GET', query: { ref: 'nosuchref123456' } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
  })
})
