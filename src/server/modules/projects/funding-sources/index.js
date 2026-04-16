import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
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

export const projectFundingSources = {
  plugin: {
    name: 'Project - Funding Sources',
    register(server) {
      server.route([
        // Step 1: main funding sources selection
        ...createEditRoutePair(
          r.FUNDING_SOURCES_SELECTION,
          fundingSourcesSelectionController
        ),

        // Step 2: additional FCRM GIA sources
        ...createEditRoutePair(
          r.ADDITIONAL_FUNDING_SOURCES_SELECTION,
          additionalFundingSourcesController
        ),

        // Step 3: public sector contributor names
        ...createEditRoutePair(
          r.PUBLIC_SECTOR_CONTRIBUTORS,
          publicContributorsController
        ),

        // Step 3: delete a public sector contributor (index in path)
        ...createEditRoutePair(
          `${r.PUBLIC_SECTOR_CONTRIBUTORS_DELETE}/{index}`,
          publicContributorsDeleteController
        ),

        // Step 4: private sector contributor names
        ...createEditRoutePair(
          r.PRIVATE_SECTOR_CONTRIBUTORS,
          privateContributorsController
        ),

        // Step 4: delete a private sector contributor
        ...createEditRoutePair(
          `${r.PRIVATE_SECTOR_CONTRIBUTORS_DELETE}/{index}`,
          privateContributorsDeleteController
        ),

        // Step 5: other Environment Agency contributor names
        ...createEditRoutePair(
          r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS,
          otherEaContributorsController
        ),

        // Step 5: delete an other EA contributor
        ...createEditRoutePair(
          `${r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE}/{index}`,
          otherEaContributorsDeleteController
        ),

        // Step 6: estimated spend table
        ...createEditRoutePair(r.ESTIMATED_SPEND, estimatedSpendController)
      ])
    }
  }
}
