import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import * as projectProposalService from '../../../common/services/project-proposal/project-proposal-service.js'
import { createLastFinancialYearController, VIEW_TYPES } from './controller.js'

const lastFinancialYearController = createLastFinancialYearController(
  VIEW_TYPES.RADIO
)

vi.mock('../../../common/services/project-proposal/project-proposal-service.js')

describe('#lastFinancialYearController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-13T12:00:00.000Z'))

    mockRequest = {
      method: 'get',
      t: vi.fn((key, params) => {
        if (params) {
          return `${key}:${JSON.stringify(params)}`
        }
        return key
      }),
      payload: {},
      yar: {
        get: vi.fn(() => ({})),
        set: vi.fn()
      },
      getAreas: vi.fn(async () => ({
        EA: [{ id: '3', name: 'EA Area', area_type: 'EA', parent_id: null }],
        PSO: [
          {
            id: '2',
            name: 'PSO Area',
            area_type: 'PSO',
            parent_id: '3',
            sub_type: 'AN'
          }
        ],
        RMA: [
          {
            id: '1',
            name: 'RMA Area',
            area_type: 'RMA',
            parent_id: '2'
          }
        ]
      })),
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

    projectProposalService.createProjectProposal.mockResolvedValue({
      success: true,
      data: {
        success: true,
        data: {
          id: '1',
          reference_number: 'ANC501E/000A/001A'
        }
      }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('GET', () => {
    test('renders last financial year selection page', async () => {
      await lastFinancialYearController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/last-financial-year/index'
        ),
        expect.objectContaining({
          backLink: '/project-proposal/first-financial-year'
        })
      )
    })

    test('displays financial year options', async () => {
      await lastFinancialYearController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          financialYearOptions: expect.any(Array)
        })
      )
    })

    test('displays saved value from session', async () => {
      mockRequest.yar.get.mockReturnValue({
        lastFinancialYear: { lastFinancialYear: '2035' }
      })

      await lastFinancialYearController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          values: { lastFinancialYear: '2035' }
        })
      )
    })

    test('displays after march link with year', async () => {
      await lastFinancialYearController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          afterMarchLinkText: expect.stringContaining(
            'project-proposal.last_financial_year.after_march_link'
          ),
          afterMarchLinkHref: '/project-proposal/last-financial-year-manual'
        })
      )
    })
  })

  describe('POST', () => {
    test('shows error when year is not selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            firstFinancialYear: { firstFinancialYear: '2032' }
          }
        }
        return {}
      })

      const result = await lastFinancialYearController.handler(
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

    test('shows error when last year is before first year', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2030' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            firstFinancialYear: { firstFinancialYear: '2032' }
          }
        }
        return {}
      })

      const result = await lastFinancialYearController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
      expect(mockRequest.t).toHaveBeenCalledWith(
        'project-proposal.last_financial_year.errors.before_first_year'
      )
    })

    test('saves selection to session and redirects to home', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            projectName: { projectName: 'Test Project' },
            projectType: { projectType: 'DEF' },
            interventionTypes: { interventionTypes: ['TYPE_1'] },
            primaryInterventionType: { primaryInterventionType: 'MAIN' },
            firstFinancialYear: { firstFinancialYear: '2032' },
            rmaSelection: { rmaSelection: '1' }
          }
        }
        if (key === 'auth') {
          return { accessToken: 'test-token-123' }
        }
        return {}
      })

      const result = await lastFinancialYearController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          lastFinancialYear: { lastFinancialYear: '2035' }
        })
      )
      // Session should be cleared after successful submission
      expect(mockRequest.yar.set).toHaveBeenCalledWith('projectProposal', {})
      expect(result.redirect).toBe(
        '/project-proposal/project-overview/ANC501E-000A-001A'
      )
      expect(projectProposalService.createProjectProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          projectType: 'DEF',
          projectEndFinancialYear: '2035'
        }),
        'test-token-123'
      )
    })

    test('allows same year for both start and end', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2032' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            projectName: { projectName: 'Test Project' },
            projectType: { projectType: 'DEF' },
            interventionTypes: { interventionTypes: [] },
            primaryInterventionType: { primaryInterventionType: null },
            firstFinancialYear: { firstFinancialYear: '2032' },
            rmaSelection: { rmaSelection: '1' }
          }
        }
        if (key === 'auth') {
          return { accessToken: 'test-token-123' }
        }
        return {}
      })

      const result = await lastFinancialYearController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe(
        '/project-proposal/project-overview/ANC501E-000A-001A'
      )
      expect(projectProposalService.createProjectProposal).toHaveBeenCalled()
    })

    test('clears session data after successful submission', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            projectName: { projectName: 'Test Project' },
            projectType: { projectType: 'DEF' },
            interventionTypes: { interventionTypes: [] },
            primaryInterventionType: { primaryInterventionType: null },
            firstFinancialYear: { firstFinancialYear: '2032' },
            rmaSelection: { rmaSelection: '1' }
          }
        }
        if (key === 'auth') {
          return { accessToken: 'test-token-123' }
        }
        return {}
      })

      await lastFinancialYearController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('projectProposal', {})
      expect(mockRequest.yar.set).toHaveBeenCalledTimes(2)
    })

    test('handles API errors gracefully', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            projectName: { projectName: 'Test Project' },
            projectType: { projectType: 'DEF' },
            interventionTypes: { interventionTypes: [] },
            primaryInterventionType: { primaryInterventionType: null },
            firstFinancialYear: { firstFinancialYear: '2032' },
            rmaSelection: { rmaSelection: '1' }
          }
        }
        if (key === 'auth') {
          return { accessToken: 'test-token-123' }
        }
        return {}
      })

      projectProposalService.createProjectProposal.mockResolvedValue({
        success: false,
        status: 500,
        errors: [{ message: 'Server error' }]
      })

      const result = await lastFinancialYearController.handler(
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
      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: [{ message: 'Server error' }],
          status: 500
        }),
        'Failed to create project proposal'
      )
    })
  })
})
