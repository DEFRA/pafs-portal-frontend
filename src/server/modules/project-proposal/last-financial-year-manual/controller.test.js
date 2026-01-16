import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { lastFinancialYearManualController } from './controller.js'
import * as projectProposalService from '../../../common/services/project-proposal/project-proposal-service.js'

vi.mock('../../../common/services/project-proposal/project-proposal-service.js')

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
      auth: {
        credentials: {
          accessToken: 'test-token-123'
        }
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

    // Mock the createProjectProposal function to resolve successfully
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
      // Session should be cleared after successful submission
      expect(mockRequest.yar.set).toHaveBeenCalledWith('projectProposal', {})
      expect(result.redirect).toBe('/project-overview/ANC501E/000A/001A')
      expect(projectProposalService.createProjectProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          projectEndFinancialYear: '2035'
        }),
        'test-token-123'
      )
    })

    test('allows last year same as first year', async () => {
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

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result.redirect).toBe('/project-overview/ANC501E/000A/001A')
    })

    test('allows entry when no first financial year is set', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { lastFinancialYear: '2035' }
      mockRequest.yar.get.mockImplementation((key) => {
        if (key === 'projectProposal') {
          return {
            projectName: { projectName: 'Test Project' },
            projectType: { projectType: 'DEF' },
            interventionTypes: { interventionTypes: [] },
            primaryInterventionType: { primaryInterventionType: null },
            rmaSelection: { rmaSelection: '1' }
          }
        }
        if (key === 'auth') {
          return { accessToken: 'test-token-123' }
        }
        return {}
      })

      const result = await lastFinancialYearManualController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result.redirect).toBe('/project-overview/ANC501E/000A/001A')
    })
  })
})
