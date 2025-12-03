/**
 * Users List Controller Factory
 * Creates controllers for pending and active users pages
 * to avoid code duplication
 */

import { PAGINATION } from '../../../common/constants/common.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getDefaultPageSize } from '../../../common/helpers/pagination/index.js'
import {
  getAccounts,
  getPendingCount,
  getActiveCount
} from '../../../common/services/accounts/accounts-service.js'
import { createAccountsCacheService } from '../../../common/services/accounts/accounts-cache.js'
import {
  formatUsersForDisplay,
  buildUsersViewModel,
  getEmptyUsersViewModel
} from './user-listing.js'

/**
 * Creates a users list controller for a specific status
 *
 * @param {Object} config - Controller configuration
 * @param {string} config.status - Account status to filter by ('pending' or 'active')
 * @param {string} config.viewTemplate - View template path
 * @param {string} config.baseUrl - Base URL for pagination and filters
 * @returns {Object} Hapi controller object
 */
export function createUsersListController({ status, viewTemplate, baseUrl }) {
  return {
    async handler(request, h) {
      const session = getAuthSession(request)
      const logger = request.server.logger

      // Create cache service instance for this request
      const cacheService = createAccountsCacheService(request.server)

      const page = parseInt(request.query.page, 10) || PAGINATION.DEFAULT_PAGE
      const search = request.query.search || ''
      const areaId = request.query.areaId || ''
      const filters = { search, areaId }

      try {
        const [accountsResult, pendingCount, activeCount] = await Promise.all([
          getAccounts({
            status,
            search,
            areaId,
            page,
            pageSize: getDefaultPageSize(),
            accessToken: session?.accessToken,
            cacheService
          }),
          getPendingCount(session?.accessToken, cacheService),
          getActiveCount(session?.accessToken, cacheService)
        ])

        if (!accountsResult.success) {
          logger.error(
            { errors: accountsResult.errors },
            `Failed to fetch ${status} accounts`
          )

          return h.view(
            viewTemplate,
            getEmptyUsersViewModel({
              request,
              session,
              filters,
              currentTab: status,
              baseUrl,
              error: request.t('accounts.manage_users.errors.fetch_failed')
            })
          )
        }

        const { data: users, pagination } = accountsResult.data

        return h.view(
          viewTemplate,
          buildUsersViewModel({
            request,
            session,
            users: formatUsersForDisplay(users),
            pagination,
            pendingCount,
            activeCount,
            filters,
            currentTab: status,
            baseUrl
          })
        )
      } catch (error) {
        logger.error({ error }, `Error loading ${status} users page`)

        return h.view(
          viewTemplate,
          getEmptyUsersViewModel({
            request,
            session,
            filters,
            currentTab: status,
            baseUrl,
            error: request.t('accounts.manage_users.errors.fetch_failed')
          })
        )
      }
    }
  }
}
