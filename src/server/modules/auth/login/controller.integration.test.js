import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../../server.js'

describe('Login Route Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /login route is registered', () => {
    const table = server.table()
    const route = table.find((r) => r.path === '/login' && r.method === 'get')

    expect(route).toBeDefined()
  })

  test('POST /login route is registered', () => {
    const table = server.table()
    const route = table.find((r) => r.path === '/login' && r.method === 'post')

    expect(route).toBeDefined()
  })
})
