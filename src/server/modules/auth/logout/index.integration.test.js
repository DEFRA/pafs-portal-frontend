import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../../server.js'

describe('Logout Route Registration', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('logout route is registered', () => {
    const table = server.table()
    const logoutRoute = table.find(
      (route) => route.path === '/logout' && route.method === 'get'
    )

    expect(logoutRoute).toBeDefined()
  })
})
