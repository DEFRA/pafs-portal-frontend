import { ROUTES } from '../../../common/constants/routes.js'

/**
 * Generates backlink configuration for project proposal pages
 *
 * @param {Object} request - Hapi request object
 * @param {Object} options - Configuration options
 * @param {string} options.defaultUrl - URL to use when not in edit mode
 * @param {string} options.defaultText - Text to use when not in edit mode (default: 'Back')
 * @param {boolean} options.alwaysOverview - Always go to overview regardless of edit mode (default: false)
 * @param {boolean} options.ignoreEditMode - Never go to overview even in edit mode (default: false)
 * @returns {Object} Backlink configuration with text and href properties
 *
 * @example
 * // Normal page - goes to overview in edit mode
 * const backlink = getBacklink(request, {
 *   defaultUrl: '/project-proposal/project-type'
 * })
 *
 * @example
 * // Always go to overview
 * const backlink = getBacklink(request, {
 *   defaultUrl: '/somewhere',
 *   alwaysOverview: true
 * })
 *
 * @example
 * // Never go to overview (ignore edit mode)
 * const backlink = getBacklink(request, {
 *   defaultUrl: '/project-proposal/step-1',
 *   ignoreEditMode: true
 * })
 */
export function getBacklink(request, options = {}) {
  const {
    defaultUrl = '/',
    defaultText = request.t('common.back_link'),
    alwaysOverview = false,
    ignoreEditMode = false
  } = options

  // Check if we have a reference number in params (edit mode indicator)
  const referenceNumber = request.params?.referenceNumber
  const isEditMode = Boolean(referenceNumber)

  // Always go to overview
  if (alwaysOverview) {
    if (!referenceNumber) {
      // If no reference number but alwaysOverview is true, we need one from somewhere
      // This is an edge case - you might want to handle this differently
      return {
        text: request.t('common.back_to_overview'),
        href: defaultUrl
      }
    }
    return {
      text: request.t('common.back_to_overview'),
      href: ROUTES.PROJECT_PROPOSAL.PROPOSAL_OVERVIEW.replace(
        '{referenceNumber}',
        referenceNumber
      )
    }
  }

  // Never go to overview (Page which never goes back to the overview page)
  if (ignoreEditMode) {
    return {
      text: defaultText,
      href: defaultUrl
    }
  }

  // Pages which go back to overview only in edit mode
  if (isEditMode) {
    return {
      text: request.t('common.back_to_overview'),
      href: ROUTES.PROJECT_PROPOSAL.PROPOSAL_OVERVIEW.replace(
        '{referenceNumber}',
        referenceNumber
      )
    }
  }

  // Default behaviour for pages not in edit mode and don't go back to overview
  return {
    text: defaultText,
    href: defaultUrl
  }
}
