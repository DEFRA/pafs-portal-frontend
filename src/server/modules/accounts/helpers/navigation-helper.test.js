import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getNextRouteAfterIsAdmin,
  getNextRouteAfterDetails,
  isAdminContext,
  clearEditSession,
  getEditModeContext
} from './navigation-helper.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('./edit-session-helper.js')
vi.mock('./session-helpers.js')

const { detectChanges } = await import('./edit-session-helper.js')
const { getAdminSessionKey } = await import('./session-helpers.js')

describe('navigation-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminSessionKey.mockReturnValue('adminAccountData')
  })

  describe('isAdminContext', () => {
    test('returns true for admin paths', () => {
      expect(isAdminContext({ path: '/admin/accounts/start' })).toBe(true)
      expect(isAdminContext({ path: '/admin/accounts/details' })).toBe(true)
    })

    test('returns false for non-admin paths', () => {
      expect(isAdminContext({ path: '/accounts/start' })).toBe(false)
      expect(isAdminContext({ path: '/general/accounts/details' })).toBe(false)
    })
  })

  describe('getEditModeContext', () => {
    test('returns create mode context for admin without encodedId', () => {
      const request = { path: '/admin/accounts/details', params: {} }
      const result = getEditModeContext(request)

      expect(result.isEditMode).toBe(false)
      expect(result.encodedId).toBeUndefined()
      expect(result.baseRoutes).toBe(ROUTES.ADMIN.ACCOUNTS)
    })

    test('returns edit mode context for admin with encodedId', () => {
      const request = {
        path: '/admin/accounts/edit/abc123/details',
        params: { encodedId: 'abc123' }
      }
      const result = getEditModeContext(request)

      expect(result.isEditMode).toBe(true)
      expect(result.encodedId).toBe('abc123')
      expect(result.baseRoutes).toBe(ROUTES.ADMIN.ACCOUNTS.EDIT)
    })

    test('returns create mode context for general user', () => {
      const request = { path: '/accounts/details', params: {} }
      const result = getEditModeContext(request)

      expect(result.isEditMode).toBe(false)
      expect(result.encodedId).toBeUndefined()
      expect(result.baseRoutes).toBe(ROUTES.GENERAL.ACCOUNTS)
    })
  })

  describe('getNextRouteAfterIsAdmin', () => {
    test('returns details route for create mode', () => {
      const request = { path: '/admin/accounts/is-admin', params: {} }
      const sessionData = { admin: true }

      const result = getNextRouteAfterIsAdmin(request, sessionData)

      expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.DETAILS)
    })

    test('returns check answers when admin flag changed to true in edit mode', () => {
      const request = {
        path: '/admin/accounts/edit/abc123/is-admin',
        params: { encodedId: 'abc123' }
      }
      const sessionData = { admin: true, originalData: { admin: false } }

      detectChanges.mockReturnValue({
        roleChanged: true,
        hasChanges: true
      })

      const result = getNextRouteAfterIsAdmin(request, sessionData)

      expect(result).toBe(
        ROUTES.ADMIN.ACCOUNTS.EDIT.CHECK_ANSWERS.replace(
          '{encodedId}',
          'abc123'
        )
      )
    })

    test('returns details route when admin flag changed to false in edit mode', () => {
      const request = {
        path: '/admin/accounts/edit/abc123/is-admin',
        params: { encodedId: 'abc123' }
      }
      const sessionData = { admin: false, originalData: { admin: true } }

      detectChanges.mockReturnValue({
        roleChanged: true,
        hasChanges: true
      })

      const result = getNextRouteAfterIsAdmin(request, sessionData)

      expect(result).toBe(
        ROUTES.ADMIN.ACCOUNTS.EDIT.DETAILS.replace('{encodedId}', 'abc123')
      )
    })

    test('returns view route when no role change in edit mode', () => {
      const request = {
        path: '/admin/accounts/edit/abc123/is-admin',
        params: { encodedId: 'abc123' }
      }
      const sessionData = { admin: true, originalData: { admin: true } }

      detectChanges.mockReturnValue({
        roleChanged: false,
        hasChanges: false
      })

      const result = getNextRouteAfterIsAdmin(request, sessionData)

      expect(result).toBe(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'abc123')
      )
    })
  })

  describe('getNextRouteAfterDetails', () => {
    describe('admin users', () => {
      test('returns check answers in create mode', () => {
        const request = { path: '/admin/accounts/details', params: {} }
        const sessionData = { admin: true }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS)
      })

      test('returns check answers when changes exist in edit mode', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: true,
          firstName: 'Jane',
          originalData: { firstName: 'John' }
        }

        detectChanges.mockReturnValue({
          hasChanges: true
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(
          ROUTES.ADMIN.ACCOUNTS.EDIT.CHECK_ANSWERS.replace(
            '{encodedId}',
            'abc123'
          )
        )
      })

      test('returns view route when no changes in edit mode', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: true,
          firstName: 'John',
          originalData: { firstName: 'John' }
        }

        detectChanges.mockReturnValue({
          hasChanges: false
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(
          ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'abc123')
        )
      })
    })

    describe('general users - EA responsibility', () => {
      test('returns main area route in create mode', () => {
        const request = { path: '/admin/accounts/details', params: {} }
        const sessionData = { admin: false, responsibility: 'EA' }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.MAIN_AREA)
      })

      test('returns main area route for general user in create mode', () => {
        const request = { path: '/accounts/details', params: {} }
        const sessionData = { admin: false, responsibility: 'EA' }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.GENERAL.ACCOUNTS.MAIN_AREA)
      })

      test('returns main area route in edit mode for EA user with responsibility change', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: false,
          responsibility: 'EA',
          originalData: { responsibility: 'PSO' }
        }

        detectChanges.mockReturnValue({
          hasChanges: true,
          personalDetailsChanged: false,
          responsibilityChanged: true
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.MAIN_AREA)
      })
    })

    describe('general users - PSO responsibility', () => {
      test('returns EA parent areas route in create mode', () => {
        const request = { path: '/admin/accounts/details', params: {} }
        const sessionData = { admin: false, responsibility: 'PSO' }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA)
      })

      test('returns EA parent areas for general user in create mode', () => {
        const request = { path: '/accounts/details', params: {} }
        const sessionData = { admin: false, responsibility: 'PSO' }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA)
      })
    })

    describe('general users - RMA responsibility', () => {
      test('returns EA parent areas route in create mode', () => {
        const request = { path: '/admin/accounts/details', params: {} }
        const sessionData = { admin: false, responsibility: 'RMA' }

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA)
      })
    })

    describe('edit mode - general users', () => {
      test('returns check answers when only personal details changed', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: false,
          responsibility: 'EA',
          firstName: 'Jane',
          originalData: { firstName: 'John', responsibility: 'EA' }
        }

        detectChanges.mockReturnValue({
          hasChanges: true,
          personalDetailsChanged: true,
          responsibilityChanged: false
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(
          ROUTES.ADMIN.ACCOUNTS.EDIT.CHECK_ANSWERS.replace(
            '{encodedId}',
            'abc123'
          )
        )
      })

      test('returns view route when no changes in edit mode', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: false,
          responsibility: 'EA',
          firstName: 'John',
          originalData: { firstName: 'John', responsibility: 'EA' }
        }

        detectChanges.mockReturnValue({
          hasChanges: false,
          personalDetailsChanged: false,
          responsibilityChanged: false
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toBe(
          ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'abc123')
        )
      })

      test('returns parent areas when responsibility changed', () => {
        const request = {
          path: '/admin/accounts/edit/abc123/details',
          params: { encodedId: 'abc123' }
        }
        const sessionData = {
          admin: false,
          responsibility: 'PSO',
          originalData: { responsibility: 'EA' }
        }

        detectChanges.mockReturnValue({
          hasChanges: true,
          personalDetailsChanged: false,
          responsibilityChanged: true
        })

        const result = getNextRouteAfterDetails(request, sessionData)

        expect(result).toContain('/parent-areas/ea')
      })
    })
  })

  describe('clearEditSession', () => {
    test('clears session data when in edit mode', () => {
      const mockRequest = {
        yar: {
          get: vi.fn().mockReturnValue({
            editMode: true,
            editingUserId: 123
          }),
          set: vi.fn()
        },
        server: {
          logger: {
            info: vi.fn()
          }
        }
      }

      clearEditSession(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'adminAccountData',
        undefined
      )
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123 },
        'Cleared edit session data'
      )
    })

    test('does nothing when not in edit mode', () => {
      const mockRequest = {
        yar: {
          get: vi.fn().mockReturnValue({
            editMode: false
          }),
          set: vi.fn()
        },
        server: {
          logger: {
            info: vi.fn()
          }
        }
      }

      clearEditSession(mockRequest)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
      expect(mockRequest.server.logger.info).not.toHaveBeenCalled()
    })

    test('does nothing when session data is null', () => {
      const mockRequest = {
        yar: {
          get: vi.fn().mockReturnValue(null),
          set: vi.fn()
        },
        server: {
          logger: {
            info: vi.fn()
          }
        }
      }

      clearEditSession(mockRequest)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })
  })
})
