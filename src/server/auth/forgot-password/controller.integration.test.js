import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../server.js'

describe('Forgot Password Route Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /forgot-password route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/forgot-password' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('POST /forgot-password route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/forgot-password' && r.method === 'post'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('GET /forgot-password/confirmation route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/forgot-password/confirmation' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })
})
