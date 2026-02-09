import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invalidateAccountsCacheOnAuth } from './cache-invalidation.js'

vi.mock('../../../common/services/accounts/accounts-cache.js')

const { createAccountsCacheService } =
  await import('../../../common/services/accounts/accounts-cache.js')

describe('invalidateAccountsCacheOnAuth', () => {
  let mockRequest
  let mockCacheService

  beforeEach(() => {
    vi.clearAllMocks()

    mockCacheService = {
      invalidateAll: vi.fn()
    }

    createAccountsCacheService.mockReturnValue(mockCacheService)

    mockRequest = {
      server: {
        logger: {
          warn: vi.fn()
        }
      }
    }
  })

  it('should invalidate all accounts cache', async () => {
    mockCacheService.invalidateAll.mockResolvedValue(undefined)

    await invalidateAccountsCacheOnAuth(mockRequest, 'login')

    expect(createAccountsCacheService).toHaveBeenCalledWith(mockRequest.server)
    expect(mockCacheService.invalidateAll).toHaveBeenCalled()
  })

  it('should use default context when not provided', async () => {
    mockCacheService.invalidateAll.mockResolvedValue(undefined)

    await invalidateAccountsCacheOnAuth(mockRequest)

    expect(mockCacheService.invalidateAll).toHaveBeenCalled()
  })

  it('should log warning and continue when cache invalidation fails', async () => {
    const cacheError = new Error('Cache service unavailable')
    mockCacheService.invalidateAll.mockRejectedValue(cacheError)

    // Should not throw
    await invalidateAccountsCacheOnAuth(mockRequest, 'login')

    expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
      { error: cacheError, context: 'login' },
      'Failed to invalidate accounts cache during login'
    )
  })

  it('should log warning with correct context on failure', async () => {
    const cacheError = new Error('Redis connection failed')
    mockCacheService.invalidateAll.mockRejectedValue(cacheError)

    await invalidateAccountsCacheOnAuth(mockRequest, 'auto-login')

    expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
      { error: cacheError, context: 'auto-login' },
      'Failed to invalidate accounts cache during auto-login'
    )
  })

  it('should log warning with default context on failure', async () => {
    const cacheError = new Error('Cache error')
    mockCacheService.invalidateAll.mockRejectedValue(cacheError)

    await invalidateAccountsCacheOnAuth(mockRequest)

    expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
      { error: cacheError, context: 'auth' },
      'Failed to invalidate accounts cache during auth'
    )
  })
})
