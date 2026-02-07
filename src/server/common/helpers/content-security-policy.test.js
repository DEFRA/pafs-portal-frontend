import { createServer } from '../../server.js'
import { contentSecurityPolicy } from './content-security-policy.js'
import Blankie from 'blankie'

describe('#contentSecurityPolicy', () => {
  describe('Unit Tests', () => {
    test('Should export contentSecurityPolicy configuration', () => {
      expect(contentSecurityPolicy).toBeDefined()
      expect(contentSecurityPolicy.plugin).toBe(Blankie)
      expect(contentSecurityPolicy.options).toBeDefined()
    })

    test('Should configure CSP options correctly', () => {
      const { options } = contentSecurityPolicy

      expect(options.defaultSrc).toEqual(['self'])
      expect(options.fontSrc).toEqual(['self', 'data:'])
      expect(options.connectSrc).toEqual(['self', 'wss', 'data:'])
      expect(options.mediaSrc).toEqual(['self'])
      expect(options.styleSrc).toEqual(['self'])
      expect(options.scriptSrc).toEqual([
        'self',
        "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
      ])
      expect(options.imgSrc).toEqual(['self', 'data:'])
      expect(options.frameSrc).toEqual(['self', 'data:'])
      expect(options.objectSrc).toEqual(['none'])
      expect(options.frameAncestors).toEqual(['none'])
      expect(options.manifestSrc).toEqual(['self'])
      expect(options.generateNonces).toBe(false)
    })

    test('Should configure formAction correctly', () => {
      const { options } = contentSecurityPolicy

      // formAction should be an array containing 'self'
      expect(Array.isArray(options.formAction)).toBe(true)
      expect(options.formAction).toContain('self')

      // In development mode, it also includes CDP Uploader URL
      // In production/test mode, it only contains 'self'
      expect(options.formAction.length).toBeGreaterThanOrEqual(1)
      expect(options.formAction.length).toBeLessThanOrEqual(2)
    })

    test('Should have GOV.UK frontend script hash in scriptSrc', () => {
      const { options } = contentSecurityPolicy
      const govUkHash = "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"

      expect(options.scriptSrc).toContain(govUkHash)
    })

    test('Should configure formAction based on environment', () => {
      const { options } = contentSecurityPolicy

      // formAction should always contain 'self'
      expect(options.formAction).toContain('self')

      // Check if development mode is enabled by checking formAction length
      if (options.formAction.length === 2) {
        // Development mode - includes CDP Uploader URL
        expect(options.formAction).toContain('http://localhost:7337')
      } else {
        // Production/test mode - only 'self'
        expect(options.formAction).toEqual(['self'])
      }
    })
  })

  describe('Integration Tests', () => {
    let server

    beforeAll(async () => {
      server = await createServer()
      await server.initialize()
    }, 120000) // Server startup takes 40-50s

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    }, 10000)

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
    }, 60000)
  })
})
