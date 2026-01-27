/**
 * Organisations Listing Controller
 * Displays paginated list of organisations with filtering
 */

import { ADMIN_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createAreasService } from '../../../../common/services/areas/areas-service.js'
import { getDefaultPageSize } from '../../../../common/helpers/pagination/index.js'
import {
  ORGANISATION_OPTIONS,
  ORGANISATION_SESSION_KEYS
} from '../../../../common/constants/organisations.js'
import {
  buildListingRequestContext,
  buildListingViewModel,
  buildEmptyListingViewModel
} from '../../common/listing-helpers.js'
import { encodeUserId } from '../../../../common/helpers/security/encoder.js'

/**
 * Format organisation for display
 *
 * @param {Object} org - Organisation object from API
 * @returns {Object} Formatted organisation
 */
function formatOrganisationForDisplay(org) {
  return {
    id: encodeUserId(org.id),
    name: org.name,
    type: org.area_type || org.areaType,
    identifier: org.identifier
  }
}

/**
 * Format organisations array for display
 *
 * @param {Array} organisations - Organisations array from API
 * @returns {Array} Formatted organisations
 */
function formatOrganisationsForDisplay(organisations) {
  return organisations.map((org) => formatOrganisationForDisplay(org))
}

/**
 * Build type options with selected attribute
 * @param {string} selectedType - Currently selected type filter
 * @returns {Array} Type options with selected attribute
 */
function buildTypeOptions(selectedType) {
  return ORGANISATION_OPTIONS.map((option) => ({
    ...option,
    selected: option.value === selectedType
  }))
}

export const organisationsListingController = {
  async handler(request, h) {
    const {
      session,
      logger,
      successNotification,
      errorNotification,
      page,
      filters
    } = buildListingRequestContext(request, ['search', 'type'])

    try {
      const areasService = createAreasService(request.server)
      request.yar.clear(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA)

      // Fetch organisations list with pagination
      const result = await areasService.getAreasByList({
        search: filters.search,
        type: filters.type,
        page,
        pageSize: getDefaultPageSize(),
        accessToken: session?.accessToken
      })

      const organisations = formatOrganisationsForDisplay(
        result.areas || result.data || []
      )

      return h.view(
        ADMIN_VIEWS.ORGANISATIONS,
        buildListingViewModel({
          request,
          session,
          pageTitle: request.t('organisations.listing.title'),
          items: organisations,
          pagination: result.pagination || result,
          baseUrl: ROUTES.ADMIN.ORGANISATIONS,
          filters,
          successNotification,
          errorNotification,
          additionalData: {
            organisations,
            typeOptions: buildTypeOptions(filters.type)
          }
        })
      )
    } catch (error) {
      logger.error({ error }, 'Error loading organisations page')

      return h.view(
        ADMIN_VIEWS.ORGANISATIONS,
        buildEmptyListingViewModel({
          request,
          session,
          pageTitle: request.t('organisations.listing.title'),
          baseUrl: ROUTES.ADMIN.ORGANISATIONS,
          filters,
          error: request.t('organisations.listing.errors.fetch_failed'),
          successNotification,
          errorNotification,
          additionalData: {
            organisations: [],
            typeOptions: buildTypeOptions(filters.type)
          }
        })
      )
    }
  }
}
