/**
 * Users List Controller Factory
 * Creates controllers for pending and active users pages
 * to avoid code duplication
 */

import { PAGINATION } from '../../../../common/constants/common.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getDefaultPageSize } from '../../../../common/helpers/pagination/index.js'
import {
  getAccounts,
  getPendingCount,
  getActiveCount
} from '../../../../common/services/accounts/accounts-service.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import {
  formatUsersForDisplay,
  buildUsersViewModel,
  getEmptyUsersViewModel
} from './user-listing.js'

// Extract filters and page from request - outer scope helper
function buildRequestContext(request) {
  const session = getAuthSession(request)
  const logger = request.server.logger

  const cacheService = createAccountsCacheService(request.server)

  const userCreatedFlash = request.yar.flash('userCreated')
  const successNotification =
    userCreatedFlash.length > 0 ? userCreatedFlash[0] : null

  const page =
    Number.parseInt(request.query.page, 10) || PAGINATION.DEFAULT_PAGE
  const search = request.query.search || ''
  const areaId = request.query.areaId || ''
  const filters = { search, areaId }

  return { session, logger, cacheService, successNotification, page, filters }
}

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
  // helper functions are defined in outer or inner scope

  async function fetchData({ session, cacheService, page, filters }) {
    const { search, areaId } = filters

    return Promise.all([
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
  }

  function renderEmptyView(h, request, session, filters, successNotification) {
    return h.view(
      viewTemplate,
      getEmptyUsersViewModel({
        request,
        session,
        filters,
        currentTab: status,
        baseUrl,
        error: request.t('accounts.manage_users.errors.fetch_failed'),
        successNotification
      })
    )
  }

  function renderUsersView(
    h,
    request,
    session,
    users,
    pagination,
    options = {}
  ) {
    const { pendingCount, activeCount, filters, successNotification } = options
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
        baseUrl,
        successNotification
      })
    )
  }

  return {
    async handler(request, h) {
      const {
        session,
        logger,
        cacheService,
        successNotification,
        page,
        filters
      } = buildRequestContext(request)

      try {
        const [accountsResult, pendingCount, activeCount] = await fetchData({
          session,
          cacheService,
          page,
          filters
        })

        if (!accountsResult.success) {
          logger.error(
            { errors: accountsResult.errors },
            `Failed to fetch ${status} accounts`
          )
          return renderEmptyView(
            h,
            request,
            session,
            filters,
            successNotification
          )
        }

        const { data: users, pagination } = accountsResult.data
        return renderUsersView(h, request, session, users, pagination, {
          pendingCount,
          activeCount,
          filters,
          successNotification
        })
      } catch (error) {
        logger.error({ error }, `Error loading ${status} users page`)
        return renderEmptyView(
          h,
          request,
          session,
          filters,
          successNotification
        )
      }
    }
  }
}
