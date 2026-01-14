import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { firstFinancialYearController } from './controller.js'

describe('#firstFinancialYearController', () => {
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
    test('renders first financial year page with 6 options', async () => {
      await firstFinancialYearController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.financialYearOptions).toHaveLength(6)
      expect(context.financialYearOptions[0]).toEqual(
        expect.objectContaining({
          value: '2025',
          text: 'April 2025 to March 2026'
        })
      )
    })

    test('builds the after March link using year 2031', async () => {
      await firstFinancialYearController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'project-proposal.first_financial_year.after_march_link',
        expect.objectContaining({ afterMarchYear: 2031 })
      )
    })

    test('shows saved selection if present in session', async () => {
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' },
        firstFinancialYear: { firstFinancialYear: '2027' }
      })

      await firstFinancialYearController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/first-financial-year/index'
        ),
        expect.objectContaining({
          values: { firstFinancialYear: '2027' }
        })
      )
    })
  })

  describe('POST', () => {
    test('shows error when no option selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}

      const result = await firstFinancialYearController.handler(
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

    test('saves selection to session and redirects', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { firstFinancialYear: '2028' }
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' }
      })

      const result = await firstFinancialYearController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          firstFinancialYear: { firstFinancialYear: '2028' }
        })
      )
      expect(result.redirect).toBe('/project-proposal/last-financial-year')
    })
  })
})
