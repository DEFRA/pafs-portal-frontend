import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { upsertProjectProposal } from '../../../common/services/project/project-service.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS
} from '../../../common/constants/projects.js'
import { getSessionData, updateSessionData } from './project-utils.js'

// UK financial year starts on 1 April — month index 3 in JavaScript's 0-based months
const APRIL_MONTH_INDEX = 3

// Payload sent to the API to clear all stale fields in the database.
const CLEARED_API_PAYLOAD = {
  // Financial years
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null,
  // Important dates
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: null,
  [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: null,
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: null,
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: null,
  // Funding source flags
  [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: false,
  [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: false,
  [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
  [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
  [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false,
  [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: false,
  [PROJECT_PAYLOAD_FIELDS.GROWTH_FUNDING]: null,
  // Contributor names
  [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: null,
  [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES]: null,
  [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES]: null,
  // Banner persistence flag — set true when stale data is flushed
  [PROJECT_PAYLOAD_FIELDS.STALE_DATA_CLEARED]: true
}

// Session data cleared when stale data is flushed.
// additionalFcermGia is session-only — the backend derives it from funding source selections.
// fundingValues is the spending table stored in session only.
const CLEARED_SESSION_DATA = {
  ...CLEARED_API_PAYLOAD,
  additionalFcermGia: false,
  [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: null
}

/**
 * Returns the year in which the current UK financial year started.
 * The UK financial year runs from 1 April to 31 March.
 * @returns {number}
 */
export function getCurrentFinancialYear() {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= APRIL_MONTH_INDEX ? year : year - 1
}

export function hasStaleFinancialYears(
  projectData,
  currentFY = getCurrentFinancialYear()
) {
  const startYear = projectData?.[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]
  const endYear = projectData?.[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]

  const startIsStale =
    startYear !== null && startYear !== undefined && startYear < currentFY
  const endIsStale =
    endYear !== null && endYear !== undefined && endYear < currentFY

  return startIsStale || endIsStale
}

export async function flushStaleFinancialYears(request) {
  const authSession = getAuthSession(request)
  const accessToken = authSession?.accessToken ?? ''
  const sessionData = getSessionData(request)
  const referenceNumber = sessionData[PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]

  let result
  try {
    result = await upsertProjectProposal(
      {
        level: PROJECT_PAYLOAD_LEVELS.CLEAR_STALE_DATA,
        payload: {
          [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: referenceNumber,
          ...CLEARED_API_PAYLOAD
        }
      },
      accessToken
    )
  } catch (err) {
    request.logger.error('Error flushing stale financial years', err)
    return false
  }

  if (result?.success === true) {
    updateSessionData(request, CLEARED_SESSION_DATA)
    return true
  }

  return false
}
