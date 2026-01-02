import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../../server.js'

describe('Reset Password Route Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /reset-password route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/reset-password' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('POST /reset-password route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/reset-password' && r.method === 'post'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('GET /reset-password/success route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/reset-password/success' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('GET /reset-password/token-expired route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/reset-password/token-expired' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })
})
