import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { lastFinancialYearManualController } from './controller.js'

describe('#lastFinancialYearManualController', () => {
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
      await lastFinancialYearManualController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/last-financial-year-manual/index'
        ),
        expect.objectContaining({
          backLink: '/project-proposal/last-financial-year'
        })
      )
    })

    test('displays saved value from session', async () => {
      mockRequest.yar.get.mockReturnValue({
        lastFinancialYear: { lastFinancialYear: '2035' }
      })

      await lastFinancialYearManualController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          values: { lastFinancialYear: '2035' }
        })
      )
    })
  })

  describe('POST', () => {
    test('shows error when empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '' }

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({ href: '#last-financial-year' })
          ])
        })
      )
    })

    test('shows error when format is invalid', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '20ab' }

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('shows error when last year is before first year', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2030' }
      mockRequest.yar.get.mockReturnValue({
        firstFinancialYear: { firstFinancialYear: '2032' }
      })

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
      expect(mockRequest.t).toHaveBeenCalledWith(
        'project-proposal.last_financial_year_manual.errors.before_first_year'
      )
    })

    test('saves entry to session and redirects to home', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockReturnValue({
        firstFinancialYear: { firstFinancialYear: '2032' }
      })

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          lastFinancialYear: { lastFinancialYear: '2035' }
        })
      )
      expect(result.redirect).toBe('/')
    })

    test('allows last year same as first year', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2032' }
      mockRequest.yar.get.mockReturnValue({
        firstFinancialYear: { firstFinancialYear: '2032' }
      })

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result.redirect).toBe('/')
    })

    test('allows entry when no first financial year is set', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result.redirect).toBe('/')
    })
  })
})
