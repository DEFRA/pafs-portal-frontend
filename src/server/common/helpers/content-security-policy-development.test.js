import { vi, describe, test, expect } from 'vitest'

// Mock config to return isDevelopment = true BEFORE importing content-security-policy
vi.mock('../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'isDevelopment') return true
      return false
    })
  }
}))

describe('#contentSecurityPolicy - Development Mode', () => {
  test('Should include CDP Uploader URL in formAction when isDevelopment is true', async () => {
    // Import the module AFTER the mock is set up
    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    // In development mode, formAction should include both 'self' and CDP Uploader URL
    expect(contentSecurityPolicy.options.formAction).toEqual([
      'self',
      'http://localhost:7337'
    ])
    expect(contentSecurityPolicy.options.formAction).toContain('self')
    expect(contentSecurityPolicy.options.formAction).toContain(
      'http://localhost:7337'
    )
    expect(contentSecurityPolicy.options.formAction.length).toBe(2)
  })
})
