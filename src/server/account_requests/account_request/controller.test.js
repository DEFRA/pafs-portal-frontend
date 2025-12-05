import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  }, 30000) // Increase timeout for server initialization

  afterAll(async () => {
    if (server) {
      await server.stop({ timeout: 0 })
    }
  }, 10000)

  test('Should render account request page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/account_request'
    })

    expect(result).toEqual(expect.stringContaining('Request an account'))
    expect(statusCode).toBe(statusCodes.ok)
  }, 10000)
})
