import { ROUTES } from '../../../common/constants/routes.js'

export function getBacklink(request, options = {}) {
  const {
    defaultUrl = '/',
    defaultText = request.t('common.back_link'),
    alwaysOverview = false,
    ignoreEditMode = false
  } = options

  const overviewText = request.t('common.back_to_overview')

  // Check if we have a reference number in params (edit mode indicator)
  const referenceNumber = request.params?.referenceNumber
  const isEditMode = Boolean(referenceNumber)

  // Always go to overview
  if (alwaysOverview) {
    if (!referenceNumber) {
      // If no reference number but alwaysOverview is true, we need one from somewhere
      // This is an edge case - you might want to handle this differently
      return {
        text: overviewText,
        href: defaultUrl
      }
    }
    return {
      text: overviewText,
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
      text: overviewText,
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
