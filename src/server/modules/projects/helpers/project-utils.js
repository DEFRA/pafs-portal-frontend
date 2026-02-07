import { SIZE } from '../../../common/constants/common.js'
import {
  PROJECT_SESSION_KEY,
  PROJECT_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VIEW_ERROR_CODES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'

export function getBackLink(request, options = {}) {
  const { targetURL = '/', conditionalRedirect = false } = options

  const defaultLinkText = request.t('common.back_link')
  const overviewText = request.t('common.back_to_overview')
  const referenceNumber = request.params?.referenceNumber
  const isEditMode = Boolean(referenceNumber)

  // Pages which go back to overview only in edit mode
  if (conditionalRedirect && isEditMode) {
    return {
      text: overviewText,
      href: ROUTES.PROJECT.OVERVIEW.replace(
        '{referenceNumber}',
        referenceNumber
      )
    }
  }
  const targetEditURL = options?.targetEditURL || ''

  // Default behaviour for pages not in edit mode and don't go back to overview
  return {
    text: defaultLinkText,
    href:
      isEditMode && targetEditURL
        ? targetEditURL.replace('{referenceNumber}', referenceNumber)
        : targetURL
  }
}

/**
 * Validate payload and render error view if invalid
 * @private
 */
export function validatePayload(request, h, options) {
  const { template, schema, viewData } = options

  // Skip validation if no schema defined (e.g., START step)
  if (!schema) {
    return null
  }

  const { error } = schema.validate(request.payload, { abortEarly: false })
  if (!error) {
    return null
  }

  return h.view(template, { ...viewData, fieldErrors: extractJoiErrors(error) })
}

/**
 * Get project session data
 * @param {Object} request - Hapi request object
 * @returns {Object} Project session data
 */
export function getSessionData(request) {
  return request.yar.get(PROJECT_SESSION_KEY) || {}
}

/**
 * Update project session data
 * @param {Object} request - Hapi request object
 * @param {Object} data - Data to merge with existing session
 */
export function updateSessionData(request, data) {
  const sessionData = getSessionData(request)
  request.yar.set(PROJECT_SESSION_KEY, { ...sessionData, ...data })
}

/**
 * Reset project session data
 * @param {Object} request - Hapi request object
 */
export function resetSessionData(request) {
  request.yar.set(PROJECT_SESSION_KEY, {
    journeyStarted: true,
    isEdit: false,
    [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: '',
    [PROJECT_PAYLOAD_FIELDS.SLUG]: ''
  })
}

/**
 * Build view data for a project step
 * @param {Object} request - Hapi request object
 * @param {Object} options - Additional options
 * @returns {Object} View data object
 */
export function buildViewData(request, options = {}) {
  const {
    formData = {},
    fieldErrors = {},
    errorCode = '',
    additionalData = {}
  } = options

  const sessionData = getSessionData(request)
  const referenceNumber = request.params?.referenceNumber || ''
  const isEditMode = !!referenceNumber

  const backLink = getBackLink(request, options.backLinkOptions)

  return {
    pageTitle: request.t(`${options.localKeyPrefix}.title`),
    localKeyPrefix: options.localKeyPrefix,
    backLinkURL: backLink.href,
    backLinkText: backLink.text,
    isEditMode,
    referenceNumber,
    fieldErrors,
    errorCode,
    formData: { ...sessionData, ...formData },
    sessionData,
    ERROR_CODES: PROJECT_VIEW_ERROR_CODES,
    PROJECT_PAYLOAD_FIELDS,
    ...additionalData
  }
}

export function loggedInUserAreas(request) {
  const session = getAuthSession(request)
  return session?.user?.areas || []
}

export function loggedInUserMainArea(request) {
  const areas = loggedInUserAreas(request)
  if (areas.length) {
    return areas.find((a) => a.primary) || areas[0]
  }
  return null
}

export function loggedInUserAreaOptions(request) {
  const areas = loggedInUserAreas(request)
  const areasOption = [
    {
      text: request.t('projects.area_selection.select_rma_option_text'),
      value: ''
    }
  ]
  return areasOption.concat(
    areas.map((area) => ({
      text: area.name,
      value: Number(area.areaId)
    }))
  )
}

export function navigateToProjectOverview(referenceNumber, h) {
  return h
    .redirect(
      ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', referenceNumber)
    )
    .takeover()
}

export function requiredInterventionTypesForProjectType(projectType) {
  const skipInterventionTypes = [
    PROJECT_TYPES.HCR,
    PROJECT_TYPES.STR,
    PROJECT_TYPES.STU,
    PROJECT_TYPES.ELO
  ]
  if (skipInterventionTypes.includes(projectType)) {
    return false
  }
  return true
}

export function getProjectStep(request) {
  const pathname = request.route.path
  const lastPart = pathname.split('/').pop()
  return lastPart
}

export function getCurrentFinancialYearStartYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + SIZE.LENGTH_1
  return month >= SIZE.LENGTH_4 ? year : year - SIZE.LENGTH_1
}

export function buildFinancialYearLabel(startYear) {
  return `April ${startYear} to March ${startYear + SIZE.LENGTH_1}`
}

export function buildFinancialYearOptions(startYear, count = SIZE.LENGTH_6) {
  return Array.from({ length: count }, (_, index) => {
    const year = startYear + index
    return {
      value: Number(year),
      text: buildFinancialYearLabel(year)
    }
  })
}

export function getAfterMarchYear(startYear, count = SIZE.LENGTH_6) {
  return startYear + count
}

/**
 * Check if a year is beyond the range of years to display
 * @param {number} year - The year to check
 * @param {number} minYear - The minimum year in the range
 * @returns {boolean} True if the year is beyond the range
 */
export function isYearBeyondRange(year, minYear) {
  if (!year) return false
  const maxYear = getAfterMarchYear(minYear) - SIZE.LENGTH_1
  return year > maxYear
}

export function getMonthName(monthNumber) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const monthIndex = parseInt(monthNumber, 10) - 1
  return months[monthIndex] || monthNumber
}

export function formatDate(month, year) {
  if (!month || !year) {
    return null
  }
  return `${getMonthName(month)} ${year}`
}

/**
 * Format file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
