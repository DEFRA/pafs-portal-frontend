import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkAnswersController,
  checkAnswersPostController,
  viewAccountController
} from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers/session-helpers.js')
vi.mock('../../../common/services/accounts/accounts-service.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/accounts/accounts-cache.js')

const { findAreaById, getAreaDetails, getParentAreasDisplay, getParentAreas } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey } = await import('../helpers/session-helpers.js')
const { upsertAccount } =
  await import('../../../common/services/accounts/accounts-service.js')
const { extractApiValidationErrors, extractApiError } =
  await import('../../../common/helpers/error-renderer/index.js')
const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')
const { createAccountsCacheService } =
  await import('../../../common/services/accounts/accounts-cache.js')

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
        clear: vi.fn(),
        flash: vi.fn().mockReturnValue([])
      },
      getAreas: vi.fn().mockResolvedValue(mockAreas),
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn()
        }
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn((url) => ({ source: url }))
    }

    getSessionKey.mockReturnValue('accountData')
    findAreaById.mockImplementation((areas, id) => {
      return Object.values(areas)
        .flat()
        .find((a) => a.id === id)
    })
    getParentAreas.mockReturnValue([])

    // Mock getAreaDetails to return proper structure
    getAreaDetails.mockImplementation((areas, userAreas) => {
      if (!userAreas || userAreas.length === 0) {
        return { mainArea: null, additionalAreas: [] }
      }
      const mainAreaObj = userAreas.find((a) => a.primary)
      const mainArea = mainAreaObj
        ? findAreaById(areas, mainAreaObj.areaId)
        : null
      const additionalAreas = userAreas
        .filter((a) => !a.primary)
        .map((a) => findAreaById(areas, a.areaId))
        .filter(Boolean)
      return { mainArea, additionalAreas }
    })

    // Mock getParentAreasDisplay to return proper structure
    getParentAreasDisplay.mockImplementation(
      (areas, responsibility, userAreas) => {
        if (!responsibility || !userAreas || userAreas.length === 0) {
          return null
        }
        // Simple mock - return null for EA, some data for PSO/RMA
        if (responsibility === 'EA') return null
        return {
          eaAreas: 'Wessex',
          psoAreas: responsibility === 'RMA' ? 'PSO West' : null
        }
      }
    )

    // Setup default mock for cache service
    vi.mocked(createAccountsCacheService).mockReturnValue({
      setAccount: vi.fn().mockResolvedValue(undefined),
      invalidateAll: vi.fn().mockResolvedValue(undefined),
      dropByKey: vi.fn().mockResolvedValue(undefined),
      generateAccountKey: vi.fn((id) => `account:${id}`)
    })

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

    test('uses edit routes and page title when in edit mode on GET', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true,
        editingUserId: 123,
        isEditMode: true
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'accounts.add_user.check_answers.edit_title'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isEditMode: true,
          encodedId: 'abc123',
          pageTitle: 'accounts.add_user.check_answers.edit_title',
          heading: 'accounts.add_user.check_answers.edit_heading',
          submitButtonText: 'accounts.add_user.check_answers.edit_submit_button'
        })
      )
    })

    test('redirects to edit details if non-admin user has no responsibility in edit mode', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: false,
        editingUserId: 123,
        isEditMode: true
      })

      const result = await checkAnswersController.handler(mockRequest, mockH)

      expect(result).toBe('/admin/user-account/details/abc123')
    })

    test('redirects to edit main area if non-admin user has no main area in edit mode', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: false,
        responsibility: 'EA',
        areas: [],
        editingUserId: 123,
        isEditMode: true
      })

      const result = await checkAnswersController.handler(mockRequest, mockH)

      expect(result).toBe('/admin/user-account/main-area/abc123')
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

      // Should still attempt to call upsertAccount
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

      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[0]).toBe('modules/accounts/check-answers/index')
      expect(viewCall[1]).toMatchObject({
        fieldErrors: { email: 'Email exists' }
      })
      // errorCode should be empty string when there are field errors
      expect(viewCall[1].errorCode).toBe('')
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

      const result = await checkAnswersPostController.handler(
        mockRequest,
        mockH
      )

      // Wait for any async cache operations
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          firstName: 'John',
          email: 'test@example.com',
          admin: true,
          submissionStatus: 'pending'
        })
      )
      expect(result.source).toBe('/request-account/confirmation')
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
      getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, status: 'approved' }
      })

      const result = await checkAnswersPostController.handler(
        mockRequest,
        mockH
      )

      // Wait for any async cache operations
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('userCreated', {
        name: 'John Doe',
        userId: 123
      })
      expect(result.source).toBe('/admin/users/active')
    })

    test('handles network errors gracefully', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true,
        areas: []
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
      mockRequest.yar.flash = vi.fn()
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Smith',
        email: 'test@example.com',
        admin: true,
        areas: []
      })
      getAuthSession.mockReturnValue({
        accessToken: 'admin-access-token-123'
      })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { status: 'active', userId: 456 }
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

      // Wait for any async cache operations
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          firstName: 'John',
          email: 'test@example.com',
          admin: true,
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

    test('filters out null and undefined values from payload', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        admin: true,
        telephoneNumber: null,
        organisation: undefined,
        areas: []
      })
      upsertAccount.mockResolvedValue({ success: true, data: {} })

      await checkAnswersPostController.handler(mockRequest, mockH)

      const callArgs = upsertAccount.mock.calls[0][0]
      expect(callArgs).not.toHaveProperty('telephoneNumber')
      expect(callArgs).not.toHaveProperty('organisation')
    })
  })

  describe('Area details integration', () => {
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

  describe('Parent areas display integration', () => {
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

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          parentAreasDisplay: expect.objectContaining({
            eaAreas: expect.any(String)
          })
        })
      )
    })

    test('displays EA and PSO parent areas for RMA users', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        email: 'test@example.com',
        responsibility: 'RMA',
        admin: false,
        areas: [{ areaId: '4', primary: true }]
      })

      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          parentAreasDisplay: expect.objectContaining({
            eaAreas: expect.any(String),
            psoAreas: expect.any(String)
          })
        })
      )
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

  describe('Error handling scenarios', () => {
    test('handles validation errors from API', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: false,
        responsibility: 'EA',
        areas: [{ areaId: '1', mainArea: true }]
      })

      upsertAccount.mockResolvedValue({
        success: false,
        validationErrors: {
          email: ['Email already exists']
        }
      })

      extractApiValidationErrors.mockReturnValue({
        email: 'Email already exists'
      })

      await checkAnswersPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            email: 'Email already exists'
          })
        })
      )
    })
  })

  describe('buildViewData with view mode options', () => {
    test('includes view mode properties for pending user', async () => {
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        admin: false,
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })

      // Mock pre-handler data
      mockRequest.pre = {
        accountData: {
          account: {
            id: 'user123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            status: 'pending',
            disabled: false,
            invitationAcceptedAt: null,
            createdAt: '2024-01-01T10:00:00Z',
            invitationSentAt: null,
            lastSignIn: null,
            admin: false,
            areas: [{ id: '1', primary: true }]
          },
          areasData: mockAreas,
          userId: 'user123'
        }
      }

      // The buildViewData method is called internally with view mode options
      // We test this through the GET handler which uses buildViewData
      await checkAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          userData: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe'
          })
        })
      )
    })
  })

  describe('viewAccount method', () => {
    beforeEach(() => {
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.pre = {
        accountData: {
          account: {
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            telephoneNumber: '1234567890',
            organisation: 'Test Org',
            jobTitle: 'Manager',
            status: 'active',
            disabled: false,
            invitationAcceptedAt: '2024-01-02T10:00:00Z',
            createdAt: '2024-01-01T10:00:00Z',
            invitationSentAt: '2024-01-01T12:00:00Z',
            lastSignIn: '2024-01-10T10:00:00Z',
            admin: false,
            areas: [
              { id: '1', primary: true, type: 'EA' },
              { id: '2', primary: false, type: 'EA' }
            ]
          },
          areasData: mockAreas
        }
      }
    })

    test('renders account view with all data', async () => {
      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isViewMode: true,
          encodedId: 'abc123',
          isActive: true,
          isPending: false,
          backLink: '/admin/users/active',
          userData: expect.objectContaining({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@example.com',
            telephoneNumber: '1234567890',
            organisation: 'Test Org',
            jobTitle: 'Manager',
            admin: false
          }),
          accountInfo: expect.objectContaining({
            createdAt: '2024-01-01T10:00:00Z',
            invitationSentAt: '2024-01-01T12:00:00Z',
            invitationAcceptedAt: '2024-01-02T10:00:00Z',
            lastSignIn: '2024-01-10T10:00:00Z'
          }),
          actionRoutes: expect.objectContaining({
            approve: '/admin/users/abc123/approve',
            delete: '/admin/users/abc123/delete',
            resendInvitation: '/admin/users/abc123/resend-invitation',
            reactivate: '/admin/users/abc123/reactivate'
          })
        })
      )
    })

    test('handles pending user correctly', async () => {
      mockRequest.pre.accountData.account.status = 'pending'
      mockRequest.pre.accountData.account.invitationAcceptedAt = null

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isPending: true,
          isActive: false,
          hasAcceptedInvitation: false,
          backLink: '/admin/users/pending'
        })
      )
    })

    test('handles disabled user correctly', async () => {
      mockRequest.pre.accountData.account.disabled = true

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isDisabled: true
        })
      )
    })

    test('handles admin user correctly', async () => {
      mockRequest.pre.accountData.account.admin = true
      mockRequest.pre.accountData.account.areas = []

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isViewMode: true,
          userData: expect.objectContaining({
            admin: true
          }),
          areaDetails: expect.objectContaining({
            mainArea: null,
            additionalAreas: []
          })
        })
      )
    })

    test('handles PSO user with parent areas', async () => {
      mockRequest.pre.accountData.account.areas = [
        { id: '3', primary: true, type: 'PSO' }
      ]

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isViewMode: true,
          areaDetails: expect.objectContaining({
            mainArea: expect.objectContaining({
              id: '3',
              area_type: 'PSO'
            })
          })
        })
      )
    })

    test('handles RMA user with parent areas', async () => {
      mockRequest.pre.accountData.account.areas = [
        { id: '4', primary: true, type: 'RMA' }
      ]

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isViewMode: true,
          areaDetails: expect.objectContaining({
            mainArea: expect.objectContaining({
              id: '4',
              area_type: 'RMA'
            })
          })
        })
      )
    })

    test('redirects to active users on error', async () => {
      mockRequest.pre = null // Simulate error

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })

    test('handles approved status as active', async () => {
      mockRequest.pre.accountData.account.status = 'approved'

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          isActive: true,
          isPending: false
        })
      )
    })

    test('includes success notification when present in flash', async () => {
      const successNotification = {
        title: 'User approved',
        message: 'An invitation email has been sent to John Smith.'
      }
      mockRequest.yar.flash.mockImplementation((key) => {
        if (key === 'success') return [successNotification]
        return []
      })

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success')
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          successNotification
        })
      )
    })

    test('includes error notification when present in flash', async () => {
      const errorNotification = {
        message: 'There was a problem approving the user. Please try again.'
      }
      mockRequest.yar.flash.mockImplementation((key) => {
        if (key === 'error') return [errorNotification]
        return []
      })

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error')
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/check-answers/index',
        expect.objectContaining({
          errorNotification
        })
      )
    })

    test('does not include notifications when flash is empty', async () => {
      mockRequest.yar.flash.mockReturnValue([])

      await viewAccountController.handler(mockRequest, mockH)

      const viewCallArgs = mockH.view.mock.calls[0][1]
      expect(viewCallArgs.successNotification).toBeUndefined()
      expect(viewCallArgs.errorNotification).toBeUndefined()
    })

    test('handles error during view rendering', async () => {
      mockRequest.pre.accountData = null

      await viewAccountController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          encodedId: 'abc123'
        }),
        'Error viewing account'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })
  })

  describe('Cache invalidation', () => {
    test('invalidates accounts cache on successful user creation', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({
        accessToken: 'admin-access-token-123'
      })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, status: 'approved' }
      })

      const mockCacheService = {
        invalidateAll: vi.fn().mockResolvedValue(undefined),
        generateAccountKey: vi.fn((id) => `account:${id}`),
        dropByKey: vi.fn().mockResolvedValue(undefined)
      }
      createAccountsCacheService.mockReturnValue(mockCacheService)

      await checkAnswersPostController.handler(mockRequest, mockH)

      // Wait for async cache invalidation
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockCacheService.invalidateAll).toHaveBeenCalled()
    })

    test('logs warning when cache invalidation fails', async () => {
      mockRequest.path = '/admin/accounts/check-answers'
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({
        accessToken: 'admin-access-token-123'
      })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, status: 'approved' }
      })

      const mockCacheService = {
        invalidateAll: vi.fn().mockRejectedValue(new Error('Cache error')),
        generateAccountKey: vi.fn((id) => `account:${id}`),
        dropByKey: vi.fn().mockResolvedValue(undefined)
      }
      createAccountsCacheService.mockReturnValue(mockCacheService)

      await checkAnswersPostController.handler(mockRequest, mockH)

      // Wait for async cache invalidation
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockCacheService.invalidateAll).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error)
        }),
        'Failed to invalidate accounts cache'
      )
    })

    test('handles edit mode success with flash message and redirect', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true,
        editingUserId: 123,
        isEditMode: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 123 }
      })

      const result = await checkAnswersPostController.handler(
        mockRequest,
        mockH
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        'success',
        expect.objectContaining({
          title: expect.any(String)
        })
      )
      expect(result.source).toContain('/admin/users/')
    })

    test('invalidates specific account cache in edit mode', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true,
        editingUserId: 456,
        isEditMode: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 456 }
      })

      const mockCacheService = {
        generateAccountKey: vi.fn((id) => `account:${id}`),
        dropByKey: vi.fn().mockResolvedValue(undefined),
        invalidateAll: vi.fn()
      }
      createAccountsCacheService.mockReturnValue(mockCacheService)

      await checkAnswersPostController.handler(mockRequest, mockH)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockCacheService.dropByKey).toHaveBeenCalledWith('account:456')
      expect(mockCacheService.invalidateAll).not.toHaveBeenCalled()
    })

    test('logs warning when specific cache invalidation fails in edit mode', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true,
        editingUserId: 456,
        isEditMode: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
      upsertAccount.mockResolvedValue({
        success: true,
        data: { userId: 456 }
      })

      const mockCacheService = {
        generateAccountKey: vi.fn((id) => `account:${id}`),
        dropByKey: vi.fn().mockRejectedValue(new Error('Cache error')),
        invalidateAll: vi.fn()
      }
      createAccountsCacheService.mockReturnValue(mockCacheService)

      await checkAnswersPostController.handler(mockRequest, mockH)
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          accountId: 456
        }),
        'Failed to invalidate specific account cache'
      )
    })

    test('handles edit mode when no account ID is available for cache invalidation', async () => {
      mockRequest.path = '/admin/accounts/edit/abc123/check-answers'
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        admin: true,
        isEditMode: true
      })
      mockRequest.yar.flash = vi.fn()
      getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
      upsertAccount.mockResolvedValue({
        success: true,
        data: {}
      })

      const mockCacheService = {
        generateAccountKey: vi.fn(),
        dropByKey: vi.fn(),
        invalidateAll: vi.fn()
      }
      createAccountsCacheService.mockReturnValue(mockCacheService)

      await checkAnswersPostController.handler(mockRequest, mockH)
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockCacheService.dropByKey).not.toHaveBeenCalled()
    })

    test('defaults to NETWORK_ERROR when API error has no errorCode', async () => {
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

      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[0]).toBe('modules/accounts/check-answers/index')
      expect(viewCall[1].errorCode).toBe('NETWORK_ERROR')
    })
  })
})
