import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getAreaDetailsForProposal,
  buildProposalDataForSubmission,
  buildProjectOverviewUrlForProposal,
  submitProposalToBackend,
  logProposalSuccess,
  logAreaDetailsError,
  logProposalError,
  renderProposalError
} from './proposal-submission-helper.js'
import * as rfccHelper from './rfcc-helper.js'
import * as projectProposalService from '../../../common/services/project-proposal/project-proposal-service.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

vi.mock('./rfcc-helper.js')
vi.mock('../../../common/services/project-proposal/project-proposal-service.js')

describe('proposal-submission-helper', () => {
  describe('getAreaDetailsForProposal', () => {
    test('retrieves area details from cache', async () => {
      const mockRequest = {
        getAreas: vi.fn(async () => ({
          PSO: [{ id: '2', name: 'PSO Area', sub_type: 'AN' }],
          RMA: [{ id: '1', name: 'RMA Area' }]
        }))
      }

      const mockSessionData = {
        rmaSelection: { rmaSelection: '1' }
      }

      rfccHelper.getRfccCodeFromArea.mockReturnValue('AN')

      const result = await getAreaDetailsForProposal(
        mockRequest,
        mockSessionData
      )

      expect(result).toEqual({
        rfccCode: 'AN',
        rmaName: '1',
        rmaSelection: '1'
      })
      expect(mockRequest.getAreas).toHaveBeenCalled()
      expect(rfccHelper.getRfccCodeFromArea).toHaveBeenCalledWith(
        '1',
        expect.any(Object)
      )
    })
  })

  describe('buildProposalDataForSubmission', () => {
    test('builds proposal data object from session and values', () => {
      const sessionData = {
        projectName: { projectName: 'Test Project' },
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: ['TYPE_1', 'TYPE_2'] },
        primaryInterventionType: { primaryInterventionType: 'TYPE_1' },
        firstFinancialYear: { firstFinancialYear: '2025' }
      }

      const values = { lastFinancialYear: '2030' }

      const result = buildProposalDataForSubmission(
        sessionData,
        values,
        'RMA Area',
        'AN'
      )

      expect(result).toEqual({
        name: 'Test Project',
        projectType: 'DEF',
        projectIntervesionTypes: ['TYPE_1', 'TYPE_2'],
        mainIntervensionType: 'TYPE_1',
        projectStartFinancialYear: '2025',
        projectEndFinancialYear: '2030',
        rmaName: 'RMA Area',
        rfccCode: 'AN'
      })
    })

    test('handles missing intervention types', () => {
      const sessionData = {
        projectName: { projectName: 'Test' },
        projectType: { projectType: 'DEF' },
        firstFinancialYear: { firstFinancialYear: '2025' }
      }

      const result = buildProposalDataForSubmission(
        sessionData,
        { lastFinancialYear: '2030' },
        'RMA',
        'AN'
      )

      expect(result.projectIntervesionTypes).toEqual([])
      expect(result.mainIntervensionType).toBeNull()
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
        name: 'Test Project',
        projectType: 'DEF'
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
            reference_number: 'ANC501E/000A/001A',
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
})
