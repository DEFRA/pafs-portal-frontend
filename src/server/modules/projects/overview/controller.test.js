import { describe, test, expect, beforeEach, vi } from 'vitest'
import { overviewController } from './controller.js'
import { PROJECT_STATUS } from '../../../common/constants/projects.js'
import { getSessionData, getBackLink } from '../helpers/project-utils.js'
import { enrichProjectData } from '../helpers/overview/data-enrichment.js'
import { handleServiceConsumptionError } from '../helpers/project-submission.js'

// Mock dependencies
vi.mock('../helpers/project-utils.js', () => ({
  getSessionData: vi.fn(),
  getBackLink: vi.fn(),
  formatDate: vi.fn(),
  buildFinancialYearLabel: vi.fn(),
  formatFileSize: vi.fn()
}))

vi.mock('../helpers/overview/data-enrichment.js')
vi.mock('../helpers/project-submission.js')

describe('OverviewController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn()
    }

    getBackLink.mockReturnValue({
      href: '/projects/home',
      text: 'Back'
    })

    getSessionData.mockReturnValue({
      id: 1,
      referenceNumber: 'REF123',
      name: 'Test Project',
      projectState: PROJECT_STATUS.DRAFT
    })

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

    test('should include project data from session', async () => {
      const projectData = {
        id: 1,
        referenceNumber: 'REF123',
        name: 'Test Project',
        projectState: PROJECT_STATUS.DRAFT,
        areaId: 5
      }
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

    test('should set light blue tag for DRAFT status', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--light-blue'
        })
      )
    })

    test('should set grey tag for non-DRAFT status', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.SUBMITTED
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set grey tag for APPROVED status', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.APPROVED
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
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
      getSessionData.mockReturnValue({
        id: 1,
        referenceNumber: 'REF123'
        // no projectState
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should handle null project state', async () => {
      getSessionData.mockReturnValue({
        id: 1,
        referenceNumber: 'REF123',
        projectState: null
      })

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
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--light-blue')
    })

    test('should return grey for SUBMITTED', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.SUBMITTED
      })

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for APPROVED', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.APPROVED
      })

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for REJECTED', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.REJECTED
      })

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for undefined status', async () => {
      getSessionData.mockReturnValue({
        projectState: undefined
      })

      await overviewController.getHandler(mockRequest, mockH)

      const call = mockH.view.mock.calls[0]
      expect(call[1].projectStateTag).toBe('govuk-tag--grey')
    })

    test('should return grey for unknown status', async () => {
      getSessionData.mockReturnValue({
        projectState: 'UNKNOWN_STATUS'
      })

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
