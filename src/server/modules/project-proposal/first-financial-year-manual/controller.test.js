import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { firstFinancialYearManualController } from './controller.js'

describe('#firstFinancialYearManualController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-13T12:00:00.000Z'))

    mockRequest = {
      method: 'get',
      t: vi.fn((key) => key),
      payload: {},
      yar: {
        get: vi.fn(() => ({})),
        set: vi.fn()
      },
      server: {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn((template, context) => ({
        template,
        context,
        code: (status) => ({ template, context, statusCode: status })
      })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GET', () => {
    test('renders manual entry page', async () => {
      await firstFinancialYearManualController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/first-financial-year-manual/index'
        ),
        expect.objectContaining({
          backLink: '/project-proposal/first-financial-year'
        })
      )
    })
  })

  describe('POST', () => {
    test('shows error when empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { firstFinancialYear: '' }

      const result = await firstFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({ href: '#first-financial-year' })
          ])
        })
      )
    })

    test('shows error when format is invalid', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { firstFinancialYear: '20ab' }

      const result = await firstFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('saves entry to session and redirects to last-financial-year', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { firstFinancialYear: '2032' }
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' }
      })

      const result = await firstFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          firstFinancialYear: { firstFinancialYear: '2032' }
        })
      )
      expect(result.redirect).toBe('/project-proposal/last-financial-year')
    })
  })
})
