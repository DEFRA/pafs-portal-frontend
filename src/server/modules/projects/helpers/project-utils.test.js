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
  formatNumberWithCommas,
  formatFileSize,
  getProjectStateTag,
  isConfidenceRestrictedProjectType,
  buildProcessedFundingValues,
  computeFundingSourceTotals,
  buildIdToYearMap,
  buildContributorsByYear,
  getUniqueContributorNamesFromDb
} from './project-utils.js'
import {
  PROJECT_SESSION_KEY,
  PROJECT_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS
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
        fieldErrors: mockErrors,
        errors: [
          {
            text: 'Required',
            href: '#name'
          }
        ],
        formData: mockRequest.payload
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
    test('should return user areas for non-admin', () => {
      const areas = [{ areaId: '1', name: 'Area 1' }]
      getAuthSession.mockReturnValue({
        user: { areas }
      })

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual(areas)
    })

    test('should return all RMA areas for admin users', () => {
      const rmaAreas = [
        { id: '10', name: 'RMA Area 1' },
        { id: '20', name: 'RMA Area 2' }
      ]
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [{ areaId: '10', name: 'RMA Area 1' }] }
      })
      mockRequest.server = { app: { areasByType: { RMA: rmaAreas } } }

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual(rmaAreas)
    })

    test('should return empty array for admin when areasByType is null', () => {
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [] }
      })
      mockRequest.server = { app: { areasByType: null } }

      const result = loggedInUserAreas(mockRequest)

      expect(result).toEqual([])
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
    test('should return formatted area options for non-admin users', () => {
      const areas = [
        { areaId: '1', name: 'Area 1' },
        { areaId: '2', name: 'Area 2' }
      ]
      getAuthSession.mockReturnValue({
        user: { admin: false, areas }
      })

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' },
        { text: 'Area 1', value: 1 },
        { text: 'Area 2', value: 2 }
      ])
    })

    test('should return only placeholder when non-admin has no areas', () => {
      getAuthSession.mockReturnValue({
        user: { admin: false, areas: [] }
      })

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' }
      ])
    })

    test('should return all RMA areas for admin users', () => {
      const rmaAreas = [
        { id: '10', name: 'RMA Area 1' },
        { id: '20', name: 'RMA Area 2' },
        { id: '30', name: 'RMA Area 3' }
      ]
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [{ areaId: '10', name: 'RMA Area 1' }] }
      })
      mockRequest.server = {
        app: {
          areasByType: {
            RMA: rmaAreas,
            PSO: [],
            EA: []
          }
        }
      }

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' },
        { text: 'RMA Area 1', value: 10 },
        { text: 'RMA Area 2', value: 20 },
        { text: 'RMA Area 3', value: 30 }
      ])
    })

    test('should return only placeholder when admin but no RMA areas in areasByType', () => {
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [] }
      })
      mockRequest.server = {
        app: {
          areasByType: {
            RMA: [],
            PSO: [],
            EA: []
          }
        }
      }

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' }
      ])
    })

    test('should return only placeholder when admin but areasByType is null', () => {
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [] }
      })
      mockRequest.server = {
        app: {
          areasByType: null
        }
      }

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' }
      ])
    })

    test('should handle areas with areaId property for non-admin', () => {
      const areas = [{ areaId: '5', name: 'Test Area' }]
      getAuthSession.mockReturnValue({
        user: { admin: false, areas }
      })

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' },
        { text: 'Test Area', value: 5 }
      ])
    })

    test('should handle areas with id property for admin', () => {
      const rmaAreas = [{ id: '15', name: 'Admin RMA Area' }]
      getAuthSession.mockReturnValue({
        user: { admin: true, areas: [] }
      })
      mockRequest.server = {
        app: {
          areasByType: {
            RMA: rmaAreas
          }
        }
      }

      const result = loggedInUserAreaOptions(mockRequest)

      expect(result).toEqual([
        { text: 'projects.area_selection.select_rma_option_text', value: '' },
        { text: 'Admin RMA Area', value: 15 }
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

  describe('formatNumberWithCommas', () => {
    test('should format number-like values with comma separators', () => {
      expect(formatNumberWithCommas(1234567)).toBe('1,234,567')
      expect(formatNumberWithCommas('123456789012345678')).toBe(
        '123,456,789,012,345,678'
      )
    })

    test('should strip non-digits before formatting', () => {
      expect(formatNumberWithCommas('1,234,567')).toBe('1,234,567')
      expect(formatNumberWithCommas('£1234567')).toBe('1,234,567')
    })

    test('should return null for empty or invalid values', () => {
      expect(formatNumberWithCommas(null)).toBeNull()
      expect(formatNumberWithCommas(undefined)).toBeNull()
      expect(formatNumberWithCommas('')).toBeNull()
      expect(formatNumberWithCommas('abc')).toBeNull()
    })

    test('should format negative numbers with comma separators', () => {
      expect(formatNumberWithCommas(-1234567)).toBe('-1,234,567')
      expect(formatNumberWithCommas('-150000')).toBe('-150,000')
      expect(formatNumberWithCommas('-5')).toBe('-5')
    })

    test('should preserve minus sign when stripping other non-digits', () => {
      expect(formatNumberWithCommas('-£1234567')).toBe('-1,234,567')
      expect(formatNumberWithCommas('-1,234,567')).toBe('-1,234,567')
    })
  })

  describe('getProjectStateTag', () => {
    test('should return light blue tag for DRAFT status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.DRAFT)).toBe(
        'govuk-tag--light-blue'
      )
    })

    test('should return light blue tag for REVISE status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.REVISE)).toBe(
        'govuk-tag--light-blue'
      )
    })

    test('should return grey tag for ARCHIVED status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.ARCHIVED)).toBe(
        'govuk-tag--grey'
      )
    })

    test('should return grey tag for SUBMITTED status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.SUBMITTED)).toBe(
        'govuk-tag--grey'
      )
    })

    test('should return grey tag for APPROVED status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.APPROVED)).toBe(
        'govuk-tag--grey'
      )
    })

    test('should return grey tag for REJECTED status', () => {
      expect(getProjectStateTag(PROJECT_STATUS.REJECTED)).toBe(
        'govuk-tag--grey'
      )
    })

    test('should return grey tag for undefined status', () => {
      expect(getProjectStateTag(undefined)).toBe('govuk-tag--grey')
    })

    test('should return grey tag for null status', () => {
      expect(getProjectStateTag(null)).toBe('govuk-tag--grey')
    })

    test('should return grey tag for unknown status', () => {
      expect(getProjectStateTag('UNKNOWN_STATUS')).toBe('govuk-tag--grey')
    })
  })

  describe('isConfidenceRestrictedProjectType', () => {
    test('should return true for ELO project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.ELO)).toBe(true)
    })

    test('should return true for HCR project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.HCR)).toBe(true)
    })

    test('should return true for STR project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.STR)).toBe(true)
    })

    test('should return true for STU project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.STU)).toBe(true)
    })

    test('should return false for DEF project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.DEF)).toBe(false)
    })

    test('should return false for REP project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.REP)).toBe(false)
    })

    test('should return false for REF project type', () => {
      expect(isConfidenceRestrictedProjectType(PROJECT_TYPES.REF)).toBe(false)
    })

    test('should return false for undefined project type', () => {
      expect(isConfidenceRestrictedProjectType(undefined)).toBe(false)
    })

    test('should return false for null project type', () => {
      expect(isConfidenceRestrictedProjectType(null)).toBe(false)
    })

    test('should return false for unknown project type', () => {
      expect(isConfidenceRestrictedProjectType('UNKNOWN_TYPE')).toBe(false)
    })
  })

  // ─── buildProcessedFundingValues ───────────────────────────────────────────

  describe('buildProcessedFundingValues', () => {
    test('returns empty array when pafs_core_funding_values is absent', () => {
      expect(buildProcessedFundingValues({})).toEqual([])
    })

    test('returns empty array when pafs_core_funding_values is empty', () => {
      expect(
        buildProcessedFundingValues({ pafs_core_funding_values: [] })
      ).toEqual([])
    })

    test('converts financialYear to a Number', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ financialYear: '2025' }]
      })
      expect(result[0].financialYear).toBe(2025)
      expect(typeof result[0].financialYear).toBe('number')
    })

    test('converts numeric amount fields to Number via toNum', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ financialYear: 2025, fcermGia: '1000' }]
      })
      expect(result[0].fcermGia).toBe('1000')
    })

    test('sets null for absent amount fields', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ financialYear: 2025 }]
      })
      expect(result[0].fcermGia).toBeNull()
      expect(result[0].localLevy).toBeNull()
    })

    test('sorts rows by financialYear ascending', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [
          { financialYear: 2027, fcermGia: '300' },
          { financialYear: 2025, fcermGia: '100' },
          { financialYear: 2026, fcermGia: '200' }
        ]
      })
      expect(result.map((r) => r.financialYear)).toEqual([2025, 2026, 2027])
    })

    test('attaches public contributors when IDs match', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 1,
            name: 'Alice',
            contributorType: 'public_contributions',
            amount: '500'
          }
        ]
      })
      expect(result[0].publicContributors).toEqual([
        {
          name: 'Alice',
          contributorType: 'public_contributions',
          amount: '500'
        }
      ])
    })

    test('attaches private contributors correctly', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 1,
            name: 'Corp',
            contributorType: 'private_contributions',
            amount: '200'
          }
        ]
      })
      expect(result[0].privateContributors).toEqual([
        {
          name: 'Corp',
          contributorType: 'private_contributions',
          amount: '200'
        }
      ])
    })

    test('attaches otherEa contributors correctly', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 1,
            name: 'EA Org',
            contributorType: 'other_ea_contributions',
            amount: '100'
          }
        ]
      })
      expect(result[0].otherEaContributors).toEqual([
        {
          name: 'EA Org',
          contributorType: 'other_ea_contributions',
          amount: '100'
        }
      ])
    })

    test('omits contributor arrays when there are no contributors for a year', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }]
      })
      expect(result[0].publicContributors).toBeUndefined()
      expect(result[0].privateContributors).toBeUndefined()
      expect(result[0].otherEaContributors).toBeUndefined()
    })

    test('uses positional fallback when funding values have no ids', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ financialYear: 2025, fcermGia: '1000' }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 10,
            name: 'Bob',
            contributorType: 'private_contributions',
            amount: '200'
          }
        ]
      })
      // The positional fallback should map fundingValueId 10 → year 2025
      expect(result[0].privateContributors).toEqual([
        { name: 'Bob', contributorType: 'private_contributions', amount: '200' }
      ])
    })

    test('skips contributors whose fundingValueId cannot be resolved', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 999,
            name: 'Ghost',
            contributorType: 'public_contributions',
            amount: '999'
          }
        ]
      })
      expect(result[0].publicContributors).toBeUndefined()
    })

    test('stores contributor amount as string (null becomes empty string)', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [{ id: 1, financialYear: 2025 }],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 1,
            name: 'Alice',
            contributorType: 'public_contributions',
            amount: null
          }
        ]
      })
      expect(result[0].publicContributors[0].amount).toBe('')
    })

    test('handles multiple rows with multiple contributors', () => {
      const result = buildProcessedFundingValues({
        pafs_core_funding_values: [
          { id: 1, financialYear: 2025, fcermGia: '100' },
          { id: 2, financialYear: 2026, fcermGia: '200' }
        ],
        pafs_core_funding_contributors: [
          {
            fundingValueId: 1,
            name: 'A',
            contributorType: 'public_contributions',
            amount: '10'
          },
          {
            fundingValueId: 2,
            name: 'B',
            contributorType: 'private_contributions',
            amount: '20'
          }
        ]
      })
      expect(result).toHaveLength(2)
      expect(result[0].publicContributors).toHaveLength(1)
      expect(result[1].privateContributors).toHaveLength(1)
    })
  })

  // ─── computeFundingSourceTotals ────────────────────────────────────────────

  describe('computeFundingSourceTotals', () => {
    test('returns zero totals for empty rows', () => {
      const result = computeFundingSourceTotals([], {})
      expect(result.grandTotal).toBe('0')
      expect(result.yearTotals).toEqual([])
      expect(result.sourceTotals.fcermGia).toBe('0')
    })

    test('returns zero totals when no projectData fields are active', () => {
      const rows = [{ financialYear: 2025, fcermGia: 1000, localLevy: 500 }]
      const result = computeFundingSourceTotals(rows, {})
      expect(result.grandTotal).toBe('0')
      expect(result.yearTotals).toEqual(['0'])
      expect(result.sourceTotals.fcermGia).toBe('0')
    })

    test('sums only active (selected) fields', () => {
      const rows = [{ financialYear: 2025, fcermGia: 1000, localLevy: 500 }]
      const projectData = { fcermGia: true } // localLevy not selected
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.fcermGia).toBe('1000')
      expect(result.sourceTotals.localLevy).toBe('0')
      expect(result.yearTotals).toEqual(['1000'])
      expect(result.grandTotal).toBe('1000')
    })

    test('sums multiple active fields across multiple rows', () => {
      const rows = [
        { financialYear: 2025, fcermGia: 1000, localLevy: 200 },
        { financialYear: 2026, fcermGia: 500, localLevy: 300 }
      ]
      const projectData = { fcermGia: true, localLevy: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.fcermGia).toBe('1500')
      expect(result.sourceTotals.localLevy).toBe('500')
      expect(result.yearTotals).toEqual(['1200', '800'])
      expect(result.grandTotal).toBe('2000')
    })

    test('treats null/undefined values as zero', () => {
      const rows = [{ financialYear: 2025, fcermGia: null }]
      const projectData = { fcermGia: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.fcermGia).toBe('0')
      expect(result.grandTotal).toBe('0')
    })

    test('initialises sourceTotals for all 13 FUNDING_AMOUNT_FIELDS', () => {
      const result = computeFundingSourceTotals([], {})
      const expectedFields = [
        'fcermGia',
        'localLevy',
        'publicContributions',
        'privateContributions',
        'otherEaContributions',
        'notYetIdentified',
        'assetReplacementAllowance',
        'environmentStatutoryFunding',
        'frequentlyFloodedCommunities',
        'otherAdditionalGrantInAid',
        'otherGovernmentDepartment',
        'recovery',
        'summerEconomicFund'
      ]
      for (const field of expectedFields) {
        expect(result.sourceTotals).toHaveProperty(field, '0')
      }
    })

    test('defaults projectData to empty object when not provided', () => {
      const rows = [{ financialYear: 2025, fcermGia: 1000 }]
      const result = computeFundingSourceTotals(rows)
      // No active fields → all zeros
      expect(result.grandTotal).toBe('0')
    })

    test('does not count deselected contributor fields', () => {
      const rows = [
        {
          financialYear: 2025,
          fcermGia: 1000,
          publicContributions: 500
        }
      ]
      // Only fcermGia selected, publicContributions not
      const projectData = { fcermGia: true, publicContributions: false }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.fcermGia).toBe('1000')
      expect(result.sourceTotals.publicContributions).toBe('0')
      expect(result.grandTotal).toBe('1000')
    })
  })

  describe('formatNumberWithCommas short values', () => {
    test('should return single digit as-is', () => {
      expect(formatNumberWithCommas(5)).toBe('5')
    })

    test('should return 2 digits as-is', () => {
      expect(formatNumberWithCommas(42)).toBe('42')
    })

    test('should return 3 digits as-is (no comma)', () => {
      expect(formatNumberWithCommas(123)).toBe('123')
    })

    test('should return 0 as "0"', () => {
      expect(formatNumberWithCommas(0)).toBe('0')
    })
  })

  describe('buildIdToYearMap', () => {
    test('maps ids from funding values when ids are present', () => {
      const sorted = [
        { id: 10, financialYear: 2025 },
        { id: 20, financialYear: 2026 }
      ]
      const result = buildIdToYearMap(sorted, new Set())
      expect(result.get('10')).toBe(2025)
      expect(result.get('20')).toBe(2026)
    })

    test('uses positional mapping when ids are absent', () => {
      const sorted = [{ financialYear: 2025 }, { financialYear: 2026 }]
      const refIds = new Set(['100', '200'])
      const result = buildIdToYearMap(sorted, refIds)
      expect(result.get('100')).toBe(2025)
      expect(result.get('200')).toBe(2026)
    })

    test('ignores excess reference ids beyond sorted values length', () => {
      const sorted = [{ financialYear: 2025 }]
      const refIds = new Set(['100', '200'])
      const result = buildIdToYearMap(sorted, refIds)
      expect(result.get('100')).toBe(2025)
      expect(result.has('200')).toBe(false)
    })
  })

  describe('buildContributorsByYear', () => {
    test('groups contributors by resolved financial year', () => {
      const idToYear = new Map([
        ['10', 2025],
        ['20', 2026]
      ])
      const contributors = [
        { fundingValueId: 10, name: 'A' },
        { fundingValueId: 20, name: 'B' },
        { fundingValueId: 10, name: 'C' }
      ]
      const result = buildContributorsByYear(contributors, idToYear)
      expect(result['2025']).toHaveLength(2)
      expect(result['2026']).toHaveLength(1)
    })

    test('skips contributors with unresolvable fundingValueId', () => {
      const idToYear = new Map([['10', 2025]])
      const contributors = [
        { fundingValueId: 10, name: 'A' },
        { fundingValueId: 999, name: 'B' }
      ]
      const result = buildContributorsByYear(contributors, idToYear)
      expect(result['2025']).toHaveLength(1)
      expect(result['999']).toBeUndefined()
    })
  })

  // ─── getUniqueContributorNamesFromDb ─────────────────────────────────────

  describe('getUniqueContributorNamesFromDb', () => {
    test('returns empty array for empty input', () => {
      expect(
        getUniqueContributorNamesFromDb([], 'public_contributions')
      ).toEqual([])
    })

    test('returns empty array for null input', () => {
      expect(
        getUniqueContributorNamesFromDb(null, 'public_contributions')
      ).toEqual([])
    })

    test('returns empty array for undefined input', () => {
      expect(
        getUniqueContributorNamesFromDb(undefined, 'public_contributions')
      ).toEqual([])
    })

    test('extracts names matching the given contributor type', () => {
      const contributors = [
        { contributorType: 'public_contributions', name: 'Alice' },
        { contributorType: 'private_contributions', name: 'Bob' },
        { contributorType: 'public_contributions', name: 'Charlie' }
      ]
      const result = getUniqueContributorNamesFromDb(
        contributors,
        'public_contributions'
      )
      expect(result).toEqual(['Alice', 'Charlie'])
    })

    test('returns empty array when no names match the type', () => {
      const contributors = [
        { contributorType: 'private_contributions', name: 'Bob' }
      ]
      const result = getUniqueContributorNamesFromDb(
        contributors,
        'public_contributions'
      )
      expect(result).toEqual([])
    })

    test('deduplicates names case-insensitively', () => {
      const contributors = [
        { contributorType: 'public_contributions', name: 'Alice' },
        { contributorType: 'public_contributions', name: 'alice' },
        { contributorType: 'public_contributions', name: 'ALICE' }
      ]
      const result = getUniqueContributorNamesFromDb(
        contributors,
        'public_contributions'
      )
      expect(result).toEqual(['Alice'])
    })

    test('skips empty and null names', () => {
      const contributors = [
        { contributorType: 'public_contributions', name: '' },
        { contributorType: 'public_contributions', name: null },
        { contributorType: 'public_contributions', name: '  ' },
        { contributorType: 'public_contributions', name: 'Alice' }
      ]
      const result = getUniqueContributorNamesFromDb(
        contributors,
        'public_contributions'
      )
      expect(result).toEqual(['Alice'])
    })

    test('trims whitespace from names', () => {
      const contributors = [
        { contributorType: 'public_contributions', name: '  Alice  ' }
      ]
      const result = getUniqueContributorNamesFromDb(
        contributors,
        'public_contributions'
      )
      expect(result).toEqual(['Alice'])
    })
  })

  // ─── computeFundingSourceTotals – contributor fallback ───────────────────

  describe('computeFundingSourceTotals – contributor array fallback', () => {
    test('falls back to contributor arrays when source field is all zeros', () => {
      const rows = [
        {
          financialYear: 2025,
          publicContributions: 0,
          publicContributors: [
            { name: 'Alice', amount: '1000' },
            { name: 'Bob', amount: '500' }
          ]
        }
      ]
      const projectData = { publicContributions: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.publicContributions).toBe('1500')
      expect(result.grandTotal).toBe('1500')
    })

    test('falls back to contributor arrays when source field is null', () => {
      const rows = [
        {
          financialYear: 2025,
          publicContributions: null,
          publicContributors: [{ name: 'A', amount: '200' }]
        }
      ]
      const projectData = { publicContributions: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.publicContributions).toBe('200')
    })

    test('does not fall back when source field has non-zero value', () => {
      const rows = [
        {
          financialYear: 2025,
          publicContributions: 700,
          publicContributors: [{ name: 'A', amount: '999' }]
        }
      ]
      const projectData = { publicContributions: true }
      const result = computeFundingSourceTotals(rows, projectData)
      // Uses the regular field value, not the contributor array
      expect(result.sourceTotals.publicContributions).toBe('700')
    })

    test('handles contributor array with non-numeric amounts', () => {
      const rows = [
        {
          financialYear: 2025,
          privateContributions: 0,
          privateContributors: [
            { name: 'A', amount: '£1,000' },
            { name: 'B', amount: '' }
          ]
        }
      ]
      const projectData = { privateContributions: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.privateContributions).toBe('1000')
    })

    test('handles missing contributor array gracefully', () => {
      const rows = [
        {
          financialYear: 2025,
          otherEaContributions: 0
        }
      ]
      const projectData = { otherEaContributions: true }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.otherEaContributions).toBe('0')
    })

    test('falls back for multiple contributor types simultaneously', () => {
      const rows = [
        {
          financialYear: 2025,
          publicContributions: 0,
          privateContributions: 0,
          publicContributors: [{ name: 'A', amount: '100' }],
          privateContributors: [{ name: 'B', amount: '200' }]
        }
      ]
      const projectData = {
        publicContributions: true,
        privateContributions: true
      }
      const result = computeFundingSourceTotals(rows, projectData)
      expect(result.sourceTotals.publicContributions).toBe('100')
      expect(result.sourceTotals.privateContributions).toBe('200')
      expect(result.grandTotal).toBe('300')
    })
  })
})
