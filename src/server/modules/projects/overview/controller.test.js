import { describe, test, expect, beforeEach, vi } from 'vitest'
import { overviewController } from './controller.js'
import {
  PROJECT_STATUS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getBackLink,
  formatNumberWithCommas,
  getProjectStateTag,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'
import { enrichProjectData } from '../helpers/overview/data-enrichment.js'
import { handleServiceConsumptionError } from '../helpers/project-submission.js'

// Mock dependencies
vi.mock('../helpers/project-utils.js', () => ({
  getBackLink: vi.fn(),
  formatDate: vi.fn(),
  formatNumberWithCommas: vi.fn(),
  buildFinancialYearLabel: vi.fn(),
  formatFileSize: vi.fn(),
  getProjectStateTag: vi.fn(),
  isConfidenceRestrictedProjectType: vi.fn()
}))

vi.mock('../helpers/overview/data-enrichment.js')
vi.mock('../helpers/project-submission.js')

describe('OverviewController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      t: vi.fn((key) => key),
      pre: {
        projectData: {
          id: 1,
          referenceNumber: 'REF123',
          name: 'Test Project',
          projectState: PROJECT_STATUS.DRAFT
        }
      }
    }

    mockH = {
      view: vi.fn()
    }

    getBackLink.mockReturnValue({
      href: '/projects/home',
      text: 'Back'
    })

    getProjectStateTag.mockImplementation((status) => {
      if (status === PROJECT_STATUS.DRAFT || status === PROJECT_STATUS.REVISE) {
        return 'govuk-tag--light-blue'
      }
      return 'govuk-tag--grey'
    })

    isConfidenceRestrictedProjectType.mockReturnValue(false)

    enrichProjectData.mockResolvedValue({
      success: true,
      projectData: {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project',
        projectState: PROJECT_STATUS.DRAFT
      }
    })

    handleServiceConsumptionError.mockReturnValue({ error: true })
  })

  describe('get', () => {
    test('should render overview view with correct data', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.objectContaining({
          pageTitle: 'projects.overview.heading',
          backLinkURL: '/projects/home',
          backLinkText: 'Back'
        })
      )
    })

    test('should include project data from request.pre', async () => {
      const projectData = {
        id: 2,
        referenceNumber: 'REF456',
        name: 'Another Project',
        projectState: PROJECT_STATUS.REVISE,
        areaId: 10
      }
      mockRequest.pre.projectData = projectData

      enrichProjectData.mockResolvedValue({
        success: true,
        projectData
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectData
        })
      )
    })

    test('should handle missing projectData in request.pre', async () => {
      delete mockRequest.pre.projectData
      const result = await overviewController.getHandler(mockRequest, mockH)
      expect(mockH.view).not.toHaveBeenCalled()
      expect(result).toEqual({ error: true })
    })

    test('should set light blue tag for DRAFT status', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.DRAFT }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--light-blue'
        })
      )
    })

    test('should set light blue tag for REVISE status', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.REVISE }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--light-blue'
        })
      )
    })

    test('should set grey tag for non-DRAFT status', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.SUBMITTED }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set grey tag for APPROVED status', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.APPROVED }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set grey tag for ARCHIVED status', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.ARCHIVED }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set isReadOnly to true for archived projects', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.ARCHIVED }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should set isReadOnly to true for submitted projects', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.SUBMITTED }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should set isReadOnly to false for draft projects', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.DRAFT }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })

    test('should set isReadOnly to false for revise projects', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.REVISE }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })

    test('should set isLegacy to true when project is legacy', async () => {
      mockRequest.pre.projectData = {
        projectState: PROJECT_STATUS.DRAFT,
        isLegacy: true
      }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: true
        })
      )
    })

    test('should set isLegacy to false when project is not legacy', async () => {
      mockRequest.pre.projectData = {
        projectState: PROJECT_STATUS.DRAFT,
        isLegacy: false
      }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: false
        })
      )
    })

    test('should set isLegacy to false when isLegacy field is absent', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.DRAFT }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: false
        })
      )
    })

    test('should include empty fieldErrors', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fieldErrors: {}
        })
      )
    })

    test('should include empty errorCode', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCode: ''
        })
      )
    })

    test('should include full width column setting', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          columnWidth: 'full'
        })
      )
    })

    test('should include PROJECT_TYPES constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PROJECT_TYPES: expect.any(Object)
        })
      )
    })

    test('should include PROJECT_INTERVENTION_TYPES constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PROJECT_INTERVENTION_TYPES: expect.any(Object)
        })
      )
    })

    test('should include PROJECT_PAYLOAD_FIELDS constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PROJECT_PAYLOAD_FIELDS: expect.any(Object)
        })
      )
    })

    test('should include PROJECT_STEPS constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PROJECT_STEPS: expect.any(Object)
        })
      )
    })

    test('should include ERROR_CODES constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ERROR_CODES: expect.any(Object)
        })
      )
    })

    test('should include buildFinancialYearLabel function', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          buildFinancialYearLabel: expect.any(Function)
        })
      )
    })

    test('should include formatDate function', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          formatDate: expect.any(Function)
        })
      )
    })

    test('should translate page title', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith('projects.overview.heading')
    })

    test('should call getBackLink', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(getBackLink).toHaveBeenCalled()
    })

    test('should call getBackLink with PROJECT.HOME target', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(getBackLink).toHaveBeenCalledWith(mockRequest, {
        targetURL: ROUTES.PROJECT.HOME
      })
    })

    test('should call isConfidenceRestrictedProjectType with project type from session', async () => {
      getSessionData.mockReturnValue({
        id: 1,
        referenceNumber: 'REF123',
        projectState: PROJECT_STATUS.DRAFT,
        projectType: 'STR'
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(isConfidenceRestrictedProjectType).toHaveBeenCalledWith('STR')
    })

    test('should set isConfidenceRestricted true when project type is restricted', async () => {
      isConfidenceRestrictedProjectType.mockReturnValue(true)

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isConfidenceRestricted: true
        })
      )
    })

    test('should include formatNumberWithCommas function in view data', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          formatNumberWithCommas
        })
      )
    })

    test('should handle missing project state gracefully', async () => {
      mockRequest.pre.projectData = { id: 1, referenceNumber: 'REF123' }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should handle null project state', async () => {
      mockRequest.pre.projectData = {
        id: 1,
        referenceNumber: 'REF123',
        projectState: null
      }

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })
  })

  describe('_getProjectStateTag (internal method)', () => {
    test('should return light blue for DRAFT', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.DRAFT }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--light-blue')
    })

    test('should return grey for SUBMITTED', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.SUBMITTED }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for APPROVED', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.APPROVED }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for REJECTED', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.REJECTED }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for ARCHIVED', async () => {
      mockRequest.pre.projectData = { projectState: PROJECT_STATUS.ARCHIVED }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for undefined status', async () => {
      mockRequest.pre.projectData = { projectState: undefined }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for unknown status', async () => {
      mockRequest.pre.projectData = { projectState: 'UNKNOWN_STATUS' }

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })
  })

  describe('data enrichment', () => {
    test('should call enrichProjectData with getBenefitAreaDownloadData', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(enrichProjectData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          id: 1,
          referenceNumber: 'REF123'
        }),
        expect.arrayContaining([expect.any(Function)])
      )
    })

    test('should use enriched project data in view', async () => {
      const enrichedData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project',
        benefitAreaFileDownloadUrl: 'https://example.com/download'
      }

      enrichProjectData.mockResolvedValue({
        success: true,
        projectData: enrichedData
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.objectContaining({
          projectData: enrichedData
        })
      )
    })

    test('should handle enrichment failure', async () => {
      enrichProjectData.mockResolvedValue({
        success: false,
        projectData: {
          id: 1,
          referenceNumber: 'REF123'
        },
        error: 'ENRICHMENT_FAILED'
      })

      handleServiceConsumptionError.mockReturnValue({ errorView: true })

      const result = await overviewController.getHandler(mockRequest, mockH)

      expect(handleServiceConsumptionError).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        'ENRICHMENT_FAILED',
        expect.objectContaining({
          pageTitle: 'projects.overview.heading'
        }),
        'modules/projects/overview/index'
      )
      expect(result).toEqual({ errorView: true })
    })
  })

  describe('_handleOverviewResponse', () => {
    test('should render overview view when success is true', async () => {
      const viewData = { id: 1, name: 'Test' }

      // We test this indirectly through the get handler
      enrichProjectData.mockResolvedValue({
        success: true,
        projectData: viewData
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.any(Object)
      )
    })

    test('should call handleServiceConsumptionError when success is false', async () => {
      enrichProjectData.mockResolvedValue({
        success: false,
        projectData: {},
        error: 'SERVICE_ERROR'
      })

      const mockResponse = { errorHandled: true }
      handleServiceConsumptionError.mockReturnValue(mockResponse)

      const result = await overviewController.getHandler(mockRequest, mockH)

      expect(handleServiceConsumptionError).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    test('should pass view template constant to handleServiceConsumptionError', async () => {
      enrichProjectData.mockResolvedValue({
        success: false,
        error: 'ERROR'
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(handleServiceConsumptionError).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        'ERROR',
        expect.any(Object),
        'modules/projects/overview/index'
      )
    })
  })

  describe('_getProjectViewData', () => {
    test('should include all required constants in view data', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          PROJECT_TYPES: expect.any(Object),
          PROJECT_INTERVENTION_TYPES: expect.any(Object),
          PROJECT_RISK_TYPES: expect.any(Object),
          PROJECT_PAYLOAD_FIELDS: expect.any(Object),
          PROJECT_STEPS: expect.any(Object),
          URGENCY_REASONS: expect.any(Object),
          CONFIDENCE_LEVELS: expect.any(Object),
          NFM_MEASURES: expect.any(Object),
          NFM_LANDOWNER_CONSENT_OPTIONS: expect.any(Object),
          NFM_EXPERIENCE_LEVEL_OPTIONS: expect.any(Object)
        })
      )
    })

    test('should include all formatting functions in view data', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          buildFinancialYearLabel: expect.any(Function),
          formatDate: expect.any(Function),
          formatNumberWithCommas: expect.any(Function),
          formatFileSize: expect.any(Function)
        })
      )
    })

    test('should set isReadOnly based on project state', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.ARCHIVED
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should call isConfidenceRestrictedProjectType with project type', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        projectType: PROJECT_TYPES.ELO
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(isConfidenceRestrictedProjectType).toHaveBeenCalledWith(
        PROJECT_TYPES.ELO
      )
    })

    test('should include project data in view', async () => {
      const projectData = { id: 1, name: 'Project A' }
      getSessionData.mockReturnValue(projectData)

      enrichProjectData.mockResolvedValue({
        success: true,
        projectData
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectData
        })
      )
    })

    test('should include page title from translation', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          pageTitle: 'projects.overview.heading'
        })
      )
    })

    test('should include back link from getBackLink function', async () => {
      const backLink = { href: '/back', text: 'Back' }
      getBackLink.mockReturnValue(backLink)

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          backLinkURL: '/back',
          backLinkText: 'Back'
        })
      )
    })

    test('should set columnWidth to full', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          columnWidth: 'full'
        })
      )
    })

    test('should include ERROR_CODES constant', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ERROR_CODES: expect.any(Object)
        })
      )
    })
  })

  describe('enrichProjectData integration', () => {
    test('should pass enrichment functions to enrichProjectData', async () => {
      await overviewController.getHandler(mockRequest, mockH)

      const enrichmentCall = enrichProjectData.mock.calls[0]
      expect(enrichmentCall[2]).toEqual(
        expect.arrayContaining([expect.any(Function)])
      )
    })

    test('should update projectData with enrichment results', async () => {
      const originalData = { id: 1, name: 'Original' }
      const enrichedData = {
        id: 1,
        name: 'Original',
        enrichedField: 'enriched value'
      }

      getSessionData.mockReturnValue(originalData)
      enrichProjectData.mockResolvedValue({
        success: true,
        projectData: enrichedData
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectData: enrichedData
        })
      )
    })

    test('should call enrichProjectData with request and session data', async () => {
      const sessionData = { id: 1, name: 'Test' }
      getSessionData.mockReturnValue(sessionData)

      await overviewController.getHandler(mockRequest, mockH)

      expect(enrichProjectData).toHaveBeenCalledWith(
        mockRequest,
        sessionData,
        expect.any(Array)
      )
    })
  })

  describe('error handling', () => {
    test('should handle enrichment errors', async () => {
      enrichProjectData.mockResolvedValue({
        success: false,
        error: 'FAILED_TO_ENRICH'
      })

      const errorResponse = { handled: true }
      handleServiceConsumptionError.mockReturnValue(errorResponse)

      const result = await overviewController.getHandler(mockRequest, mockH)

      expect(result).toEqual(errorResponse)
      expect(handleServiceConsumptionError).toHaveBeenCalled()
    })

    test('should include viewData in error response', async () => {
      enrichProjectData.mockResolvedValue({
        success: false,
        error: 'ERROR'
      })

      await overviewController.getHandler(mockRequest, mockH)

      const errorCall = handleServiceConsumptionError.mock.calls[0]
      expect(errorCall[3]).toEqual(
        expect.objectContaining({
          pageTitle: 'projects.overview.heading'
        })
      )
    })
  })
})
