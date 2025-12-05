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

  describe('GET /account_request/confirmation', () => {
    test('Should render confirmation page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toEqual(
        expect.stringContaining('Your account request has been submitted')
      )
    })

    test('Should display confirmation panel', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(
        expect.stringContaining('Your account request has been submitted')
      )
    })

    test('Should display what happens next section', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('What happens next'))
    })

    test('Should display what you need to do section', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('What you need to do'))
    })

    test('Should display return to sign in link', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('/login'))
    })
  })
})
