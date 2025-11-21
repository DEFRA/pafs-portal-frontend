import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestConfirmationController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should render confirmation page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/account_request/confirmation'
    })

    expect(result).toEqual(expect.stringContaining('Request submitted'))
    expect(statusCode).toBe(statusCodes.ok)
  })
})
