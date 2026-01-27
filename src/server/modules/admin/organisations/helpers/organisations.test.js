import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  dateToISOString,
  isoStringToDate,
  initializeEditSession,
  detectChanges,
  initializeEditSessionPreHandler,
  fetchOrganisationForAdmin,
  verifyOrganisationType,
  getOrganisationTypeSelectionPath,
  buildFormDataFromOrganisation
} from './organisations.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { ORGANISATION_SESSION_KEYS } from '../../../../common/constants/organisations.js'

vi.mock('../../../../common/helpers/security/encoder.js')
vi.mock('../../../../common/services/areas/areas-service.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')

describe('organisations helpers', () => {
  describe('dateToISOString', () => {
    it('should convert valid date object to ISO string', () => {
      const dateObj = { day: '15', month: '3', year: '2025' }
      expect(dateToISOString(dateObj)).toBe('2025-03-15')
    })

    it('should pad single digit day and month', () => {
      const dateObj = { day: '5', month: '9', year: '2025' }
      expect(dateToISOString(dateObj)).toBe('2025-09-05')
    })

    it('should return null for empty date object', () => {
      expect(dateToISOString(null)).toBeNull()
      expect(dateToISOString(undefined)).toBeNull()
      expect(dateToISOString({})).toBeNull()
    })

    it('should return null if any component is missing', () => {
      expect(dateToISOString({ day: '', month: '', year: '' })).toBeNull()
      expect(dateToISOString({ day: '15', month: '', year: '2025' })).toBeNull()
      expect(dateToISOString({ day: '15', month: '3', year: '' })).toBeNull()
      expect(dateToISOString({ day: '', month: '3', year: '2025' })).toBeNull()
    })

    it('should handle numeric values', () => {
      const dateObj = { day: 5, month: 9, year: 2025 }
      expect(dateToISOString(dateObj)).toBe('2025-09-05')
    })
  })

  describe('isoStringToDate', () => {
    it('should convert ISO string to date object', () => {
      const result = isoStringToDate('2025-03-15')
      expect(result).toEqual({ day: '15', month: '3', year: '2025' })
    })

    it('should handle dates with single digit day/month', () => {
      const result = isoStringToDate('2025-01-05')
      expect(result).toEqual({ day: '5', month: '1', year: '2025' })
    })

    it('should return empty object for null/undefined', () => {
      expect(isoStringToDate(null)).toEqual({ day: '', month: '', year: '' })
      expect(isoStringToDate(undefined)).toEqual({
        day: '',
        month: '',
        year: ''
      })
      expect(isoStringToDate('')).toEqual({ day: '', month: '', year: '' })
    })

    it('should handle end of month dates', () => {
      const result = isoStringToDate('2025-12-31')
      expect(result).toEqual({ day: '31', month: '12', year: '2025' })
    })
  })

  describe('initializeEditSession', () => {
    let mockRequest
    let mockOrganisationData

    beforeEach(() => {
      mockRequest = {
        params: { encodedId: 'abc123' },
        yar: {
          set: vi.fn()
        }
      }

      mockOrganisationData = {
        organisation: {
          id: '123',
          area_type: 'Authority',
          name: 'Test Authority',
          identifier: 'AUTH001',
          parent_id: null,
          sub_type: null,
          end_date: '2025-12-31'
        }
      }
    })

    it('should initialize edit session with organisation data', () => {
      const result = initializeEditSession(mockRequest, mockOrganisationData)

      expect(result).toEqual({
        areaType: 'Authority',
        name: 'Test Authority',
        identifier: 'AUTH001',
        parentId: '',
        subType: '',
        endDate: { day: '31', month: '12', year: '2025' },
        editMode: true,
        encodedId: 'abc123',
        organisationId: '123',
        originalData: {
          areaType: 'Authority',
          name: 'Test Authority',
          identifier: 'AUTH001',
          parentId: null,
          subType: null,
          endDate: '2025-12-31'
        }
      })

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA,
        expect.objectContaining({ editMode: true })
      )
    })

    it('should handle organisation without end date', () => {
      mockOrganisationData.organisation.end_date = null

      const result = initializeEditSession(mockRequest, mockOrganisationData)

      expect(result.endDate).toEqual({ day: '', month: '', year: '' })
      expect(result.originalData.endDate).toBeNull()
    })

    it('should handle organisation with parent and subtype', () => {
      mockOrganisationData.organisation.parent_id = '10'
      mockOrganisationData.organisation.sub_type = 'RFCC-01'

      const result = initializeEditSession(mockRequest, mockOrganisationData)

      expect(result.parentId).toBe('10')
      expect(result.subType).toBe('RFCC-01')
    })
  })

  describe('detectChanges', () => {
    it('should detect no changes when data matches original', () => {
      const sessionData = {
        editMode: true,
        name: 'Test Authority',
        identifier: 'AUTH001',
        areaType: 'Authority',
        parentId: null,
        subType: null,
        endDate: { day: '31', month: '12', year: '2025' },
        originalData: {
          name: 'Test Authority',
          identifier: 'AUTH001',
          areaType: 'Authority',
          parentId: null,
          subType: null,
          endDate: '2025-12-31'
        }
      }

      const result = detectChanges(sessionData)

      expect(result).toEqual({
        hasChanges: false,
        changedFields: []
      })
    })

    it('should detect name change', () => {
      const sessionData = {
        editMode: true,
        name: 'Updated Authority',
        identifier: 'AUTH001',
        areaType: 'Authority',
        parentId: null,
        subType: null,
        endDate: { day: '', month: '', year: '' },
        originalData: {
          name: 'Test Authority',
          identifier: 'AUTH001',
          areaType: 'Authority',
          parentId: null,
          subType: null,
          endDate: null
        }
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('name')
    })

    it('should detect identifier change', () => {
      const sessionData = {
        editMode: true,
        name: 'Test Authority',
        identifier: 'AUTH002',
        areaType: 'Authority',
        parentId: null,
        subType: null,
        endDate: { day: '', month: '', year: '' },
        originalData: {
          name: 'Test Authority',
          identifier: 'AUTH001',
          areaType: 'Authority',
          parentId: null,
          subType: null,
          endDate: null
        }
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('identifier')
    })

    it('should detect multiple changes', () => {
      const sessionData = {
        editMode: true,
        name: 'Updated Authority',
        identifier: 'AUTH002',
        areaType: 'RMA',
        parentId: '20',
        subType: 'AUTH001',
        endDate: { day: '15', month: '6', year: '2026' },
        originalData: {
          name: 'Test Authority',
          identifier: 'AUTH001',
          areaType: 'Authority',
          parentId: null,
          subType: null,
          endDate: null
        }
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toHaveLength(6)
      expect(result.changedFields).toContain('name')
      expect(result.changedFields).toContain('identifier')
      expect(result.changedFields).toContain('areaType')
      expect(result.changedFields).toContain('parentId')
      expect(result.changedFields).toContain('subType')
      expect(result.changedFields).toContain('endDate')
    })

    it('should detect end date change', () => {
      const sessionData = {
        editMode: true,
        name: 'Test Authority',
        identifier: 'AUTH001',
        areaType: 'Authority',
        parentId: null,
        subType: null,
        endDate: { day: '15', month: '6', year: '2026' },
        originalData: {
          name: 'Test Authority',
          identifier: 'AUTH001',
          areaType: 'Authority',
          parentId: null,
          subType: null,
          endDate: '2025-12-31'
        }
      }

      const result = detectChanges(sessionData)

      expect(result.hasChanges).toBe(true)
      expect(result.changedFields).toContain('endDate')
    })

    it('should return no changes if not in edit mode', () => {
      const sessionData = {
        editMode: false,
        name: 'Updated Authority',
        originalData: {
          name: 'Test Authority'
        }
      }

      const result = detectChanges(sessionData)

      expect(result).toEqual({
        hasChanges: false,
        changedFields: []
      })
    })

    it('should return no changes if no original data', () => {
      const sessionData = {
        editMode: true,
        name: 'Updated Authority'
      }

      const result = detectChanges(sessionData)

      expect(result).toEqual({
        hasChanges: false,
        changedFields: []
      })
    })

    it('should return no changes if sessionData is null', () => {
      const result = detectChanges(null)

      expect(result).toEqual({
        hasChanges: false,
        changedFields: []
      })
    })
  })

  describe('initializeEditSessionPreHandler', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = {
        params: {},
        yar: {
          get: vi.fn(),
          set: vi.fn()
        },
        pre: {}
      }

      mockH = {
        continue: Symbol('continue')
      }
    })

    it('should continue if no encodedId', () => {
      mockRequest.params = {}

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    it('should continue if no organisationData in pre', () => {
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.pre = {}

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    it('should initialize session if encodedId and organisationData exist', () => {
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.pre = {
        organisationData: {
          organisation: {
            id: '123',
            area_type: 'Authority',
            name: 'Test Authority',
            identifier: 'AUTH001',
            parent_id: null,
            sub_type: null,
            end_date: null
          }
        }
      }
      mockRequest.yar.get.mockReturnValue(null)

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    it('should not reinitialize if already in edit mode for same organisation', () => {
      mockRequest.params = { encodedId: 'abc123' }
      mockRequest.pre = {
        organisationData: {
          organisation: {
            id: '123',
            area_type: 'Authority',
            name: 'Test Authority',
            identifier: 'AUTH001',
            parent_id: null,
            sub_type: null,
            end_date: null
          }
        }
      }
      mockRequest.yar.get.mockReturnValue({
        editMode: true,
        encodedId: 'abc123'
      })

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })

    it('should reinitialize if different encodedId', () => {
      mockRequest.params = { encodedId: 'xyz789' }
      mockRequest.pre = {
        organisationData: {
          organisation: {
            id: '456',
            area_type: 'PSO Area',
            name: 'Test PSO',
            identifier: 'PSO001',
            parent_id: '10',
            sub_type: 'RFCC-01',
            end_date: null
          }
        }
      }
      mockRequest.yar.get.mockReturnValue({
        editMode: true,
        encodedId: 'abc123'
      })

      const result = initializeEditSessionPreHandler(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })
  })

  describe('fetchOrganisationForAdmin', () => {
    let mockRequest
    let mockH
    let mockAreasService

    beforeEach(async () => {
      const encoderModule =
        await import('../../../../common/helpers/security/encoder.js')
      const areasServiceModule =
        await import('../../../../common/services/areas/areas-service.js')
      const authModule =
        await import('../../../../common/helpers/auth/session-manager.js')

      mockAreasService = {
        getAreaById: vi.fn()
      }

      encoderModule.decodeUserId = vi.fn()
      areasServiceModule.createAreasService = vi
        .fn()
        .mockReturnValue(mockAreasService)
      authModule.getAuthSession = vi.fn()

      mockRequest = {
        params: {},
        logger: {
          warn: vi.fn(),
          error: vi.fn()
        },
        server: {},
        getAreas: vi.fn().mockResolvedValue({})
      }

      mockH = {
        continue: Symbol('continue'),
        redirect: vi.fn().mockReturnThis(),
        takeover: vi.fn().mockReturnThis()
      }
    })

    it('should continue if no encodedId', async () => {
      mockRequest.params = {}

      const result = await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    it('should redirect if encodedId is invalid', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      decodeUserId.mockReturnValue(null)

      mockRequest.params = { encodedId: 'invalid' }

      await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        { encodedId: 'invalid' },
        'Invalid encoded organisation ID'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    it('should redirect if no access token', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      const { getAuthSession } =
        await import('../../../../common/helpers/auth/session-manager.js')

      decodeUserId.mockReturnValue('123')
      getAuthSession.mockReturnValue(null)

      mockRequest.params = { encodedId: 'abc123' }

      await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'No access token found'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.LOGIN)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    it('should redirect if organisation not found', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      const { getAuthSession } =
        await import('../../../../common/helpers/auth/session-manager.js')

      decodeUserId.mockReturnValue('123')
      getAuthSession.mockReturnValue({ accessToken: 'test-token' })
      mockAreasService.getAreaById.mockResolvedValue(null)

      mockRequest.params = { encodedId: 'abc123' }

      await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Organisation not found: 123'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    it('should return organisation data on success', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      const { getAuthSession } =
        await import('../../../../common/helpers/auth/session-manager.js')

      decodeUserId.mockReturnValue('123')
      getAuthSession.mockReturnValue({ accessToken: 'test-token' })

      const mockOrganisation = {
        id: '123',
        name: 'Test Authority',
        area_type: 'Authority'
      }
      mockAreasService.getAreaById.mockResolvedValue(mockOrganisation)

      mockRequest.params = { encodedId: 'abc123' }

      const result = await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(result).toEqual({
        organisation: mockOrganisation,
        areasData: {},
        organisationId: '123'
      })
      expect(mockAreasService.getAreaById).toHaveBeenCalledWith(
        '123',
        'test-token'
      )
    })

    it('should handle errors and redirect', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      const { getAuthSession } =
        await import('../../../../common/helpers/auth/session-manager.js')

      decodeUserId.mockReturnValue('123')
      getAuthSession.mockReturnValue({ accessToken: 'test-token' })

      const error = new Error('API error')
      mockAreasService.getAreaById.mockRejectedValue(error)

      mockRequest.params = { encodedId: 'abc123' }

      await fetchOrganisationForAdmin(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error fetching organisation 123:',
        error
      )
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
      expect(mockH.takeover).toHaveBeenCalled()
    })
  })

  describe('verifyOrganisationType', () => {
    it('should return true if types match', () => {
      const organisation = { areaType: 'authority' }
      expect(verifyOrganisationType(organisation, 'authority')).toBe(true)
    })

    it('should return false if types do not match', () => {
      const organisation = { areaType: 'authority' }
      expect(verifyOrganisationType(organisation, 'pso')).toBe(false)
    })

    it('should return falsy if organisation is null', () => {
      expect(verifyOrganisationType(null, 'authority')).toBeFalsy()
    })

    it('should return falsy if organisation is undefined', () => {
      expect(verifyOrganisationType(undefined, 'authority')).toBeFalsy()
    })

    it('should return falsy if areaType is missing', () => {
      const organisation = { name: 'Test' }
      expect(verifyOrganisationType(organisation, 'authority')).toBeFalsy()
    })
  })

  describe('getOrganisationTypeSelectionPath', () => {
    it('should return correct path', () => {
      expect(getOrganisationTypeSelectionPath()).toBe(
        `${ROUTES.ADMIN.ORGANISATIONS}/add`
      )
    })
  })

  describe('buildFormDataFromOrganisation', () => {
    it('should build form data from organisation with all fields', () => {
      const organisation = {
        area_type: 'RMA',
        name: 'Test RMA',
        identifier: 'RMA001',
        parent_id: '20',
        sub_type: 'AUTH001',
        end_date: '2025-12-31'
      }

      const result = buildFormDataFromOrganisation(organisation)

      expect(result).toEqual({
        areaType: 'RMA',
        name: 'Test RMA',
        identifier: 'RMA001',
        parentId: '20',
        subType: 'AUTH001',
        endDate: { day: '31', month: '12', year: '2025' }
      })
    })

    it('should handle organisation with null values', () => {
      const organisation = {
        area_type: 'Authority',
        name: 'Test Authority',
        identifier: null,
        parent_id: null,
        sub_type: null,
        end_date: null
      }

      const result = buildFormDataFromOrganisation(organisation)

      expect(result).toEqual({
        areaType: 'Authority',
        name: 'Test Authority',
        identifier: '',
        parentId: '',
        subType: '',
        endDate: { day: '', month: '', year: '' }
      })
    })

    it('should handle organisation with empty strings', () => {
      const organisation = {
        area_type: 'PSO Area',
        name: '',
        identifier: '',
        parent_id: '',
        sub_type: '',
        end_date: ''
      }

      const result = buildFormDataFromOrganisation(organisation)

      expect(result).toEqual({
        areaType: 'PSO Area',
        name: '',
        identifier: '',
        parentId: '',
        subType: '',
        endDate: { day: '', month: '', year: '' }
      })
    })
  })
})
