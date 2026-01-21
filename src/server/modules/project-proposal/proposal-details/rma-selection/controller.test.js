import { describe, test, expect, beforeEach, vi } from 'vitest'
import { rmaSelectionController } from './controller.js'
import { getAreasByType } from '../../../../common/helpers/areas/areas-helper.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import {
  PROPOSAL_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { statusCodes } from '../../../../common/constants/status-codes.js'

// Mock dependencies
vi.mock('../../../../common/helpers/areas/areas-helper.js', () => ({
  getAreasByType: vi.fn()
}))
vi.mock('../../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

describe('#rmaSelectionController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock request object
    mockRequest = {
      method: 'get',
      t: vi.fn((key) => key),
      yar: {
        get: vi.fn(() => ({})),
        set: vi.fn()
      },
      payload: {},
      server: {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      },
      getAreas: vi.fn()
    }

    // Mock h (response toolkit) object
    mockH = {
      view: vi.fn((template, context) => ({
        template,
        context,
        code: (status) => ({ template, context, statusCode: status })
      })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }
  })

  describe('GET /project-proposal/rma-selection', () => {
    test('should redirect to start proposal if project name is missing in session', async () => {
      mockRequest.yar.get.mockReturnValue({}) // Empty session or missing projectName

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.START_PROPOSAL
      )
    })

    test('should handle null session data', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      await rmaSelectionController.handler(mockRequest, mockH)

      // expect(mockH.view).toHaveBeenCalledWith(
      //   expect.stringContaining('modules/project-proposal/rma-selection/index'),
      //   expect.objectContaining({
      //     values: {}
      //   })
      // )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.START_PROPOSAL
      )
    })

    test('should handle undefined session data', async () => {
      mockRequest.yar.get.mockReturnValue(undefined)

      await rmaSelectionController.handler(mockRequest, mockH)

      // expect(mockH.view).toHaveBeenCalledWith(
      //   expect.stringContaining('modules/project-proposal/rma-selection/index'),
      //   expect.objectContaining({
      //     values: {}
      //   })
      // )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.START_PROPOSAL
      )
    })

    test('should display saved rma selection if available in session', async () => {
      const savedValues = { rmaSelection: 'saved-id' }
      mockRequest.yar.get.mockReturnValue({
        projectName: 'Test Project',
        rmaSelection: savedValues
      })
      getAuthSession.mockReturnValue({ user: { admin: false, areas: [] } })

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.RMA_SELECTION,
        expect.objectContaining({ values: savedValues })
      )
    })

    test('should display form with empty values on initial load', async () => {
      mockRequest.yar.get.mockReturnValue({ projectName: 'Test Project' })
      getAuthSession.mockReturnValue({ user: { admin: false, areas: [] } })

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.RMA_SELECTION,
        expect.objectContaining({ values: {} })
      )
    })

    test('should render rma selection view with admin areas', async () => {
      // Setup session with project name
      mockRequest.yar.get.mockReturnValue({ projectName: 'Test Project' })

      // Setup admin user
      getAuthSession.mockReturnValue({ user: { admin: true } })

      // Mock areas data
      const mockAreas = [{ id: '1', name: 'Area 1' }]
      mockRequest.getAreas.mockResolvedValue(mockAreas)
      getAreasByType.mockReturnValue(mockAreas)

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockRequest.getAreas).toHaveBeenCalled()
      expect(getAreasByType).toHaveBeenCalledWith(
        mockAreas,
        AREAS_RESPONSIBILITIES_MAP.RMA
      )
      expect(mockH.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.RMA_SELECTION,
        expect.objectContaining({
          viewData: [{ id: '1', name: 'Area 1' }]
        })
      )
    })

    test('should render rma selection view with user areas (non-admin)', async () => {
      mockRequest.yar.get.mockReturnValue({ projectName: 'Test Project' })

      // Setup non-admin user with areas
      getAuthSession.mockReturnValue({
        user: {
          admin: false,
          areas: [{ areaId: '2', name: 'Area 2' }]
        }
      })

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockRequest.getAreas).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.RMA_SELECTION,
        expect.objectContaining({
          viewData: [{ id: '2', name: 'Area 2' }]
        })
      )
    })
  })

  describe('POST /project-proposal/rma-selection', () => {
    beforeEach(() => {
      mockRequest.method = 'post'
      // Default non-admin user for post tests
      getAuthSession.mockReturnValue({ user: { admin: false, areas: [] } })
    })

    test('should handle undefined session data when saving', async () => {
      mockRequest.payload = { rmaSelection: 'some-id' }
      mockRequest.yar.get.mockReturnValue(undefined)

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          rmaSelection: { rmaSelection: 'some-id' }
        })
      )
    })

    test('should handle null session data when saving', async () => {
      mockRequest.payload = { rmaSelection: 'some-id' }
      mockRequest.yar.get.mockReturnValue(null)

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          rmaSelection: { rmaSelection: 'some-id' }
        })
      )
    })

    test('should show validation errors and error summary if rmaSelection is empty', async () => {
      mockRequest.payload = { rmaSelection: '' }
      mockRequest.yar.get.mockReturnValue({ projectName: 'Test Project' })

      const result = await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROPOSAL_VIEWS.RMA_SELECTION,
        expect.objectContaining({
          errors: expect.objectContaining({
            rmaSelection: 'project-proposal.rma_selection.errors.required'
          }),
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: 'project-proposal.rma_selection.errors.required',
              href: '#rma-selection'
            })
          ])
        })
      )
      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('should save to session, log info, and redirect on success', async () => {
      mockRequest.payload = { rmaSelection: 'some-id' }
      const sessionData = { projectName: 'Test Project' }
      mockRequest.yar.get.mockReturnValue(sessionData)

      await rmaSelectionController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { rmaSelection: 'some-id' },
        'RMA selection validated and stored in session'
      )
      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          rmaSelection: { rmaSelection: 'some-id' }
        })
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
      )
    })
  })
})
