import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  requireProjectName,
  requireProjectType,
  requireInterventionType,
  requireFirstFinancialYear
} from './proposal-guard.js'
import { ROUTES } from '../../../common/constants/routes.js'

describe('Project Proposal Guards', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      yar: {
        get: vi.fn(() => ({}))
      }
    }

    mockH = {
      redirect: vi.fn((url) => ({
        url,
        takeover: vi.fn().mockReturnThis()
      })),
      continue: Symbol('continue')
    }
  })

  describe('#requireProjectName', () => {
    test('Should allow access when project name exists in session', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' }
      })

      const result = requireProjectName.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should redirect to project-name when projectName is missing', () => {
      mockRequest.yar.get.mockReturnValue({})

      requireProjectName.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect when session data is null', () => {
      mockRequest.yar.get.mockReturnValue(null)

      requireProjectName.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect when session data is undefined', () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      requireProjectName.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect when projectName object exists but projectName value is empty', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: '' }
      })

      requireProjectName.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect when projectName object exists but projectName value is null', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: null }
      })

      requireProjectName.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })
  })

  describe('#requireProjectType', () => {
    test('Should allow access when both project name and type exist', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'DEF' }
      })

      const result = requireProjectType.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should redirect to project-name when projectName is missing', () => {
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' }
      })

      requireProjectType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect to project-type when projectName exists but projectType is missing', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' }
      })

      requireProjectType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })

    test('Should redirect to project-name when session is empty', () => {
      mockRequest.yar.get.mockReturnValue({})

      requireProjectType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect to project-name when session is null', () => {
      mockRequest.yar.get.mockReturnValue(null)

      requireProjectType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect when projectType value is empty string', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: '' }
      })

      requireProjectType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })
  })

  describe('#requireInterventionType', () => {
    test('Should allow access when all prerequisites are met for DEF project', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      const result = requireInterventionType.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should allow access when all prerequisites are met for REP project', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'REP' },
        interventionTypes: { interventionTypes: ['pfr'] }
      })

      const result = requireInterventionType.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should allow access when all prerequisites are met for REF project', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'REF' },
        interventionTypes: { interventionTypes: ['other'] }
      })

      const result = requireInterventionType.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should redirect to project-name when projectName is missing', () => {
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should redirect to project-type when projectType is missing', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })

    test('Should redirect to project-type when projectType is not DEF, REP, or REF', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'HCR' },
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })

    test('Should redirect to project-type for STR project type', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'STR' },
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })

    test('Should redirect to intervention-type when interventionTypes is missing', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'DEF' }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE
      )
    })

    test('Should redirect to intervention-type when interventionTypes is empty array', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: [] }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE
      )
    })

    test('Should redirect to intervention-type when interventionTypes is null', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'DEF' },
        interventionTypes: { interventionTypes: null }
      })

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE
      )
    })

    test('Should redirect to project-name when session is empty', () => {
      mockRequest.yar.get.mockReturnValue({})

      requireInterventionType.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should prioritize project name check before project type check', () => {
      mockRequest.yar.get.mockReturnValue({})

      requireInterventionType.method(mockRequest, mockH)

      // Should redirect to PROJECT_NAME first, not PROJECT_TYPE
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
      )
    })

    test('Should check project type validity before checking intervention types', () => {
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project' },
        projectType: { projectType: 'STU' }
        // interventionTypes intentionally missing
      })

      requireInterventionType.method(mockRequest, mockH)

      // Should redirect to PROJECT_TYPE due to invalid type, not INTERVENTION_TYPE
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })
  })

  describe('#requireFirstFinancialYear', () => {
    test('Should allow access when first financial year exists in session', () => {
      mockRequest.yar.get.mockReturnValue({
        firstFinancialYear: { firstFinancialYear: '2024-2025' }
      })

      const result = requireFirstFinancialYear.method(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('Should redirect when first financial year is missing', () => {
      mockRequest.yar.get.mockReturnValue({})

      requireFirstFinancialYear.method(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR
      )
    })
  })
})
