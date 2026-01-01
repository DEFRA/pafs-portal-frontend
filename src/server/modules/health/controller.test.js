import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#healthController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  }, 120000)

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  }, 10000)

  test('Should provide expected response', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/health'
    })

    expect(result).toEqual({ message: 'success' })
    expect(statusCode).toBe(statusCodes.ok)
  }, 60000)
})
