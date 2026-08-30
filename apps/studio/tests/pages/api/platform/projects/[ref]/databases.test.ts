import { createMocks } from 'node-mocks-http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import handler from '../../../../../../pages/api/platform/projects/[ref]/databases'
import type { ManagementProject } from '@/lib/api/self-hosted/projects'
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

const composeProject: ManagementProject = {
  id: 2,
  ref: 'composeref12345',
  name: 'Compose Project',
  organization_id: 1,
  kind: 'compose',
  status: 'ACTIVE_HEALTHY',
  status_detail: null,
  inserted_at: '2026-01-01T00:00:00.000Z',
  cloud_provider: 'localhost',
  region: 'local',
  endpoint: 'http://gateway:8000/proj/composeref12345',
  database: {
    host: 'sbproj-composeref12345-db',
    port: 5432,
    user: 'postgres',
    name: 'postgres',
  },
}

const externalProject: ManagementProject = {
  ...composeProject,
  id: 3,
  ref: 'externalref1234',
  name: 'External Project',
  kind: 'external',
  endpoint: null,
  database: {
    host: 'db.example.com',
    port: 6543,
    user: 'app_user',
    name: 'app_db',
  },
}

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

  it('returns project-specific database metadata for a compose project', async () => {
    getManagedProjectMock.mockResolvedValue(composeProject)

    const { req, res } = createMocks({ method: 'GET', query: { ref: composeProject.ref } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      identifier: composeProject.ref,
      db_host: 'sbproj-composeref12345-db',
      db_port: 5432,
      db_user: 'postgres',
      db_name: 'postgres',
      restUrl: 'http://gateway:8000/proj/composeref12345/rest/v1/',
      status: 'ACTIVE_HEALTHY',
    })
  })

  it('returns external database metadata without fabricating a REST URL', async () => {
    getManagedProjectMock.mockResolvedValue(externalProject)

    const { req, res } = createMocks({ method: 'GET', query: { ref: externalProject.ref } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data[0]).toMatchObject({
      identifier: externalProject.ref,
      db_host: 'db.example.com',
      db_port: 6543,
      db_user: 'app_user',
      db_name: 'app_db',
      restUrl: '',
    })
  })

  it('maps unknown project statuses to UNKNOWN', async () => {
    getManagedProjectMock.mockResolvedValue({ ...composeProject, status: 'SOMETHING_ELSE' })

    const { req, res } = createMocks({ method: 'GET', query: { ref: composeProject.ref } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())[0].status).toBe('UNKNOWN')
  })

  it('returns 404 for a ref the management API does not know', async () => {
    getManagedProjectMock.mockResolvedValue(null)

    const { req, res } = createMocks({ method: 'GET', query: { ref: 'nosuchref123456' } })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(404)
  })
})
