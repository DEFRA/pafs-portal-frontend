import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../../server.js'

describe('Journey Selection Route Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /admin/journey-selection route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/admin/journey-selection' && r.method === 'get'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })

  test('POST /admin/journey-selection route is registered', () => {
    const table = server.table()
    const route = table.find(
      (r) => r.path === '/admin/journey-selection' && r.method === 'post'
    )

    expect(route).toBeDefined()
    expect(route.settings.pre).toBeDefined()
  })
})
