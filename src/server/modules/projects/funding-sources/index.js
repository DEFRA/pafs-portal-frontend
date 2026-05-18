import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { requireFinancialYears } from '../helpers/require-financial-years.js'
import { requireFundingSourceGate } from './helpers/require-funding-source-gate.js'
import {
  additionalFundingSourcesController,
  estimatedSpendController,
  otherEaContributorsController,
  otherEaContributorsDeleteController,
  privateContributorsController,
  privateContributorsDeleteController,
  publicContributorsController,
  publicContributorsDeleteController,
  fundingSourcesSelectionController
} from './controller.js'

const r = ROUTES.PROJECT.EDIT.FUNDING_SOURCES
const fundingSourcesPreHandlers = [
  { method: requireFinancialYears },
  { method: requireFundingSourceGate }
]

export const projectFundingSources = {
  plugin: {
    name: 'Project - Funding Sources',
    register(server) {
      server.route([
        // Step 1: main funding sources selection
        ...createEditRoutePair(
          r.FUNDING_SOURCES_SELECTION,
          fundingSourcesSelectionController,
          fundingSourcesPreHandlers
        ),

        // Step 2: additional FCRM GIA sources
        ...createEditRoutePair(
          r.ADDITIONAL_FUNDING_SOURCES_SELECTION,
          additionalFundingSourcesController,
          fundingSourcesPreHandlers
        ),

        // Step 3: public sector contributor names
        ...createEditRoutePair(
          r.PUBLIC_SECTOR_CONTRIBUTORS,
          publicContributorsController,
          fundingSourcesPreHandlers
        ),

        // Step 3: delete a public sector contributor (index in path)
        ...createEditRoutePair(
          `${r.PUBLIC_SECTOR_CONTRIBUTORS_DELETE}/{index}`,
          publicContributorsDeleteController,
          fundingSourcesPreHandlers
        ),

        // Step 4: private sector contributor names
        ...createEditRoutePair(
          r.PRIVATE_SECTOR_CONTRIBUTORS,
          privateContributorsController,
          fundingSourcesPreHandlers
        ),

        // Step 4: delete a private sector contributor
        ...createEditRoutePair(
          `${r.PRIVATE_SECTOR_CONTRIBUTORS_DELETE}/{index}`,
          privateContributorsDeleteController,
          fundingSourcesPreHandlers
        ),

        // Step 5: other Environment Agency contributor names
        ...createEditRoutePair(
          r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS,
          otherEaContributorsController,
          fundingSourcesPreHandlers
        ),

        // Step 5: delete an other EA contributor
        ...createEditRoutePair(
          `${r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE}/{index}`,
          otherEaContributorsDeleteController,
          fundingSourcesPreHandlers
        ),

        // Step 6: estimated spend table
        ...createEditRoutePair(
          r.ESTIMATED_SPEND,
          estimatedSpendController,
          fundingSourcesPreHandlers
        )
      ])
    }
  }
}
