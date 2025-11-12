import { describe, test, expect, vi } from 'vitest'

vi.mock('./server/common/helpers/start-server.js', () => ({
  startServer: vi.fn().mockResolvedValue({
    info: { uri: 'http://localhost:3000' }
  })
}))

describe('Application entry point', () => {
  test('starts the server on load', async () => {
    const processOnSpy = vi.spyOn(process, 'on')

    await import('./index.js')

    expect(processOnSpy).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function)
    )

    processOnSpy.mockRestore()
  })

  test('handles errors by setting exit code', () => {
    const originalExitCode = process.exitCode
    const testError = new Error('something went wrong')

    const listeners = process.listeners('unhandledRejection')
    expect(listeners.length).toBeGreaterThan(0)

    const handler = listeners[listeners.length - 1]
    handler(testError)

    expect(process.exitCode).toBe(1)

    process.exitCode = originalExitCode
  })
})
