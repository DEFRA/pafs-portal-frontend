import { describe, test, expect, beforeEach, vi } from 'vitest'
import { overviewController } from './controller.js'
import { PROJECT_STATUS } from '../../../common/constants/projects.js'
import {
  getBackLink,
  getProjectStateTag,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'
import { enrichProjectData } from '../helpers/overview/data-enrichment.js'
import { handleServiceConsumptionError } from '../helpers/project-submission.js'

// Mock dependencies
vi.mock('../helpers/project-utils.js', () => ({
  getBackLink: vi.fn(),
  formatDate: vi.fn(),
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
})
