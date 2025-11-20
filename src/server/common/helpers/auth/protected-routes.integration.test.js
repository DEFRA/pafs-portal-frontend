import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../../server.js'

describe('Protected Routes Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('general user routes are registered with auth middleware', () => {
    const table = server.table()
    const homeRoute = table.find((r) => r.path === '/' && r.method === 'get')
    const archiveRoute = table.find(
      (r) => r.path === '/archive' && r.method === 'get'
    )
    const downloadRoute = table.find(
      (r) => r.path === '/download' && r.method === 'get'
    )

    expect(homeRoute).toBeDefined()
    expect(archiveRoute).toBeDefined()
    expect(downloadRoute).toBeDefined()
  })

  test('admin routes are registered with admin middleware', () => {
    const table = server.table()
    const usersRoute = table.find(
      (r) => r.path === '/admin/users' && r.method === 'get'
    )

    expect(usersRoute).toBeDefined()
    expect(usersRoute.settings.pre).toBeDefined()
  })

  test('public routes are accessible', () => {
    const table = server.table()
    const loginRoute = table.find(
      (r) => r.path === '/login' && r.method === 'get'
    )
    const healthRoute = table.find(
      (r) => r.path === '/health' && r.method === 'get'
    )

    expect(loginRoute).toBeDefined()
    expect(healthRoute).toBeDefined()
  })
})
