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

import { buildModerationResponse } from '../helpers/moderation-helper.js'

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
})
