import { describe, test, expect, beforeEach, vi } from 'vitest'
import { individualDownloadsController } from './controller.js'
import {
  PROJECT_STATUS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getSessionData,
  getBackLink,
  getProjectStateTag
} from '../../projects/helpers/project-utils.js'

// Mock dependencies
vi.mock('../../projects/helpers/project-utils.js', () => ({
  getSessionData: vi.fn(),
  getBackLink: vi.fn(),
  getProjectStateTag: vi.fn()
}))

vi.mock('../../projects/helpers/overview/benefit-area.js', () => ({
  getBenefitAreaDownloadData: vi
    .fn()
    .mockImplementation((_req, projectData) =>
      Promise.resolve({ success: true, projectData })
    )
}))

vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn().mockReturnValue({ accessToken: 'mock-token' })
}))

vi.mock('../../../common/services/project/project-service.js', () => ({
  getProjectFundingCalculatorDownloadUrl: vi.fn().mockResolvedValue({
    success: true,
    data: { data: { downloadUrl: 'https://mock-s3.example.com/calc.xlsx' } }
  })
}))

describe('IndividualDownloadsController', () => {
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
      href: '/project/TEST123',
      text: 'Back to proposal overview'
    })

    getProjectStateTag.mockImplementation((status) => {
      if (status === PROJECT_STATUS.DRAFT || status === PROJECT_STATUS.REVISE) {
        return 'govuk-tag--light-blue'
      }
      return 'govuk-tag--grey'
    })
  })

  describe('get', () => {
    test('should render downloads view with correct data', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST123',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/downloads/individual/index',
        expect.objectContaining({
          pageTitle: 'projects.downloads.heading',
          backLinkURL: '/project/TEST123',
          backLinkText: 'Back to proposal overview'
        })
      )
    })

    test('should include project data from session', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST123',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        projectName: 'Test Project'
      }
      getSessionData.mockReturnValue(projectData)

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectData
        })
      )
    })

    test('should set columnWidth to two-thirds', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          columnWidth: 'two-thirds'
        })
      )
    })

    test('should call getBackLink with correct parameters', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'ABC123',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      }
      getSessionData.mockReturnValue(projectData)

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(getBackLink).toHaveBeenCalledWith(mockRequest, {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.OVERVIEW,
        params: {
          referenceNumber: 'ABC123'
        }
      })
    })
  })

  describe('_shouldShowNewTemplate - New Projects', () => {
    test('should show new template for new draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })

    test('should show new template for new submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })

    test('should show new template for new archived project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })
  })

  describe('_shouldShowNewTemplate - Legacy Projects (Not Revised)', () => {
    test('should show new template for legacy draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })

    test('should NOT show new template for legacy submitted project (not revised)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: false
        })
      )
    })

    test('should show new template for legacy archived project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })
  })

  describe('_shouldShowNewTemplate - Legacy Projects (Revised)', () => {
    test('should show new template for legacy revised draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })

    test('should show new template for legacy revised submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })

    test('should show new template for legacy revised archived project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showNewTemplate: true
        })
      )
    })
  })

  describe('_shouldShowLegacyTemplate - New Projects', () => {
    test('should NOT show legacy template for new draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: false
        })
      )
    })

    test('should NOT show legacy template for new submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: false
        })
      )
    })
  })

  describe('_shouldShowLegacyTemplate - Legacy Projects (Not Revised)', () => {
    test('should show legacy template for legacy draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: true
        })
      )
    })

    test('should show legacy template for legacy submitted project (not revised)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: true
        })
      )
    })

    test('should show legacy template for legacy archived project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: true
        })
      )
    })
  })

  describe('_shouldShowLegacyTemplate - Legacy Projects (Revised)', () => {
    test('should show legacy template for legacy revised draft project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: true
        })
      )
    })

    test('should NOT show legacy template for legacy revised submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: false
        })
      )
    })

    test('should show legacy template for legacy revised archived project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showLegacyTemplate: true
        })
      )
    })
  })

  describe('_shouldShowFundingCalculator - New Projects', () => {
    test('should NOT show funding calculator for new project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: false
        })
      )
    })
  })

  describe('_shouldShowFundingCalculator - Legacy Projects (Not Revised)', () => {
    test('should show funding calculator for legacy draft project with file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: true
        })
      )
    })

    test('should NOT show funding calculator for legacy draft project without file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: null
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: false
        })
      )
    })

    test('should show funding calculator for legacy submitted project with file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: true
        })
      )
    })

    test('should show funding calculator for legacy archived project with file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: true
        })
      )
    })
  })

  describe('_shouldShowFundingCalculator - Legacy Projects (Revised)', () => {
    test('should show funding calculator for legacy revised draft project with file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: true
        })
      )
    })

    test('should NOT show funding calculator for legacy revised submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: false
        })
      )
    })

    test('should show funding calculator for legacy revised archived project with file', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true,
        [PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]: 'calc.xlsx'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          showFundingCalculator: true
        })
      )
    })
  })

  describe('hasBenefitAreaFile', () => {
    test('should set hasBenefitAreaFile to true when benefit area file exists', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'benefit-area.zip'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          hasBenefitAreaFile: true
        })
      )
    })

    test('should set hasBenefitAreaFile to false when benefit area file does not exist', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: null
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          hasBenefitAreaFile: false
        })
      )
    })
  })

  describe('isLegacy and isRevised flags', () => {
    test('should set isLegacy to true for legacy project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: true
        })
      )
    })

    test('should set isLegacy to false for new project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isLegacy: false
        })
      )
    })

    test('should set isRevised to true for revised project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isRevised: true
        })
      )
    })

    test('should set isRevised to false for non-revised project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          isRevised: false
        })
      )
    })
  })

  describe('projectStateTag', () => {
    test('should set light blue tag for DRAFT status', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--light-blue'
        })
      )
    })

    test('should set light blue tag for REVISE status', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.REVISE,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--light-blue'
        })
      )
    })

    test('should set grey tag for SUBMITTED status', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })

    test('should set grey tag for ARCHIVED status', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.ARCHIVED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          projectStateTag: 'govuk-tag--grey'
        })
      )
    })
  })
})
