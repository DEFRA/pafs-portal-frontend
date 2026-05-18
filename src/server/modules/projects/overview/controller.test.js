import { describe, test, expect, beforeEach, vi } from 'vitest'
import { overviewController } from './controller.js'
import {
  PROJECT_STATUS,
  PROJECT_TYPES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getSessionData,
  getBackLink,
  formatNumberWithCommas,
  getProjectStateTag,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'

import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getCarbonImpactOverviewData } from '../helpers/overview/carbon-impact.js'
import { submitProjectProposal } from '../../../common/services/project/project-service.js'
import {
  hasStaleFinancialYears,
  flushStaleFinancialYears
} from '../helpers/stale-financial-years.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

vi.mock('../helpers/project-utils.js', () => ({
  getSessionData: vi.fn(),
  getBackLink: vi.fn(),
  formatDate: vi.fn(),
  formatNumberWithCommas: vi.fn(),
  buildFinancialYearLabel: vi.fn(),
  formatFileSize: vi.fn(),
  getProjectStateTag: vi.fn(),
  isConfidenceRestrictedProjectType: vi.fn(),
  buildProcessedFundingValues: vi.fn().mockReturnValue([]),
  computeFundingSourceTotals: vi.fn().mockReturnValue({
    sourceTotals: {},
    yearTotals: [],
    grandTotal: 0
  })
}))

vi.mock('../helpers/overview/carbon-impact.js')

vi.mock('../../../common/services/project/project-service.js', () => ({
  submitProjectProposal: vi.fn(),
  getProjectProposalOverview: vi.fn(),
  upsertProjectProposal: vi.fn(),
  deleteProject: vi.fn(),
  getProjects: vi.fn(),
  updateProjectStatus: vi.fn(),
  getCarbonImpactCalc: vi.fn(),
  checkProjectNameExists: vi.fn()
}))

vi.mock('../helpers/stale-financial-years.js', () => ({
  hasStaleFinancialYears: vi.fn().mockReturnValue(false),
  flushStaleFinancialYears: vi.fn().mockResolvedValue(false)
}))

describe('OverviewController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      t: vi.fn((key) => key),
      yar: { flash: vi.fn().mockReturnValue([]) },
      metrics: { counter: vi.fn() }
    }

    mockH = {
      view: vi.fn()
    }

    getAuthSession.mockReturnValue({ user: {} })

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

    getSessionData.mockReturnValue({
      id: 1,
      referenceNumber: 'REF123',
      name: 'Test Project',
      projectState: PROJECT_STATUS.DRAFT
    })

    getCarbonImpactOverviewData.mockImplementation(
      async (_req, projectData) => ({
        success: true,
        projectData
      })
    )
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

    test('should set light blue tag for REVISE status', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.REVISE
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

    test('should set grey tag for ARCHIVED status', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.ARCHIVED
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set isReadOnly to true for archived projects', async () => {
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

    test('should set isReadOnly to true for submitted projects', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.SUBMITTED
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should set isReadOnly to false for draft projects', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })

    test('should set isReadOnly to false for revise projects', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.REVISE
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })

    test('should set isLegacy to true when project is legacy', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        isLegacy: true
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: true
        })
      )
    })

    test('should set isLegacy to false when project is not legacy', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        isLegacy: false
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: false
        })
      )
    })

    test('should set isLegacy to false when isLegacy field is absent', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

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

    test('still renders view when carbonResult returns null projectData', async () => {
      getCarbonImpactOverviewData.mockResolvedValue({ projectData: null })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.objectContaining({ projectData: null })
      )
    })

    test('should pass submissionSuccess to view when flash contains success message', async () => {
      mockRequest.yar.flash.mockReturnValue([
        { message: 'Your proposal has been submitted successfully' }
      ])

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          submissionSuccess: 'Your proposal has been submitted successfully'
        })
      )
    })

    test('should not set submissionSuccess when flash is empty', async () => {
      mockRequest.yar.flash.mockReturnValue([])

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.submissionSuccess).toBeUndefined()
    })

    test('should set staleFinancialYearsWarning to false when no stale years and no cleared flag', async () => {
      hasStaleFinancialYears.mockReturnValue(false)

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.staleFinancialYearsWarning).toBe(false)
    })

    test('should not flush when project is not editable', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024
      })
      hasStaleFinancialYears.mockReturnValue(true)

      await overviewController.getHandler(mockRequest, mockH)

      expect(flushStaleFinancialYears).not.toHaveBeenCalled()
    })

    test('should flush when project is in DRAFT and has stale years', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024
      })
      hasStaleFinancialYears.mockReturnValue(true)
      flushStaleFinancialYears.mockResolvedValue(true)

      await overviewController.getHandler(mockRequest, mockH)

      expect(flushStaleFinancialYears).toHaveBeenCalledWith(mockRequest)
    })

    test('should flush when project is in REVISE and has stale years', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.REVISE,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024
      })
      hasStaleFinancialYears.mockReturnValue(true)
      flushStaleFinancialYears.mockResolvedValue(true)

      await overviewController.getHandler(mockRequest, mockH)

      expect(flushStaleFinancialYears).toHaveBeenCalledWith(mockRequest)
    })

    test('should set staleFinancialYearsWarning to true when flush succeeds and years are cleared', async () => {
      const staleProjectData = {
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025
      }
      const clearedProjectData = {
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null,
        staleDataCleared: true
      }
      getSessionData
        .mockReturnValueOnce(staleProjectData)
        .mockReturnValueOnce(clearedProjectData)
      hasStaleFinancialYears.mockReturnValue(true)
      flushStaleFinancialYears.mockResolvedValue(true)

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.staleFinancialYearsWarning).toBe(true)
    })

    test('should set staleFinancialYearsWarning to false when flush fails', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024
      })
      hasStaleFinancialYears.mockReturnValue(true)
      flushStaleFinancialYears.mockResolvedValue(false)

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.staleFinancialYearsWarning).toBe(false)
    })

    test('should show warning on subsequent loads when years still null (AC3 persistence)', async () => {
      // Simulates a reload after flush: no stale years detected (they’re null),
      // but the DB field staleDataCleared is true (persisted by the flush API call).
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null,
        staleDataCleared: true
      })
      hasStaleFinancialYears.mockReturnValue(false)

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.staleFinancialYearsWarning).toBe(true)
    })

    test('should hide warning once financial years are re-entered (AC3 persistence)', async () => {
      // Both years are re-entered — warning should no longer show
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2027,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2029,
        staleDataCleared: true
      })
      hasStaleFinancialYears.mockReturnValue(false)

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(viewData.staleFinancialYearsWarning).toBe(false)
    })

    test('should refresh projectData from session after successful flush', async () => {
      const staleProjectData = {
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024
      }
      const freshProjectData = {
        projectState: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null
      }
      getSessionData
        .mockReturnValueOnce(staleProjectData)
        .mockReturnValueOnce(freshProjectData)
      hasStaleFinancialYears.mockReturnValue(true)
      flushStaleFinancialYears.mockResolvedValue(true)
      getCarbonImpactOverviewData.mockImplementation(
        async (_req, projectData) => ({ success: true, projectData })
      )

      await overviewController.getHandler(mockRequest, mockH)

      const [, viewData] = mockH.view.mock.calls[0]
      expect(
        viewData.projectData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]
      ).toBeNull()
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

    test('should return grey for ARCHIVED', async () => {
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.ARCHIVED
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

  describe('EA user access', () => {
    test('should set isReadOnly to true for EA user with DRAFT state', async () => {
      getAuthSession.mockReturnValue({ user: { isEa: true } })
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should set isReadOnly to true for EA user with REVISE state', async () => {
      getAuthSession.mockReturnValue({ user: { isEa: true } })
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.REVISE
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: true
        })
      )
    })

    test('should set isReadOnly to false for non-EA user with DRAFT state', async () => {
      getAuthSession.mockReturnValue({ user: { isEa: false } })
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })

    test('should set isReadOnly to false for user without isEa flag with DRAFT state', async () => {
      getAuthSession.mockReturnValue({ user: {} })
      getSessionData.mockReturnValue({
        projectState: PROJECT_STATUS.DRAFT
      })

      await overviewController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isReadOnly: false
        })
      )
    })
  })

  describe('post', () => {
    beforeEach(() => {
      getSessionData.mockReturnValue({
        id: 1,
        slug: 'LCR-123-456',
        referenceNumber: 'LCR/123/456',
        projectState: PROJECT_STATUS.DRAFT
      })
      getAuthSession.mockReturnValue({
        user: {},
        accessToken: 'test-token'
      })
      mockH.redirect = vi.fn()
      mockRequest.yar = { flash: vi.fn() }
    })

    test('redirects to overview on successful submission', async () => {
      submitProjectProposal.mockResolvedValue({ success: true })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('LCR-123-456')
      )
    })

    test('flashes success message on successful submission', async () => {
      submitProjectProposal.mockResolvedValue({ success: true })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        'success',
        expect.objectContaining({ message: expect.any(String) })
      )
    })

    test('calls submitProjectProposal with slug and access token', async () => {
      submitProjectProposal.mockResolvedValue({ success: true })
      await overviewController.postHandler(mockRequest, mockH)
      expect(submitProjectProposal).toHaveBeenCalledWith(
        'LCR-123-456',
        'test-token'
      )
    })

    test('calls submitProjectProposal with empty string when no access token', async () => {
      getAuthSession.mockReturnValue({ user: {} })
      submitProjectProposal.mockResolvedValue({ success: true })
      await overviewController.postHandler(mockRequest, mockH)
      expect(submitProjectProposal).toHaveBeenCalledWith('LCR-123-456', '')
    })

    test('records proposalSubmission success metric on successful submission', async () => {
      submitProjectProposal.mockResolvedValue({ success: true })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockRequest.metrics.counter).toHaveBeenCalledWith(
        'proposalSubmission',
        1,
        { outcome: 'success' }
      )
    })

    test('records proposalSubmission error metric on failed submission', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [{ errorCode: 'SUBMISSION_GOALS_INCOMPLETE' }],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockRequest.metrics.counter).toHaveBeenCalledWith(
        'proposalSubmission',
        1,
        { outcome: 'error' }
      )
    })

    test('renders overview view with submissionErrorList on failure with validationErrors', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [
          { errorCode: 'SUBMISSION_GOALS_INCOMPLETE' },
          { errorCode: 'SUBMISSION_CARBON_INCOMPLETE' }
        ],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          submissionErrorList: expect.arrayContaining([
            expect.objectContaining({ href: '#section-goals' }),
            expect.objectContaining({ href: '#section-carbon' })
          ])
        })
      )
    })

    test('submissionErrors map contains inline section messages', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [{ errorCode: 'SUBMISSION_URGENCY_INCOMPLETE' }],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrors['section-urgency']).toBeDefined()
    })

    test('renders general error when errors array is populated', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: null,
        errors: [{ errorCode: 'NOT_ALLOWED_TO_SUBMIT' }]
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrors.general).toBeDefined()
    })

    test('renders fallback error when errorCode is unrecognised', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: null,
        errors: [{ errorCode: 'SOME_UNKNOWN_CODE' }]
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrors.general).toBeDefined()
    })

    test('renders PROJECT_NOT_DRAFT general error correctly', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: null,
        errors: [{ errorCode: 'PROJECT_NOT_DRAFT' }]
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrors.general).toBeDefined()
    })

    test('deduplicates section errors — only first error per sectionId shown', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [
          { errorCode: 'SUBMISSION_PROJECT_TYPE_INCOMPLETE' },
          { errorCode: 'SUBMISSION_PROJECT_TYPE_BASIC_INCOMPLETE' },
          { errorCode: 'SUBMISSION_FINANCIAL_START_YEAR_INCOMPLETE' }
        ],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      // All three map to section-proposal-details — only one inline message shown
      const inlineMsgs = Object.keys(viewData.submissionErrors).filter(
        (k) => k === 'section-proposal-details'
      )
      expect(inlineMsgs).toHaveLength(1)
    })

    test('submissionErrorList href links to correct section id', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [{ errorCode: 'SUBMISSION_BENEFIT_AREA_INCOMPLETE' }],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      const item = viewData.submissionErrorList.find(
        (e) => e.href === '#section-benefit-area'
      )
      expect(item).toBeDefined()
    })

    test('maps SUBMISSION_FINANCIAL_END_YEAR_NOT_AFTER_START to section-proposal-details', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [
          { errorCode: 'SUBMISSION_FINANCIAL_END_YEAR_NOT_AFTER_START' }
        ],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(
        viewData.submissionErrors['section-proposal-details']
      ).toBeDefined()
      expect(
        viewData.submissionErrorList.find(
          (e) => e.href === '#section-proposal-details'
        )
      ).toBeDefined()
    })

    test('passes project data through to the view on failure', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ projectData: expect.any(Object) })
      )
    })

    test('renders overview view template on failure', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.any(Object)
      )
    })

    test('unknown validationError codes are silently ignored', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [{ errorCode: 'TOTALLY_UNKNOWN' }],
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrorList).toHaveLength(0)
    })

    test('renders view with empty errors when validationErrors is null and no general error', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: null,
        errors: null
      })
      await overviewController.postHandler(mockRequest, mockH)
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.submissionErrorList).toHaveLength(0)
      expect(viewData.submissionErrors).toEqual({})
    })

    test('still renders view when carbonResult returns null projectData on failure', async () => {
      submitProjectProposal.mockResolvedValue({
        success: false,
        validationErrors: [],
        errors: null
      })
      getCarbonImpactOverviewData.mockResolvedValue({ projectData: null })
      await overviewController.postHandler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/overview/index',
        expect.objectContaining({ projectData: null })
      )
    })
  })
})
