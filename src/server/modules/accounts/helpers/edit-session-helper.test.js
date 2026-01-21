import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  initializeEditSession,
  initializeEditSessionPreHandler,
  detectChanges,
  hasAreasChanged
} from './edit-session-helper.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('./session-helpers.js')

const { determineResponsibilityFromAreas, getParentAreas } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getAdminSessionKey } = await import('./session-helpers.js')

describe('edit-session-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAdminSessionKey.mockReturnValue('adminAccountData')
  })

  describe('initializeEditSession', () => {
    test('initializes session with EA user data', () => {
      const mockRequest = {
        params: { encodedId: 'abc123' },
        yar: { set: vi.fn() }
      }

      const accountData = {
        account: {
          id: 1,
          admin: false,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          jobTitle: 'Engineer',
          organisation: 'EA',
          telephoneNumber: '01234567890',
          areas: [{ id: 1, primary: true }]
        },
        areasData: [{ id: 1, name: 'Area 1', type: 'EA' }]
      }

      determineResponsibilityFromAreas.mockReturnValue('EA')
      getParentAreas.mockReturnValue([])

      const result = initializeEditSession(mockRequest, accountData)

      expect(result).toMatchObject({
        journeyStarted: true,
        editMode: true,
        editingUserId: 1,
        admin: false,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        jobTitle: 'Engineer',
        organisation: 'EA',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        encodedId: 'abc123',
        areas: [{ id: 1, primary: true }]
      })

      expect(result.originalData).toMatchObject({
        admin: false,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        responsibility: 'EA',
        areas: [{ id: 1, primary: true }]
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'adminAccountData',
        result
      )
    })

    test('initializes session with PSO user data and EA parent areas', () => {
      const mockRequest = {
        params: { encodedId: 'xyz789' },
        yar: { set: vi.fn() }
      }

      const accountData = {
        account: {
          id: 2,
          admin: false,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          jobTitle: 'Manager',
          organisation: 'PSO',
          telephoneNumber: '09876543210',
          areas: [
            { id: 10, primary: true },
            { id: 11, primary: false }
          ]
        },
        areasData: [
          { id: 1, name: 'EA Area 1', type: 'EA' },
          { id: 10, name: 'PSO Area 1', type: 'PSO', parent_id: 1 },
          { id: 11, name: 'PSO Area 2', type: 'PSO', parent_id: 1 }
        ]
      }

      determineResponsibilityFromAreas.mockReturnValue('PSO')
      getParentAreas.mockReturnValue([{ id: 1 }])

      const result = initializeEditSession(mockRequest, accountData)

      expect(result.responsibility).toBe('PSO')
      expect(result.eaAreas).toEqual(['1'])
      expect(result.areas).toHaveLength(2)
    })

    test('initializes session with RMA user data and EA + PSO parent areas', () => {
      const mockRequest = {
        params: { encodedId: 'rma123' },
        yar: { set: vi.fn() }
      }

      const accountData = {
        account: {
          id: 3,
          admin: false,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob@example.com',
          jobTitle: 'Analyst',
          organisation: 'RMA',
          telephoneNumber: '01111111111',
          areas: [{ id: 20, primary: true }]
        },
        areasData: [
          { id: 1, name: 'EA Area 1', type: 'EA' },
          { id: 10, name: 'PSO Area 1', type: 'PSO', parent_id: 1 },
          { id: 20, name: 'RMA Area 1', type: 'RMA', parent_id: 10 }
        ]
      }

      determineResponsibilityFromAreas.mockReturnValue('RMA')
      getParentAreas
        .mockReturnValueOnce([{ id: 1 }]) // EA parent
        .mockReturnValueOnce([{ id: 10 }]) // PSO parent

      const result = initializeEditSession(mockRequest, accountData)

      expect(result.responsibility).toBe('RMA')
      expect(result.eaAreas).toEqual(['1'])
      expect(result.psoAreas).toEqual(['10'])
    })

    test('initializes session with admin user data (no areas)', () => {
      const mockRequest = {
        params: { encodedId: 'admin123' },
        yar: { set: vi.fn() }
      }

      const accountData = {
        account: {
          id: 4,
          admin: true,
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          jobTitle: '',
          organisation: '',
          telephoneNumber: '',
          areas: []
        },
        areasData: []
      }

      determineResponsibilityFromAreas.mockReturnValue(null)

      const result = initializeEditSession(mockRequest, accountData)

      expect(result.admin).toBe(true)
      expect(result.areas).toBeUndefined()
      expect(result.eaAreas).toBeUndefined()
      expect(result.psoAreas).toBeUndefined()
    })

    test('handles account with empty/null fields', () => {
      const mockRequest = {
        params: { encodedId: 'empty123' },
        yar: { set: vi.fn() }
      }

      const accountData = {
        account: {
          id: 5,
          admin: false,
          firstName: null,
          lastName: '',
          email: 'test@example.com',
          jobTitle: null,
          organisation: null,
          telephoneNumber: null,
          areas: null
        },
        areasData: []
      }

      determineResponsibilityFromAreas.mockReturnValue('EA')

      const result = initializeEditSession(mockRequest, accountData)

      expect(result.firstName).toBe('')
      expect(result.lastName).toBe('')
      expect(result.jobTitle).toBe('')
      expect(result.organisation).toBe('')
      expect(result.telephoneNumber).toBe('')
      expect(result.originalData.areas).toEqual([])
    })
  })

  describe('detectChanges', () => {
    test('detects no changes when data matches original', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          jobTitle: 'Engineer',
          organisation: 'EA',
          telephoneNumber: '01234567890',
          responsibility: 'EA',
          areas: [{ id: 1, primary: true }]
        },
        admin: false,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        jobTitle: 'Engineer',
        organisation: 'EA',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        areas: [{ id: 1, primary: true }]
      }

      const result = detectChanges(sessionData)

      expect(result).toEqual({
        hasChanges: false,
        changedFields: [],
        roleChanged: false,
        responsibilityChanged: false,
        personalDetailsChanged: false,
        areasChanged: false
      })
    })

    test('detects admin flag change', () => {
      const sessionData = {
        editMode: true,
        originalData: { admin: false },
        admin: true
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('admin')
      expect(result.roleChanged).toBe(true)
    })

    test('detects first name change', () => {
      const sessionData = {
        editMode: true,
        originalData: { admin: false, firstName: 'John' },
        admin: false,
        firstName: 'Jane'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('firstName')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects last name change', () => {
      const sessionData = {
        editMode: true,
        originalData: { admin: false, lastName: 'Doe' },
        admin: false,
        lastName: 'Smith'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('lastName')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects email change', () => {
      const sessionData = {
        editMode: true,
        originalData: { admin: false, email: 'old@example.com' },
        admin: false,
        email: 'new@example.com'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('email')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects responsibility change', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          responsibility: 'EA',
          areas: []
        },
        admin: false,
        responsibility: 'PSO',
        areas: []
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('responsibility')
      expect(result.responsibilityChanged).toBe(true)
    })

    test('detects job title change', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          jobTitle: 'Engineer'
        },
        admin: false,
        jobTitle: 'Senior Engineer'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('jobTitle')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects organisation change', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          organisation: 'Company A'
        },
        admin: false,
        organisation: 'Company B'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('organisation')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects telephone number change', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          telephoneNumber: '01234567890'
        },
        admin: false,
        telephoneNumber: '09876543210'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('telephoneNumber')
      expect(result.personalDetailsChanged).toBe(true)
    })

    test('detects areas change when area count differs', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          areas: [{ id: 1, primary: true }]
        },
        admin: false,
        areas: [
          { id: 1, primary: true },
          { id: 2, primary: false }
        ]
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('areas')
      expect(result.areasChanged).toBe(true)
    })

    test('detects areas change when primary flag changes', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          areas: [{ id: 1, primary: true }]
        },
        admin: false,
        areas: [{ id: 1, primary: false }]
      }

      const result = detectChanges(sessionData)

      expect(result.areasChanged).toBe(true)
    })

    test('detects areas change when area IDs change', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          areas: [{ id: 1, primary: true }]
        },
        admin: false,
        areas: [{ id: 2, primary: true }]
      }

      const result = detectChanges(sessionData)

      expect(result.areasChanged).toBe(true)
    })

    test('handles areas with areaId property', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          areas: [{ id: 1, primary: true }]
        },
        admin: false,
        areas: [{ areaId: 1, primary: true }]
      }

      const result = detectChanges(sessionData)

      expect(result.areasChanged).toBe(false)
    })

    test('ignores job-related fields for admin users', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: true,
          jobTitle: 'Old',
          organisation: 'Old',
          telephoneNumber: '111'
        },
        admin: true,
        jobTitle: 'New',
        organisation: 'New',
        telephoneNumber: '222'
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(false)
    })

    test('returns no changes when not in edit mode', () => {
      const sessionData = {
        editMode: false,
        admin: false
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(false)
    })

    test('returns no changes when originalData missing', () => {
      const sessionData = {
        editMode: true,
        admin: false
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(false)
    })

    test('detects multiple changes', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          admin: false,
          firstName: 'John',
          email: 'john@example.com',
          responsibility: 'EA',
          areas: []
        },
        admin: false,
        firstName: 'Jane',
        email: 'jane@example.com',
        responsibility: 'PSO',
        areas: []
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toHaveLength(3)
      expect(result.changedFields).toContain('firstName')
      expect(result.changedFields).toContain('email')
      expect(result.changedFields).toContain('responsibility')
      expect(result.personalDetailsChanged).toBe(true)
      expect(result.responsibilityChanged).toBe(true)
    })
  })

  describe('hasAreasChanged', () => {
    test('returns true when areas have changed', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          areas: [{ id: 1, primary: true }]
        },
        areas: [{ id: 2, primary: true }]
      }

      expect(hasAreasChanged(sessionData)).toBe(true)
    })

    test('returns false when areas unchanged', () => {
      const sessionData = {
        editMode: true,
        originalData: {
          areas: [{ id: 1, primary: true }]
        },
        areas: [{ id: 1, primary: true }]
      }

      expect(hasAreasChanged(sessionData)).toBe(false)
    })

    test('returns false when not in edit mode', () => {
      const sessionData = {
        editMode: false,
        originalData: { areas: [] },
        areas: [{ id: 1, primary: true }]
      }

      expect(hasAreasChanged(sessionData)).toBe(false)
    })

    test('returns false when originalData missing', () => {
      const sessionData = {
        editMode: true,
        areas: [{ id: 1, primary: true }]
      }

      expect(hasAreasChanged(sessionData)).toBe(false)
    })

    test('handles null/undefined areas', () => {
      const sessionData = {
        editMode: true,
        originalData: { areas: null },
        areas: undefined
      }

      expect(hasAreasChanged(sessionData)).toBe(false)
    })
  })

  describe('initializeEditSessionPreHandler', () => {
    test('initializes session when encodedId and accountData present', () => {
      const mockRequest = {
        params: { encodedId: 'abc123' },
        yar: {
          get: vi.fn().mockReturnValue(null),
          set: vi.fn()
        },
        pre: {
          accountData: {
            account: {
              id: 1,
              admin: false,
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              areas: []
            },
            areasData: []
          }
        }
      }
      const mockH = { continue: 'continue' }

      determineResponsibilityFromAreas.mockReturnValue('EA')

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result).toBe('continue')
    })

    test('initializes session when existing session is for different user', () => {
      const mockRequest = {
        params: { encodedId: 'xyz789' },
        yar: {
          get: vi.fn().mockReturnValue({
            editMode: true,
            encodedId: 'abc123'
          }),
          set: vi.fn()
        },
        pre: {
          accountData: {
            account: {
              id: 2,
              admin: false,
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              areas: []
            },
            areasData: []
          }
        }
      }
      const mockH = { continue: 'continue' }

      determineResponsibilityFromAreas.mockReturnValue('PSO')

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result).toBe('continue')
    })

    test('does not initialize when session already exists for same user', () => {
      const mockRequest = {
        params: { encodedId: 'abc123' },
        yar: {
          get: vi.fn().mockReturnValue({
            editMode: true,
            encodedId: 'abc123'
          }),
          set: vi.fn()
        },
        pre: {
          accountData: {
            account: { id: 1 },
            areasData: []
          }
        }
      }
      const mockH = { continue: 'continue' }

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
      expect(result).toBe('continue')
    })

    test('does not initialize when no encodedId', () => {
      const mockRequest = {
        params: {},
        yar: {
          get: vi.fn(),
          set: vi.fn()
        },
        pre: { accountData: {} }
      }
      const mockH = { continue: 'continue' }

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
      expect(result).toBe('continue')
    })

    test('does not initialize when no accountData in pre', () => {
      const mockRequest = {
        params: { encodedId: 'abc123' },
        yar: {
          get: vi.fn(),
          set: vi.fn()
        },
        pre: {}
      }
      const mockH = { continue: 'continue' }

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
      expect(result).toBe('continue')
    })
  })
})
