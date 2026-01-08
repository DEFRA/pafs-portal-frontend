import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkAnswersController,
  checkAnswersPostController
} from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers.js')
vi.mock('../../../common/services/accounts/accounts-service.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/helpers/auth/session-manager.js')

const { findAreaById, getParentAreas } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey } = await import('../helpers.js')
const { upsertAccount } =
  await import('../../../common/services/accounts/accounts-service.js')
const { extractApiValidationErrors, extractApiError } =
  await import('../../../common/helpers/error-renderer/index.js')
const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('CheckAnswersController', () => {
  let mockRequest
  let mockH
  let mockAreas

  beforeEach(() => {
    mockAreas = {
      EA: [
        { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
        { id: '2', name: 'Thames', area_type: 'EA', parent_id: null }
      ],
      PSO: [{ id: '3', name: 'PSO West', area_type: 'PSO', parent_id: '1' }],
      RMA: [{ id: '4', name: 'Bristol', area_type: 'RMA', parent_id: '3' }]
    }

    mockRequest = {
      path: '/request-account/check-answers',
      yar: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn()
      },
      getAreas: vi.fn().mockResolvedValue(mockAreas),
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn()
        }
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }

    getSessionKey.mockReturnValue('accountData')
    findAreaById.mockImplementation((areas, id) => {
      return Object.values(areas)
        .flat()
        .find((a) => a.id === id)
    })
    getParentAreas.mockReturnValue([])
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('redirects to details if firstName missing', async () => {
      mockRequest.yar.get.mockReturnValue({ email: 'test@example.com' })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('redirects to details if email missing', async () => {
      mockRequest.yar.get.mockReturnValue({ firstName: 'John' })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('redirects to details if non-admin user has no responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: false
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('redirects to main area if non-admin user has no main area', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: false,
        responsibility: 'EA',
        areas: []
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('renders check answers view for admin user', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'admin@example.com',
        admin: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isAdmin: false,
          userData: expect.objectContaining({
            firstName: 'John',
            email: 'admin@example.com',
            admin: true
          })
        })
      )
      // ensure session key helper was used to read session data
      expect(getSessionKey).toHaveBeenCalled()
    })

    test('renders check answers view for EA user with areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false }
        ]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          userData: expect.objectContaining({
            responsibility: 'EA'
          }),
          areaDetails: expect.any(Object)
        })
      )
    })

    test('fetches areas from request decorator', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockRequest.getAreas).toHaveBeenCalled()
    })
  })

  describe('POST handler', () => {
    test('handles missing data gracefully', async () => {
      mockRequest.yar.get.mockReturnValue({})
      upsertAccount.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'VALIDATION_ERROR' }]
      })
      extractApiError.mockReturnValue({ errorCode: 'VALIDATION_ERROR' })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(upsertAccount).toHaveBeenCalled()
    })

    test('calls upsertAccount service with correct payload', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [{ areaId: '1', primary: true }]
      })
      upsertAccount.mockResolvedValue({ success: true })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(upsertAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          responsibility: 'EA',
          admin: false,
          areas: [{ areaId: '1', primary: true }]
        }),
        '' // No access token for non-admin
      )
    })

    test('handles API validation errors', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockResolvedValue({
        success: false,
        validationErrors: [{ field: 'email', errorCode: 'EMAIL_DUPLICATE' }]
      })
      extractApiValidationErrors.mockReturnValue({ email: 'Email exists' })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          fieldErrors: { email: 'Email exists' }
        })
      )
    })

    test('handles general API errors', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'NETWORK_ERROR' }]
      })
      extractApiError.mockReturnValue({ errorCode: 'NETWORK_ERROR' })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR'
        })
      )
    })

    test('updates session and redirects to confirmation on success', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { status: 'pending' }
      })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          submissionStatus: 'pending'
        })
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/confirmation'
      )
    })

    test('redirects admin to active users page with flash notification', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true
      })
      mockRequest.yar.flash = vi.fn()
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, status: 'approved' }
      })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('userCreated', {
        name: 'John Doe',
        userId: 123
      })
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })

    test('handles network errors gracefully', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockRejectedValue(new Error('Network error'))

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR'
        })
      )
    })

    test('submits payload for admin user', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      getAuthSession.mockReturnValue({
        accessToken: 'admin-access-token-123'
      })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { status: 'active' }
      })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(upsertAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          email: 'test@example.com',
          admin: true
        }),
        'admin-access-token-123'
      )
    })

    test('defaults to pending status if not provided in response', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockResolvedValue({ success: true, data: {} })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          submissionStatus: 'pending'
        })
      )
    })

    test('handles API error without errorCode', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })
      upsertAccount.mockResolvedValue({
        success: false,
        errors: [{ message: 'Unknown error' }]
      })
      extractApiError.mockReturnValue(null)

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR'
        })
      )
    })

    test('filters out null and undefined values from payload', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true,
        telephoneNumber: null,
        organisation: undefined
      })
      upsertAccount.mockResolvedValue({ success: true })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(upsertAccount).toHaveBeenCalledWith(
        expect.not.objectContaining({
          telephoneNumber: null,
          organisation: undefined
        }),
        '' // No access token for anonymous user
      )
    })
  })

  describe('getAreaDetails', () => {
    test('returns main area and additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false }
        ]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          areaDetails: expect.objectContaining({
            mainArea: expect.objectContaining({ id: '1' }),
            additionalAreas: expect.arrayContaining([
              expect.objectContaining({ id: '2' })
            ])
          })
        })
      )
    })

    test('handles missing area IDs gracefully', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [{ areaId: 'nonexistent', primary: true }]
      })
      findAreaById.mockReturnValue(null)

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          areaDetails: expect.objectContaining({
            mainArea: null
          })
        })
      )
    })

    test('filters out null additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [
          { areaId: '1', primary: true },
          { areaId: 'nonexistent', primary: false }
        ]
      })
      findAreaById.mockImplementation((areas, id) => {
        if (id === 'nonexistent') return null
        return Object.values(areas)
          .flat()
          .find((a) => a.id === id)
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          areaDetails: expect.objectContaining({
            additionalAreas: expect.not.arrayContaining([null])
          })
        })
      )
    })
  })

  describe('getParentAreasDisplay', () => {
    test('returns null when no responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          parentAreasDisplay: null
        })
      )
    })

    test('returns null when no areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [{ areaId: '1', primary: true }]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('displays EA parent areas for PSO users', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'PSO',
        admin: false,
        areas: [{ areaId: '3', primary: true }]
      })
      getParentAreas.mockReturnValue([{ id: '1', name: 'Wessex' }])

      await checkAnswersController.handler(mockRequest, mockH)

      expect(getParentAreas).toHaveBeenCalled()
    })

    test('displays EA and PSO parent areas for RMA users', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'RMA',
        admin: false,
        areas: [{ areaId: '4', primary: true }]
      })
      getParentAreas.mockImplementation((areas, id, type) => {
        if (type === 'EA Area') return [{ id: '1', name: 'Wessex' }]
        if (type === 'PSO Area') return [{ id: '3', name: 'PSO West' }]
        return []
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(getParentAreas).toHaveBeenCalledWith(mockAreas, '4', 'EA Area')
      expect(getParentAreas).toHaveBeenCalledWith(mockAreas, '4', 'PSO Area')
    })

    test('handles missing area in parent lookup', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'PSO',
        admin: false,
        areas: [{ areaId: 'nonexistent', primary: true }]
      })
      findAreaById.mockReturnValue(null)

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('buildViewData', () => {
    test('includes all required routes for regular user', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [{ areaId: '1', primary: true }]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          submitRoute: '/request-account/check-answers',
          detailsRoute: '/request-account/details',
          mainAreaRoute: '/request-account/main-area',
          additionalAreasRoute: '/request-account/additional-areas',
          parentAreasEaRoute: '/request-account/parent-areas/ea',
          parentAreasPsoRoute: '/request-account/parent-areas/pso'
        })
      )
    })

    test('includes all required routes for admin user', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          submitRoute: '/admin/user-account/check-answers',
          detailsRoute: '/admin/user-account/details',
          mainAreaRoute: '/admin/user-account/main-area',
          isAdminRoute: '/admin/user-account/is-admin'
        })
      )
    })

    test('includes responsibility label', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'EA',
        admin: false,
        areas: [{ areaId: '1', primary: true }]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'accounts.label.responsibility.ea'
      )
    })

    test('handles missing responsibility gracefully', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          responsibility: '',
          responsibilityLabel: ''
        })
      )
    })
  })

  describe('Admin context redirects', () => {
    test('redirects admin to admin details if firstName missing', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({ email: 'test@example.com' })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account/details')
    })

    test('redirects admin to admin main area if non-admin user has no main area', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: false,
        responsibility: 'EA',
        areas: []
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })
  })
})
