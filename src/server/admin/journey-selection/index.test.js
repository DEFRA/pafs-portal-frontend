import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../server.js'

describe('Journey Selection Routes', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /admin/journey-selection route exists', async () => {
    const route = server.lookup(
      'journey-selection-get',
      '/admin/journey-selection'
    )
    expect(route).toBeDefined()
  })

  test('POST /admin/journey-selection route exists', async () => {
    const route = server.lookup(
      'journey-selection-post',
      '/admin/journey-selection'
    )
    expect(route).toBeDefined()
  })
})
