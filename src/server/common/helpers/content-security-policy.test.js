import { createServer } from '../../server.js'

describe('#contentSecurityPolicy', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', async () => {
    const resp = await server.inject({
      method: 'GET',
      url: '/health'
    })

    // CSP header may be set on different header key
    const hasCsp =
      resp.headers['content-security-policy'] ||
      resp.headers['Content-Security-Policy'] ||
      Object.keys(resp.headers).some((key) =>
        key.toLowerCase().includes('content-security')
      )

    expect(hasCsp).toBeTruthy()
  })
})
