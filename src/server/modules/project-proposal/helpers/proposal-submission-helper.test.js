import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getAreaDetailsForProposal,
  buildProposalDataForSubmission,
  buildProjectOverviewUrlForProposal,
  submitProposalToBackend,
  logProposalSuccess,
  logAreaDetailsError,
  logProposalError,
  renderProposalError,
  clearProposalSession
} from './proposal-submission-helper.js'
import * as projectProposalService from '../../../common/services/project-proposal/project-proposal-service.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

vi.mock('../../../common/services/project-proposal/project-proposal-service.js')

describe('proposal-submission-helper', () => {
  describe('getAreaDetailsForProposal', () => {
    test('retrieves area id from session', () => {
      const mockSessionData = {
        rmaSelection: { rmaSelection: '1' }
      }

      const result = getAreaDetailsForProposal(mockSessionData)

      expect(result).toEqual({
        rmaId: 1,
        rmaSelection: '1'
      })
    })
  })

  describe('buildProposalDataForSubmission', () => {
    test('builds proposal data object from session and values for DEF project type', () => {
      const sessionData = {
        projectName: { projectName: 'Test Project' },
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: ['type_1', 'type_2'] },
        primaryInterventionType: { primaryInterventionType: 'type_1' },
        firstFinancialYear: { firstFinancialYear: '2025' }
      }

      const values = { lastFinancialYear: '2030' }

      const result = buildProposalDataForSubmission(sessionData, values, 10)

      expect(result).toEqual({
        level: 'INITIAL_SAVE',
        payload: {
          name: 'Test Project',
          rmaId: '10',
          projectType: 'DEF',
          projectInterventionTypes: ['TYPE_1', 'TYPE_2'],
          mainInterventionType: 'TYPE_1',
          financialStartYear: 2025,
          financialEndYear: 2030
        }
      })
    })

    test('excludes intervention types for non-DEF/REP/REF project types', () => {
      const sessionData = {
        projectName: { projectName: 'Test' },
        projectType: { projectType: 'STR' },
        interventionTypes: { interventionTypes: ['type_1'] },
        primaryInterventionType: { primaryInterventionType: 'type_1' },
        firstFinancialYear: { firstFinancialYear: '2025' }
      }

      const result = buildProposalDataForSubmission(
        sessionData,
        { lastFinancialYear: '2030' },
        5
      )

      expect(result).toEqual({
        level: 'INITIAL_SAVE',
        payload: {
          name: 'Test',
          rmaId: '5',
          projectType: 'STR',
          financialStartYear: 2025,
          financialEndYear: 2030
        }
      })
      expect(result.payload.projectInterventionTypes).toBeUndefined()
      expect(result.payload.mainInterventionType).toBeUndefined()
    })

    test('handles missing intervention types for DEF project type', () => {
      const sessionData = {
        projectName: { projectName: 'Test' },
        projectType: { projectType: 'DEF' },
        firstFinancialYear: { firstFinancialYear: '2025' }
      }

      const result = buildProposalDataForSubmission(
        sessionData,
        {
          lastFinancialYear: '2030'
        },
        5
      )

      expect(result.payload.projectInterventionTypes).toEqual([])
      expect(result.payload.mainInterventionType).toBeNull()
      expect(result.payload.financialStartYear).toBe(2025)
      expect(result.payload.financialEndYear).toBe(2030)
    })
  })

  describe('buildProjectOverviewUrlForProposal', () => {
    test('replaces slashes with hyphens in reference number', () => {
      const referenceNumber = 'ANC501E/000A/001A'

      const result = buildProjectOverviewUrlForProposal(referenceNumber)

      expect(result).toBe(
        '/project-proposal/project-overview/ANC501E-000A-001A'
      )
    })

    test('handles reference number without slashes', () => {
      const referenceNumber = 'ANC501E-000A-001A'

      const result = buildProjectOverviewUrlForProposal(referenceNumber)

      expect(result).toBe(
        '/project-proposal/project-overview/ANC501E-000A-001A'
      )
    })
  })

  describe('submitProposalToBackend', () => {
    test('calls API with proposal data and auth token', async () => {
      const mockRequest = {
        yar: {
          get: vi.fn((key) => {
            if (key === 'auth') {
              return { accessToken: 'test-token-123' }
            }
            return {}
          })
        }
      }

      const proposalData = {
        level: 'INITIAL_SAVE',
        payload: { name: 'Test Project', projectType: 'DEF' }
      }

      projectProposalService.createProjectProposal.mockResolvedValue({
        success: true,
        data: { id: '1' }
      })

      const result = await submitProposalToBackend(mockRequest, proposalData)

      expect(projectProposalService.createProjectProposal).toHaveBeenCalledWith(
        proposalData,
        'test-token-123'
      )
      expect(result).toEqual({ success: true, data: { id: '1' } })
    })
  })

  describe('logProposalSuccess', () => {
    test('logs successful proposal creation', () => {
      const mockRequest = {
        server: {
          logger: {
            info: vi.fn()
          }
        }
      }

      const apiResponse = {
        data: {
          data: {
            referenceNumber: 'ANC501E/000A/001A',
            id: '123'
          }
        }
      }

      logProposalSuccess(mockRequest, apiResponse)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        {
          referenceNumber: 'ANC501E/000A/001A',
          projectId: '123'
        },
        'Project proposal created successfully'
      )
    })
  })

  describe('logAreaDetailsError', () => {
    test('logs error when RFCC code cannot be determined', () => {
      const mockRequest = {
        server: {
          logger: {
            error: vi.fn()
          }
        }
      }

      logAreaDetailsError(mockRequest, '123')

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { areaId: '123' },
        'Failed to determine RFCC code from selected area'
      )
    })
  })

  describe('logProposalError', () => {
    test('logs proposal submission error', () => {
      const mockRequest = {
        server: {
          logger: {
            error: vi.fn()
          }
        }
      }

      const apiResponse = {
        errors: [{ message: 'Server error' }],
        status: 500
      }

      logProposalError(mockRequest, apiResponse)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        {
          errors: [{ message: 'Server error' }],
          status: 500
        },
        'Failed to create project proposal'
      )
    })
  })

  describe('renderProposalError', () => {
    let mockH
    let mockCodeFn

    beforeEach(() => {
      mockCodeFn = vi.fn((status) => ({ statusCode: status }))
      mockH = {
        view: vi.fn((template, context) => ({
          template,
          context,
          code: mockCodeFn
        }))
      }
    })

    test('renders error view with correct parameters', () => {
      const mockRequest = {}
      const viewType = 'test-view'
      const values = { lastFinancialYear: '2030' }
      const errorHref = '#error'
      const message = 'Test error message'

      const result = renderProposalError(
        mockRequest,
        mockH,
        viewType,
        values,
        errorHref,
        message
      )

      expect(mockH.view).toHaveBeenCalledWith(viewType, {
        values,
        errors: { lastFinancialYear: message },
        errorSummary: [{ text: message, href: errorHref }]
      })
      expect(mockCodeFn).toHaveBeenCalledWith(statusCodes.badRequest)
      expect(result.statusCode).toBe(statusCodes.badRequest)
    })
  })

  describe('clearProposalSession', () => {
    test('clears proposal session data and logs', () => {
      const mockRequest = {
        yar: {
          set: vi.fn()
        },
        server: {
          logger: {
            info: vi.fn()
          }
        }
      }

      clearProposalSession(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('projectProposal', {})
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        'Proposal session data cleared after successful submission'
      )
    })
  })
})
