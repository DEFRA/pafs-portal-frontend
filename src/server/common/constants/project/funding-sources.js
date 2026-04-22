import { PROJECT_PAYLOAD_FIELDS } from './payload-fields.js'
import { PROJECT_PAYLOAD_LEVELS } from './payload-levels.js'
import { PROJECT_STEPS } from './steps.js'

// ─── Session keys for in-progress contributor lists ─────────────────────────

export const CONTRIBUTOR_SESSION_KEY = {
  [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]:
    '_publicContributorsSession',
  [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]:
    '_privateContributorsSession',
  [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]:
    '_otherEaContributorsSession'
}

// Map contributor step → the payload field that holds the comma-joined names
export const CONTRIBUTOR_NAMES_FIELD = {
  [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]:
    PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES,
  [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]:
    PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES,
  [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]:
    PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES
}

// Map contributor step → the API submit level
export const CONTRIBUTOR_LEVEL = {
  [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]:
    PROJECT_PAYLOAD_LEVELS.PUBLIC_SECTOR_CONTRIBUTORS,
  [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]:
    PROJECT_PAYLOAD_LEVELS.PRIVATE_SECTOR_CONTRIBUTORS,
  [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]:
    PROJECT_PAYLOAD_LEVELS.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
}

// Funding source fields that appear as columns in the spending table
export const MAIN_SPEND_SOURCES = [
  { field: PROJECT_PAYLOAD_FIELDS.FCERM_GIA, labelKey: 'gia' },
  { field: PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY, labelKey: 'local_levy' },
  {
    field: PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
    labelKey: 'asset_replacement_allowance',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
    labelKey: 'environment_statutory_funding',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
    labelKey: 'frequently_flooded_communities',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
    labelKey: 'other_additional_grant_in_aid',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
    labelKey: 'other_government_department',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.RECOVERY,
    labelKey: 'recovery',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND,
    labelKey: 'summer_economic_fund',
    additionalGia: true
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
    labelKey: 'public_sector_contributors'
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
    labelKey: 'private_sector_contributors'
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
    labelKey: 'other_ea_contributors'
  },
  {
    field: PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED,
    labelKey: 'not_yet_identified'
  }
]

export const CONTRIBUTOR_SPEND_GROUPS = [
  {
    enabledField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES,
    sessionKey:
      CONTRIBUTOR_SESSION_KEY[
        PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
      ],
    sourceField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
    contributorArrayField: 'publicContributors',
    contributorType: 'public_contributions',
    sectionLabelKey: 'public_sector_contributors'
  },
  {
    enabledField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES,
    sessionKey:
      CONTRIBUTOR_SESSION_KEY[
        PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
      ],
    sourceField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
    contributorArrayField: 'privateContributors',
    contributorType: 'private_contributions',
    sectionLabelKey: 'private_sector_contributors'
  },
  {
    enabledField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES,
    sessionKey:
      CONTRIBUTOR_SESSION_KEY[
        PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
      ],
    sourceField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
    contributorArrayField: 'otherEaContributors',
    contributorType: 'other_ea_contributions',
    sectionLabelKey: 'other_ea_contributors'
  }
]

export const CONTRIBUTOR_REQUIRED_ERROR_CODES = new Set([
  'PUBLIC_SECTOR_CONTRIBUTORS_REQUIRED',
  'PRIVATE_SECTOR_CONTRIBUTORS_REQUIRED',
  'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_REQUIRED'
])

export const CONTRIBUTOR_INVALID_ERROR_CODES = new Set([
  'PUBLIC_SECTOR_CONTRIBUTORS_INVALID',
  'PRIVATE_SECTOR_CONTRIBUTORS_INVALID',
  'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_INVALID'
])

export const CONTRIBUTOR_DUPLICATE_ERROR_CODES = new Set([
  'PUBLIC_SECTOR_CONTRIBUTORS_DUPLICATE',
  'PRIVATE_SECTOR_CONTRIBUTORS_DUPLICATE',
  'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DUPLICATE'
])
