import { describe, test, expect, beforeEach, vi } from 'vitest'
import { startController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { buildViewData, resetSessionData } from '../helpers/project-utils.js'

// Mock dependencies
vi.mock('../helpers/project-utils.js')

describe('StartController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {}

    mockH = {
      view: vi.fn()
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Start Proposal',
      backLink: ROUTES.GENERAL.HOME
    })
  })

  describe('getHandler', () => {
    test('should reset session data', async () => {
      await startController.getHandler(mockRequest, mockH)

      expect(resetSessionData).toHaveBeenCalledWith(mockRequest)
    })

    test('should build view data with correct localKeyPrefix', async () => {
      await startController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(mockRequest, {
        localKeyPrefix: 'projects.start_proposal',
        backLinkOptions: { targetURL: ROUTES.GENERAL.HOME }
      })
    })

    test('should render START view', async () => {
      await startController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(PROJECT_VIEWS.START, {
        pageTitle: 'Start Proposal',
        backLink: ROUTES.GENERAL.HOME
      })
    })
  })
})
