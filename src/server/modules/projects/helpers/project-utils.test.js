import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getBackLink,
  validatePayload,
  getSessionData,
  updateSessionData,
  resetSessionData,
  buildViewData,
  loggedInUserAreas,
  loggedInUserMainArea,
  loggedInUserAreaOptions,
  navigateToProjectOverview,
  requiredInterventionTypesForProjectType,
  getProjectStep,
  getCurrentFinancialYearStartYear,
  buildFinancialYearLabel,
  buildFinancialYearOptions,
  getAfterMarchYear,
  isYearBeyondRange,
  getMonthName,
  formatDate,
  formatFileSize
} from './project-utils.js'
import {
  PROJECT_SESSION_KEY,
  PROJECT_TYPES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import Joi from 'joi'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

vi.mock('../../../common/helpers/error-renderer/index.js', () => ({
  extractJoiErrors: vi.fn()
}))

describe('project-utils', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      t: vi.fn((key) => key),
      params: {},
      payload: {},
      route: { path: '/projects/test' },
      yar: {
        get: vi.fn(),
        set: vi.fn()
      }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getAuthSession.mockReturnValue({
      user: {
        id: '1',
        areas: []
      }
    })
  })

  describe('getBackLink', () => {
    test('should return default back link for non-edit mode', () => {
      const result = getBackLink(mockRequest, { targetURL: '/test' })
      expect(result).toEqual({
        text: 'common.back_link',
        href: '/test'
      })
    })

    test('should return back link with reference number in edit mode', () => {
      mockRequest.params.referenceNumber = 'REF123'
      const result = getBackLink(mockRequest, {
        targetURL: '/test',
        targetEditURL: '/edit/{referenceNumber}/test'
      })
      expect(result).toEqual({
        text: 'common.back_link',
        href: '/edit/REF123/test'
      })
    })

    test('should return overview link when conditionalRedirect is true in edit mode', () => {
      mockRequest.params.referenceNumber = 'REF123'
      const result = getBackLink(mockRequest, {
        targetURL: '/test',
        conditionalRedirect: true
      })
      expect(result).toEqual({
        text: 'common.back_to_overview',
        href: ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      })
    })

    test('should use targetURL when not in edit mode even with conditionalRedirect', () => {
      const result = getBackLink(mockRequest, {
        targetURL: '/test',
        conditionalRedirect: true
      })
      expect(result).toEqual({
        text: 'common.back_link',
        href: '/test'
      })
    })

    test('should default to / when no targetURL provided', () => {
      const result = getBackLink(mockRequest)
      expect(result).toEqual({
        text: 'common.back_link',
        href: '/'
      })
    })
  })

  describe('validatePayload', () => {
    const mockSchema = Joi.object({
      name: Joi.string().required()
    })

    test('should return null when no schema provided', () => {
      const result = validatePayload(mockRequest, mockH, {
        template: 'test.njk',
        viewData: {}
      })
      expect(result).toBeNull()
    })

    test('should return null when validation passes', () => {
      mockRequest.payload = { name: 'Test' }
      const result = validatePayload(mockRequest, mockH, {
        template: 'test.njk',
        schema: mockSchema,
        viewData: {}
      })
      expect(result).toBeNull()
    })

    test('should return view with errors when validation fails', () => {
      mockRequest.payload = {}
      const mockErrors = { name: 'Required' }
      extractJoiErrors.mockReturnValue(mockErrors)

      validatePayload(mockRequest, mockH, {
        template: 'test.njk',
        schema: mockSchema,
        viewData: { title: 'Test' }
      })

      expect(extractJoiErrors).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith('test.njk', {
        title: 'Test',
        fieldErrors: mockErrors
      })
    })
  })

  describe('getSessionData', () => {
    test('should return session data from yar', () => {
      const sessionData = { name: 'Test Project' }
      mockRequest.yar.get.mockReturnValue(sessionData)

      const result = getSessionData(mockRequest)

      expect(mockRequest.yar.get).toHaveBeenCalledWith(PROJECT_SESSION_KEY)
      expect(result).toEqual(sessionData)
    })

    test('should return empty object when no session data', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = getSessionData(mockRequest)

      expect(result).toEqual({})
    })
  })

  describe('updateSessionData', () => {
    test('should merge data with existing session', () => {
      const existingData = { name: 'Test', areaId: 1 }
      const newData = { projectType: 'DEF' }
      mockRequest.yar.get.mockReturnValue(existingData)

      updateSessionData(mockRequest, newData)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(PROJECT_SESSION_KEY, {
        ...existingData,
        ...newData
      })
    })

    test('should handle empty existing session', () => {
      mockRequest.yar.get.mockReturnValue(null)
      const newData = { name: 'Test' }

      updateSessionData(mockRequest, newData)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        PROJECT_SESSION_KEY,
        newData
      )
    })
  })

  describe('resetSessionData', () => {
    test('should reset session to default state', () => {
      resetSessionData(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(PROJECT_SESSION_KEY, {
        journeyStarted: true,
        isEdit: false,
        [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: '',
        [PROJECT_PAYLOAD_FIELDS.SLUG]: ''
      })
    })
  })

  describe('buildViewData', () => {
    test('should build complete view data object', () => {
      mockRequest.yar.get.mockReturnValue({ name: 'Test' })

      const result = buildViewData(mockRequest, {
        localKeyPrefix: 'test.page',
        backLinkOptions: { targetURL: '/back' }
      })

      expect(result).toMatchObject({
        pageTitle: 'test.page.title',
        localKeyPrefix: 'test.page',
        backLinkURL: '/back',
        backLinkText: 'common.back_link',
        isEditMode: false,
        referenceNumber: '',
        fieldErrors: {},
        errorCode: '',
        formData: { name: 'Test' },
        sessionData: { name: 'Test' }
      })
    })

    test('should detect edit mode from params', () => {
      mockRequest.params.referenceNumber = 'REF123'
      mockRequest.yar.get.mockReturnValue({})

      const result = buildViewData(mockRequest, {
        localKeyPrefix: 'test.page'
      })

      expect(result.isEditMode).toBe(true)
      expect(result.referenceNumber).toBe('REF123')
    })

    test('should merge form data with session data', () => {
      mockRequest.yar.get.mockReturnValue({ name: 'Session' })

      const result = buildViewData(mockRequest, {
        localKeyPrefix: 'test.page',
        formData: { name: 'Form' }
      })

      expect(result.formData.name).toBe('Form')
    })

    test('should include additional data', () => {
      mockRequest.yar.get.mockReturnValue({})

      const result = buildViewData(mockRequest, {
        localKeyPrefix: 'test.page',
        additionalData: { custom: 'value' }
      })

      expect(result.custom).toBe('value')
    })

    test('should include field errors and error code', () => {
      mockRequest.yar.get.mockReturnValue({})

      const result = buildViewData(mockRequest, {
        localKeyPrefix: 'test.page',
        fieldErrors: { name: 'Error' },
        errorCode: 'ERR_001'
      })

      expect(result.fieldErrors).toEqual({ name: 'Error' })
      expect(result.errorCode).toBe('ERR_001')
    })
  })

  describe('loggedInUserAreas', () => {
    test('should return user areas', () => {
      const areas = [{ areaId: '1', name: 'Area 1' }]
      getAuthSession.mockReturnValue({
        user: { areas }
      })

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual(areas)
    })

    test('should return empty array when no areas', () => {
      getAuthSession.mockReturnValue({
        user: {}
      })

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual([])
    })

    test('should return empty array when no session', () => {
      getAuthSession.mockReturnValue(null)

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual([])
    })
  })

  describe('loggedInUserMainArea', () => {
    test('should return primary area when available', () => {
      const areas = [
        { areaId: '1', name: 'Area 1', primary: false },
        { areaId: '2', name: 'Area 2', primary: true }
      ]
      getAuthSession.mockReturnValue({
        user: { areas }
      })

      const result = loggedInUserMainArea(mockRequest)

      expect(result).toEqual(areas[1])
    })

    test('should return first area when no primary', () => {
      const areas = [
        { areaId: '1', name: 'Area 1' },
        { areaId: '2', name: 'Area 2' }
      ]
      getAuthSession.mockReturnValue({
        user: { areas }
      })

      const result = loggedInUserMainArea(mockRequest)

      expect(result).toEqual(areas[0])
    })

    test('should return null when no areas', () => {
      getAuthSession.mockReturnValue({
        user: { areas: [] }
      })

      const result = loggedInUserMainArea(mockRequest)

      expect(result).toBeNull()
    })
  })

  describe('loggedInUserAreaOptions', () => {
    test('should return formatted area options', () => {
      const areas = [
        { areaId: '1', name: 'Area 1' },
        { areaId: '2', name: 'Area 2' }
      ]
      getAuthSession.mockReturnValue({
        user: { areas }
      })

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' },
        { text: 'Area 1', value: 1 },
        { text: 'Area 2', value: 2 }
      ])
    })

    test('should return only placeholder when no areas', () => {
      getAuthSession.mockReturnValue({
        user: { areas: [] }
      })

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' }
      ])
    })
  })

  describe('navigateToProjectOverview', () => {
    test('should redirect to project overview', () => {
      navigateToProjectOverview('REF123', mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })
  })

  describe('requiredInterventionTypesForProjectType', () => {
    test('should return false for HCR', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.HCR)).toBe(
        false
      )
    })

    test('should return false for STR', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.STR)).toBe(
        false
      )
    })

    test('should return false for STU', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.STU)).toBe(
        false
      )
    })

    test('should return false for ELO', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.ELO)).toBe(
        false
      )
    })

    test('should return true for DEF', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.DEF)).toBe(
        true
      )
    })

    test('should return true for REP', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.REP)).toBe(
        true
      )
    })

    test('should return true for REF', () => {
      expect(requiredInterventionTypesForProjectType(PROJECT_TYPES.REF)).toBe(
        true
      )
    })
  })

  describe('getProjectStep', () => {
    test('should extract last part of route path', () => {
      mockRequest.route.path = '/projects/create/name'
      expect(getProjectStep(mockRequest)).toBe('name')
    })

    test('should handle route with parameters', () => {
      mockRequest.route.path = '/projects/{id}/edit'
      expect(getProjectStep(mockRequest)).toBe('edit')
    })

    test('should handle single segment path', () => {
      mockRequest.route.path = '/projects'
      expect(getProjectStep(mockRequest)).toBe('projects')
    })
  })

  describe('getCurrentFinancialYearStartYear', () => {
    test('should return current year when month is >= April (month 4)', () => {
      const result = getCurrentFinancialYearStartYear(new Date('2024-04-15'))
      expect(result).toBe(2024)
    })

    test('should return previous year when month is < April', () => {
      const result = getCurrentFinancialYearStartYear(new Date('2024-03-15'))
      expect(result).toBe(2023)
    })

    test('should handle January correctly', () => {
      const result = getCurrentFinancialYearStartYear(new Date('2024-01-15'))
      expect(result).toBe(2023)
    })

    test('should handle December correctly', () => {
      const result = getCurrentFinancialYearStartYear(new Date('2024-12-15'))
      expect(result).toBe(2024)
    })

    test('should use current date when no date provided', () => {
      const result = getCurrentFinancialYearStartYear()
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThan(2000)
    })
  })

  describe('buildFinancialYearLabel', () => {
    test('should build correct label', () => {
      const result = buildFinancialYearLabel(2024)
      expect(result).toBe('April 2024 to March 2025')
    })

    test('should handle different years', () => {
      expect(buildFinancialYearLabel(2023)).toBe('April 2023 to March 2024')
      expect(buildFinancialYearLabel(2025)).toBe('April 2025 to March 2026')
    })
  })

  describe('buildFinancialYearOptions', () => {
    test('should build array of year options', () => {
      const result = buildFinancialYearOptions(2024, 3)
      expect(result).toEqual([
        { value: 2024, text: 'April 2024 to March 2025' },
        { value: 2025, text: 'April 2025 to March 2026' },
        { value: 2026, text: 'April 2026 to March 2027' }
      ])
    })

    test('should default to 6 years', () => {
      const result = buildFinancialYearOptions(2024)
      expect(result).toHaveLength(6)
      expect(result[0].value).toBe(2024)
      expect(result[5].value).toBe(2029)
    })

    test('should handle count of 1', () => {
      const result = buildFinancialYearOptions(2024, 1)
      expect(result).toEqual([
        { value: 2024, text: 'April 2024 to March 2025' }
      ])
    })
  })

  describe('getAfterMarchYear', () => {
    test('should calculate correct year after range', () => {
      expect(getAfterMarchYear(2024, 6)).toBe(2030)
    })

    test('should default to 6 years', () => {
      expect(getAfterMarchYear(2024)).toBe(2030)
    })

    test('should handle different counts', () => {
      expect(getAfterMarchYear(2024, 1)).toBe(2025)
      expect(getAfterMarchYear(2024, 10)).toBe(2034)
    })
  })

  describe('isYearBeyondRange', () => {
    test('should return false when year is null', () => {
      expect(isYearBeyondRange(null, 2024)).toBe(false)
    })

    test('should return false when year is undefined', () => {
      expect(isYearBeyondRange(undefined, 2024)).toBe(false)
    })

    test('should return false when year is within range', () => {
      expect(isYearBeyondRange(2024, 2024)).toBe(false)
      expect(isYearBeyondRange(2028, 2024)).toBe(false)
    })

    test('should return true when year is beyond range', () => {
      // getAfterMarchYear(2024) - 1 = 2029
      expect(isYearBeyondRange(2030, 2024)).toBe(true)
      expect(isYearBeyondRange(2035, 2024)).toBe(true)
    })

    test('should handle edge case at boundary', () => {
      // Default count is 6, so max year is 2029 for minYear 2024
      expect(isYearBeyondRange(2029, 2024)).toBe(false)
      expect(isYearBeyondRange(2030, 2024)).toBe(true)
    })
  })

  describe('getMonthName', () => {
    test('should return correct month names for numbers 1-12', () => {
      expect(getMonthName(1)).toBe('January')
      expect(getMonthName(2)).toBe('February')
      expect(getMonthName(3)).toBe('March')
      expect(getMonthName(4)).toBe('April')
      expect(getMonthName(5)).toBe('May')
      expect(getMonthName(6)).toBe('June')
      expect(getMonthName(7)).toBe('July')
      expect(getMonthName(8)).toBe('August')
      expect(getMonthName(9)).toBe('September')
      expect(getMonthName(10)).toBe('October')
      expect(getMonthName(11)).toBe('November')
      expect(getMonthName(12)).toBe('December')
    })

    test('should handle string month numbers', () => {
      expect(getMonthName('1')).toBe('January')
      expect(getMonthName('12')).toBe('December')
    })

    test('should return original value for invalid month', () => {
      expect(getMonthName(0)).toBe(0)
      expect(getMonthName(13)).toBe(13)
      expect(getMonthName('invalid')).toBe('invalid')
    })
  })

  describe('formatDate', () => {
    test('should format date correctly', () => {
      expect(formatDate(6, 2024)).toBe('June 2024')
      expect(formatDate(12, 2023)).toBe('December 2023')
      expect(formatDate(1, 2025)).toBe('January 2025')
    })

    test('should handle string inputs', () => {
      expect(formatDate('6', '2024')).toBe('June 2024')
    })

    test('should return null when month is missing', () => {
      expect(formatDate(null, 2024)).toBeNull()
      expect(formatDate(undefined, 2024)).toBeNull()
    })

    test('should return null when year is missing', () => {
      expect(formatDate(6, null)).toBeNull()
      expect(formatDate(6, undefined)).toBeNull()
    })

    test('should return null when both are missing', () => {
      expect(formatDate(null, null)).toBeNull()
    })
  })

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B')
      expect(formatFileSize(512)).toBe('512 B')
      expect(formatFileSize(1023)).toBe('1023 B')
    })

    test('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
      expect(formatFileSize(3456)).toBe('3.38 KB')
    })

    test('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB')
      expect(formatFileSize(2097152)).toBe('2 MB')
      expect(formatFileSize(1572864)).toBe('1.5 MB')
    })

    test('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB')
      expect(formatFileSize(2147483648)).toBe('2 GB')
    })

    test('should handle null or undefined', () => {
      expect(formatFileSize(null)).toBe('0 B')
      expect(formatFileSize(undefined)).toBe('0 B')
    })
  })
})
