import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  journeySelectionController,
  journeySelectionPostController
} from './controller.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } = await import(
  '../../common/helpers/auth/session-manager.js'
)

describe('Journey Selection Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      t: vi.fn((key) => key),
      payload: {}
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  describe('GET', () => {
    test('shows journey selection page', async () => {
      getAuthSession.mockReturnValue({
        user: { id: 1, admin: true }
      })

      await journeySelectionController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('admin/journey-selection/index', {
        pageTitle: 'common.pages.admin.journey_selection.title',
        user: { id: 1, admin: true }
      })
    })
  })

  describe('POST', () => {
    test('redirects to admin when admin selected', async () => {
      mockRequest.payload = { journey: 'admin' }

      await journeySelectionPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users')
    })

    test('redirects to home when user selected', async () => {
      mockRequest.payload = { journey: 'user' }

      await journeySelectionPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })

    test('redirects to home by default', async () => {
      mockRequest.payload = {}

      await journeySelectionPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })
  })
})
