import { ROUTES } from '../../../../common/constants/routes.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import {
  fundingSourcesSelectedSchema,
  additionalFcrmGiaSelectedSchema,
  publicContributorNamesSchema,
  privateContributorNamesSchema,
  otherEaContributorNamesSchema,
  createFundingValuesSchema
} from '../../schema.js'

/**
 * Virtual session field indicating the user selected "Additional FCRM Grant-in-Aid"
 * on the main funding sources selection page.
 */
const ADDITIONAL_FCRM_GIA_FIELD = 'additionalFcermGia'

/**
 * Configuration for funding sources related steps.
 *
 * Back-link logic for conditional steps uses a `backLinkFn(project)` function that
 * receives the current project session data and returns the appropriate URL template.
 * The route handler is responsible for replacing `{referenceNumber}` with the real value.
 *
 * Journey order (all steps conditional based on selections):
 *   Overview
 *     → funding-sources (main selection – always)
 *     → funding-sources-additional (only if additionalFcermGia selected)
 *     → funding-sources-public-contributors (only if publicContributions selected)
 *     → funding-sources-private-contributors (only if privateContributions selected)
 *     → funding-sources-other-ea-contributors (only if otherEaContributions selected)
 *     → funding-sources-estimated-spend (always, once all contributor steps done)
 *     → Overview
 */
export const FUNDING_SOURCES_CONFIG = {
  /**
   * Step 1: Main funding sources selection (checkbox)
   * Back: always returns to the overview page
   */
  [PROJECT_STEPS.FUNDING_SOURCES]: {
    localKeyPrefix: 'projects.funding_sources.funding_sources_selection',
    backLinkOptions: {
      targetEditURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: fundingSourcesSelectedSchema,
    fieldType: 'checkbox'
  },

  /**
   * Step 2 (conditional): Additional FCRM Grant-in-Aid sub-sources (checkbox)
   * Only shown when additionalFcermGia === true on the project.
   * Back: always returns to the main funding sources selection page.
   */
  [PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL]: {
    localKeyPrefix:
      'projects.funding_sources.additional_funding_sources_selection',
    backLinkOptions: {
      targetEditURL:
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION,
      conditionalRedirect: false
    },
    schema: additionalFcrmGiaSelectedSchema,
    fieldType: 'checkbox',
    gateField: ADDITIONAL_FCRM_GIA_FIELD
  },

  /**
   * Step 3 (conditional): Public sector contributor names
   * Only shown when publicContributions === true.
   * Back: additional GIA page if that was selected, otherwise main selection page.
   */
  [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]: {
    localKeyPrefix: 'projects.funding_sources.public_sector_contributors',
    backLinkOptions: {
      backLinkFn: (project) =>
        project?.[ADDITIONAL_FCRM_GIA_FIELD]
          ? ROUTES.PROJECT.EDIT.FUNDING_SOURCES
              .ADDITIONAL_FUNDING_SOURCES_SELECTION
          : ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION,
      conditionalRedirect: false
    },
    schema: publicContributorNamesSchema,
    fieldType: 'contributor-names',
    fieldName: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES,
    deleteRoute:
      ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS_DELETE,
    gateField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS
  },

  /**
   * Step 4 (conditional): Private sector contributor names
   * Only shown when privateContributions === true.
   * Back: public contributors if selected → additional GIA if selected → main selection.
   */
  [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]: {
    localKeyPrefix: 'projects.funding_sources.private_sector_contributors',
    backLinkOptions: {
      backLinkFn: (project) => {
        if (project?.[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
        }
        if (project?.[ADDITIONAL_FCRM_GIA_FIELD]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES
            .ADDITIONAL_FUNDING_SOURCES_SELECTION
        }
        return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION
      },
      conditionalRedirect: false
    },
    schema: privateContributorNamesSchema,
    fieldType: 'contributor-names',
    fieldName: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES,
    deleteRoute:
      ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS_DELETE,
    gateField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS
  },

  /**
   * Step 5 (conditional): Other Environment Agency contributor names
   * Only shown when otherEaContributions === true.
   * Back: private contributors → public contributors → additional GIA → main selection
   *       (first enabled step going backwards).
   */
  [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]: {
    localKeyPrefix: 'projects.funding_sources.other_ea_contributors',
    backLinkOptions: {
      backLinkFn: (project) => {
        if (project?.[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS
        }
        if (project?.[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
        }
        if (project?.[ADDITIONAL_FCRM_GIA_FIELD]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES
            .ADDITIONAL_FUNDING_SOURCES_SELECTION
        }
        return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION
      },
      conditionalRedirect: false
    },
    schema: otherEaContributorNamesSchema,
    fieldType: 'contributor-names',
    fieldName: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES,
    deleteRoute:
      ROUTES.PROJECT.EDIT.FUNDING_SOURCES
        .OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE,
    gateField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS
  },

  /**
   * Step 6: Estimated spend per financial year (spending table)
   * Always shown once the funding sources are configured.
   * Saving and continuing here returns the user to the overview page.
   * Back: other EA contributors → private contributors → public contributors
   *       → additional GIA → main selection (first enabled step going backwards).
   */
  [PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND]: {
    localKeyPrefix: 'projects.funding_sources.estimated_spend',
    backLinkOptions: {
      backLinkFn: (project) => {
        if (project?.[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES
            .OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
        }
        if (project?.[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS
        }
        if (project?.[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
        }
        if (project?.[ADDITIONAL_FCRM_GIA_FIELD]) {
          return ROUTES.PROJECT.EDIT.FUNDING_SOURCES
            .ADDITIONAL_FUNDING_SOURCES_SELECTION
        }
        return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION
      },
      conditionalRedirect: false
    },
    schema: createFundingValuesSchema,
    fieldType: 'spending-table',
    successRedirect: ROUTES.PROJECT.OVERVIEW
  }
}
