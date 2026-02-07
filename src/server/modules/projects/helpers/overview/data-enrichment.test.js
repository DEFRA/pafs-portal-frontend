import { describe, test, expect, beforeEach, vi } from 'vitest'
import { enrichProjectData } from './data-enrichment.js'

describe('data-enrichment', () => {
  let mockRequest
  let mockLogger

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    mockRequest = {
      server: {
        logger: mockLogger
      }
    }
  })

  describe('enrichProjectData', () => {
    test('should return initial data when no enrichment functions provided', async () => {
      const initialData = { name: 'Test Project', id: 123 }

      const result = await enrichProjectData(mockRequest, initialData, [])

      expect(result).toEqual({
        success: true,
        projectData: initialData,
        error: undefined,
        errors: []
      })
    })

    test('should successfully enrich data with single function', async () => {
      const initialData = { name: 'Test Project' }
      const enrichedData = { name: 'Test Project', enriched: true }

      const enrichmentFn = vi.fn().mockResolvedValue({
        success: true,
        projectData: enrichedData
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn
      ])

      expect(result.success).toBe(true)
      expect(result.projectData).toEqual(enrichedData)
      expect(result.errors).toEqual([])
      expect(enrichmentFn).toHaveBeenCalledWith(mockRequest, initialData)
    })

    test('should successfully enrich data with multiple functions in sequence', async () => {
      const initialData = { name: 'Test Project', count: 0 }

      const enrichmentFn1 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', count: 1 }
      })

      const enrichmentFn2 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', count: 2, step2: true }
      })

      const enrichmentFn3 = vi.fn().mockResolvedValue({
        success: true,
        projectData: {
          name: 'Test Project',
          count: 3,
          step2: true,
          step3: true
        }
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn1,
        enrichmentFn2,
        enrichmentFn3
      ])

      expect(result.success).toBe(true)
      expect(result.projectData).toEqual({
        name: 'Test Project',
        count: 3,
        step2: true,
        step3: true
      })
      expect(result.errors).toEqual([])
      expect(enrichmentFn1).toHaveBeenCalledWith(mockRequest, initialData)
      expect(enrichmentFn2).toHaveBeenCalledWith(mockRequest, {
        name: 'Test Project',
        count: 1
      })
      expect(enrichmentFn3).toHaveBeenCalledWith(mockRequest, {
        name: 'Test Project',
        count: 2,
        step2: true
      })
    })

    test('should continue with remaining functions when one fails', async () => {
      const initialData = { name: 'Test Project' }

      const enrichmentFn1 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', step1: true }
      })

      const enrichmentFn2 = vi.fn().mockResolvedValue({
        success: false,
        projectData: { name: 'Test Project', step1: true },
        error: new Error('Failed to enrich')
      })

      const enrichmentFn3 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', step1: true, step3: true }
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn1,
        enrichmentFn2,
        enrichmentFn3
      ])

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual({
        name: 'Test Project',
        step1: true,
        step3: true
      })
      expect(result.errors).toHaveLength(1)
      expect(result.error.message).toBe('Failed to enrich')
      expect(enrichmentFn3).toHaveBeenCalledWith(mockRequest, {
        name: 'Test Project',
        step1: true
      })
    })

    test('should record error when enrichment function fails without error object', async () => {
      const initialData = { name: 'Test Project' }

      const enrichmentFn = vi.fn().mockResolvedValue({
        success: false,
        projectData: initialData
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn
      ])

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual(initialData)
      expect(result.errors).toEqual([])
      expect(result.error).toBeUndefined()
    })

    test('should handle exception thrown by enrichment function', async () => {
      const initialData = { name: 'Test Project' }
      const thrownError = new Error('Unexpected error')

      const enrichmentFn = vi.fn().mockRejectedValue(thrownError)

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn
      ])

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual(initialData)
      expect(result.errors).toEqual([thrownError])
      expect(result.error).toBe(thrownError)
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: thrownError, enrichmentFn: enrichmentFn.name },
        'Data enrichment function failed'
      )
    })

    test('should continue with remaining functions after exception', async () => {
      const initialData = { name: 'Test Project' }

      const enrichmentFn1 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', step1: true }
      })

      const enrichmentFn2 = vi
        .fn()
        .mockRejectedValue(new Error('Exception occurred'))

      const enrichmentFn3 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { name: 'Test Project', step1: true, step3: true }
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn1,
        enrichmentFn2,
        enrichmentFn3
      ])

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual({
        name: 'Test Project',
        step1: true,
        step3: true
      })
      expect(result.errors).toHaveLength(1)
      expect(enrichmentFn3).toHaveBeenCalled()
    })

    test('should return first error for backward compatibility', async () => {
      const initialData = { name: 'Test Project' }
      const error1 = new Error('First error')
      const error2 = new Error('Second error')

      const enrichmentFn1 = vi.fn().mockResolvedValue({
        success: false,
        projectData: initialData,
        error: error1
      })

      const enrichmentFn2 = vi.fn().mockResolvedValue({
        success: false,
        projectData: initialData,
        error: error2
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn1,
        enrichmentFn2
      ])

      expect(result.success).toBe(false)
      expect(result.error).toBe(error1)
      expect(result.errors).toEqual([error1, error2])
    })

    test('should handle mixed success, failure, and exceptions', async () => {
      const initialData = { count: 0 }

      const enrichmentFn1 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { count: 1 }
      })

      const enrichmentFn2 = vi.fn().mockResolvedValue({
        success: false,
        projectData: { count: 1 },
        error: new Error('API error')
      })

      const enrichmentFn3 = vi
        .fn()
        .mockRejectedValue(new Error('Network error'))

      const enrichmentFn4 = vi.fn().mockResolvedValue({
        success: true,
        projectData: { count: 2 }
      })

      const result = await enrichProjectData(mockRequest, initialData, [
        enrichmentFn1,
        enrichmentFn2,
        enrichmentFn3,
        enrichmentFn4
      ])

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual({ count: 2 })
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].message).toBe('API error')
      expect(result.errors[1].message).toBe('Network error')
      expect(mockLogger.error).toHaveBeenCalledTimes(1)
    })

    test('should handle enrichment function with no name property', async () => {
      const initialData = { name: 'Test Project' }
      const anonymousFn = async () => {
        throw new Error('Anonymous function error')
      }

      const result = await enrichProjectData(mockRequest, initialData, [
        anonymousFn
      ])

      expect(result.success).toBe(false)
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
          enrichmentFn: anonymousFn.name
        }),
        'Data enrichment function failed'
      )
    })
  })
})
