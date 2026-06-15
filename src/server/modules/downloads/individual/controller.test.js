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

vi.mock('../helpers/moderation-helper.js', () => ({
  buildModerationResponse: vi.fn()
}))

vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

import { buildModerationResponse } from '../helpers/moderation-helper.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

describe('IndividualDownloadsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      t: vi.fn((key) => key),
      server: {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn(),
      response: vi.fn().mockReturnValue({
        code: vi.fn().mockReturnThis()
      })
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

  describe('downloadModerationHandler', () => {
    const urgentProjectData = {
      [PROJECT_PAYLOAD_FIELDS.SLUG]: 'ANC501E-000A-001A',
      [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need',
      [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
      [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
      [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
      name: 'Test Flood Project',
      rmaName: 'South Yorkshire',
      rfccName: 'Yorkshire RFCC',
      eaAreaName: 'North East',
      moderationFilename: 'ANC501E-000A-001A_moderation_BS.txt'
    }

    test('should reject non-urgent projects with 404', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'not_urgent'
      })

      await individualDownloadsController.downloadModerationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.response).toHaveBeenCalledWith('Not found')
      expect(mockH.response().code).toHaveBeenCalledWith(404)
      expect(buildModerationResponse).not.toHaveBeenCalled()
    })

    test('should reject project with no urgency reason with 404', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: null
      })

      await individualDownloadsController.downloadModerationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.response).toHaveBeenCalledWith('Not found')
      expect(buildModerationResponse).not.toHaveBeenCalled()
    })

    test('should reject project with undefined urgency reason with 404', async () => {
      getSessionData.mockReturnValue({})

      await individualDownloadsController.downloadModerationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.response).toHaveBeenCalledWith('Not found')
      expect(buildModerationResponse).not.toHaveBeenCalled()
    })

    test('should log a warning when moderation download is rejected', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'not_urgent'
      })

      await individualDownloadsController.downloadModerationHandler(
        mockRequest,
        mockH
      )

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ urgencyReason: 'not_urgent' }),
        expect.stringContaining('non-urgent')
      )
    })

    test('should call buildModerationResponse for a genuinely urgent project', async () => {
      getSessionData.mockReturnValue(urgentProjectData)
      buildModerationResponse.mockReturnValue('mock-response')

      const result =
        await individualDownloadsController.downloadModerationHandler(
          mockRequest,
          mockH
        )

      expect(buildModerationResponse).toHaveBeenCalledOnce()
      expect(result).toBe('mock-response')
    })

    test('should pass (h, projectData, logger, statusCodes) to buildModerationResponse', async () => {
      getSessionData.mockReturnValue(urgentProjectData)
      buildModerationResponse.mockReturnValue('mock-response')

      await individualDownloadsController.downloadModerationHandler(
        mockRequest,
        mockH
      )

      expect(buildModerationResponse).toHaveBeenCalledWith(
        mockH,
        urgentProjectData,
        mockRequest.server.logger,
        expect.objectContaining({
          ok: expect.any(Number),
          notFound: expect.any(Number)
        })
      )
    })

    test.each([
      ['statutory_need'],
      ['legal_need'],
      ['health_and_safety'],
      ['emergency_works'],
      ['time_limited']
    ])(
      'should call buildModerationResponse for urgencyReason "%s"',
      async (urgencyReason) => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: urgencyReason
        })
        buildModerationResponse.mockReturnValue('mock-response')

        await individualDownloadsController.downloadModerationHandler(
          mockRequest,
          mockH
        )

        expect(buildModerationResponse).toHaveBeenCalledOnce()
      }
    )
  })

  describe('_shouldShowModerationDownload', () => {
    test('should show moderation download for legacy submitted urgent project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'WXC501E-002A-005A',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ showModerationDownload: true })
      )
    })

    test('should NOT show moderation download for non-legacy urgent project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ showModerationDownload: false })
      )
    })

    test('should NOT show moderation download for legacy revised urgent submitted project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: true,
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ showModerationDownload: false })
      )
    })

    test('should NOT show moderation download for legacy draft urgent project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ showModerationDownload: false })
      )
    })

    test('should NOT show moderation download for legacy submitted non-urgent project', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false,
        [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'not_urgent'
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ showModerationDownload: false })
      )
    })
  })

  describe('downloadFcerm1LegacyHandler', () => {
    let mockResponseChain
    let localMockH

    beforeEach(() => {
      mockResponseChain = {
        code: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis()
      }
      localMockH = {
        response: vi.fn().mockReturnValue(mockResponseChain)
      }
      mockRequest.params = { referenceNumber: 'WXC501E-002A-005A' }
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    test('should return 401 when session is null', async () => {
      getAuthSession.mockReturnValue(null)

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Unauthorised')
      expect(mockResponseChain.code).toHaveBeenCalledWith(401)
    })

    test('should return 401 when accessToken is null', async () => {
      getAuthSession.mockReturnValue({ accessToken: null })

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Unauthorised')
      expect(mockResponseChain.code).toHaveBeenCalledWith(401)
    })

    test('should log warning when no access token', async () => {
      getAuthSession.mockReturnValue({ accessToken: null })

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('access token')
      )
    })

    test('should return 500 on network error', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network failure'))
      )

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith(
        'Error generating download'
      )
      expect(mockResponseChain.code).toHaveBeenCalledWith(500)
    })

    test('should log error on network failure', async () => {
      const networkError = new Error('Network failure')
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError))

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: networkError }),
        expect.stringContaining('Network error')
      )
    })

    test('should return backend status when backend returns non-ok', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404 })
      )

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Download unavailable')
      expect(mockResponseChain.code).toHaveBeenCalledWith(404)
    })

    test('should log warning when backend returns non-ok', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 503 })
      )

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 503 }),
        expect.stringContaining('Backend returned error')
      )
    })

    test('should return xlsx buffer with filename from content-disposition', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
          headers: {
            get: vi.fn((name) =>
              name === 'content-disposition'
                ? 'attachment; filename="WXC501E-002A-005A_legacy.xlsx"'
                : null
            )
          }
        })
      )

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith(expect.any(Buffer))
      expect(mockResponseChain.code).toHaveBeenCalledWith(200)
      expect(mockResponseChain.type).toHaveBeenCalledWith(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(mockResponseChain.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="WXC501E-002A-005A_legacy.xlsx"'
      )
    })

    test('should use default filename when content-disposition is absent', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
          headers: { get: vi.fn().mockReturnValue(null) }
        })
      )

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(mockResponseChain.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="WXC501E-002A-005A_proposal.xlsx"'
      )
    })

    test('should send correct Bearer token in Authorization header', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'my-jwt-token' })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
        headers: { get: vi.fn().mockReturnValue(null) }
      })
      vi.stubGlobal('fetch', mockFetch)

      await individualDownloadsController.downloadFcerm1LegacyHandler(
        mockRequest,
        localMockH
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('WXC501E-002A-005A'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-jwt-token' }
        })
      )
    })
  })

  describe('fcerm1DownloadUrls', () => {
    test('should set fcerm1LegacyDownloadUrl when showLegacyTemplate is true', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'WXC501E-002A-005A',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fcerm1LegacyDownloadUrl: expect.stringContaining('fcerm1/legacy')
        })
      )
    })

    test('should set fcerm1LegacyDownloadUrl to null when showLegacyTemplate is false', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST123',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fcerm1LegacyDownloadUrl: null
        })
      )
    })

    test('should set fcerm1NewDownloadUrl when showNewTemplate is true', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST123',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fcerm1NewDownloadUrl: expect.stringContaining('fcerm1/new')
        })
      )
    })

    test('should set fcerm1NewDownloadUrl to null when showNewTemplate is false', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'WXC501E-002A-005A',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.SUBMITTED,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: true,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fcerm1NewDownloadUrl: null
        })
      )
    })

    test('should include referenceNumber in fcerm1NewDownloadUrl', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'REF999',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]: PROJECT_STATUS.DRAFT,
        [PROJECT_PAYLOAD_FIELDS.IS_LEGACY]: false,
        [PROJECT_PAYLOAD_FIELDS.IS_REVISED]: false
      })

      await individualDownloadsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          fcerm1NewDownloadUrl: expect.stringContaining('REF999')
        })
      )
    })
  })

  describe('downloadFcerm1NewHandler', () => {
    let mockResponseChain
    let localMockH

    beforeEach(() => {
      mockResponseChain = {
        code: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis()
      }
      localMockH = {
        response: vi.fn().mockReturnValue(mockResponseChain)
      }
      mockRequest.params = { referenceNumber: 'WXC501E-002A-005A' }
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    test('should return 401 when session is null', async () => {
      getAuthSession.mockReturnValue(null)

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Unauthorised')
      expect(mockResponseChain.code).toHaveBeenCalledWith(401)
    })

    test('should return 401 when accessToken is null', async () => {
      getAuthSession.mockReturnValue({ accessToken: null })

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Unauthorised')
      expect(mockResponseChain.code).toHaveBeenCalledWith(401)
    })

    test('should log warning when no access token', async () => {
      getAuthSession.mockReturnValue({ accessToken: null })

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('access token')
      )
    })

    test('should return 500 on network error', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('Network failure'))
      )

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith(
        'Error generating download'
      )
      expect(mockResponseChain.code).toHaveBeenCalledWith(500)
    })

    test('should log error on network failure', async () => {
      const networkError = new Error('Network failure')
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError))

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: networkError }),
        expect.stringContaining('Network error')
      )
    })

    test('should return backend status when backend returns non-ok', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 404 })
      )

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith('Download unavailable')
      expect(mockResponseChain.code).toHaveBeenCalledWith(404)
    })

    test('should log warning when backend returns non-ok', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, status: 503 })
      )

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 503 }),
        expect.stringContaining('Backend returned error')
      )
    })

    test('should return xlsx buffer with filename from content-disposition', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
          headers: {
            get: vi.fn((name) =>
              name === 'content-disposition'
                ? 'attachment; filename="WXC501E-002A-005A_new.xlsx"'
                : null
            )
          }
        })
      )

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(localMockH.response).toHaveBeenCalledWith(expect.any(Buffer))
      expect(mockResponseChain.code).toHaveBeenCalledWith(200)
      expect(mockResponseChain.type).toHaveBeenCalledWith(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(mockResponseChain.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="WXC501E-002A-005A_new.xlsx"'
      )
    })

    test('should use default filename when content-disposition is absent', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
          headers: { get: vi.fn().mockReturnValue(null) }
        })
      )

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockResponseChain.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="WXC501E-002A-005A_proposal.xlsx"'
      )
    })

    test('should call the new-format backend endpoint', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'valid-token' })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
        headers: { get: vi.fn().mockReturnValue(null) }
      })
      vi.stubGlobal('fetch', mockFetch)

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fcerm1/new'),
        expect.any(Object)
      )
    })

    test('should send correct Bearer token in Authorization header', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'my-jwt-token' })
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
        headers: { get: vi.fn().mockReturnValue(null) }
      })
      vi.stubGlobal('fetch', mockFetch)

      await individualDownloadsController.downloadFcerm1NewHandler(
        mockRequest,
        localMockH
      )

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('WXC501E-002A-005A'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-jwt-token' }
        })
      )
    })
  })
})
