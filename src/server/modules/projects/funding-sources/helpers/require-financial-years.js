import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  REFERENCE_NUMBER_PARAM
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getSessionData } from '../../helpers/project-utils.js'

/**
 * Pre-handler that checks whether the project has both a start and end
 * financial year set.  If either is missing the user is shown a warning
 * page asking them to set the dates before continuing with funding sources.
 *
 * Attach this pre-handler to every GET/POST route inside the funding-sources
 * plugin so that legacy projects without dates cannot enter the section.
 */
export function requireFinancialYears(request, h) {
  const sessionData = getSessionData(request)

  const startYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR] || 0
  )
  const endYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR] || 0
  )

  if (startYear > 0 && endYear > 0) {
    return h.continue
  }

  const referenceNumber = request.params?.referenceNumber || ''
  const overviewUrl = ROUTES.PROJECT.OVERVIEW.replace(
    REFERENCE_NUMBER_PARAM,
    referenceNumber
  )

  return h
    .view(PROJECT_VIEWS.FUNDING_SOURCES_MISSING_FINANCIAL_YEARS, {
      pageTitle: request.t(
        'projects.funding_sources.missing_financial_years.title'
      ),
      overviewUrl
    })
    .takeover()
}
