/**
 * Users List Controller Factory
 * Creates controllers for pending and active users pages
 * to avoid code duplication
 */

import { getDefaultPageSize } from '../../../../common/helpers/pagination/index.js'
import {
  getAccounts,
  getPendingCount,
  getActiveCount
} from '../../../../common/services/accounts/accounts-service.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { buildListingRequestContext } from '../../common/listing-helpers.js'
import {
  formatUsersForDisplay,
  buildUsersViewModel,
  getEmptyUsersViewModel
} from './user-listing.js'

async function fetchUsersData({
  status,
  session,
  cacheService,
  page,
  filters
}) {
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

function renderEmptyView(params) {
  const {
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    filters,
    areasByType,
    successNotification,
    errorNotification
  } = params

  return h.view(
    viewTemplate,
    getEmptyUsersViewModel({
      request,
      session,
      filters,
      currentTab: status,
      baseUrl,
      areasByType,
      error: request.t('accounts.manage_users.errors.fetch_failed'),
      successNotification,
      errorNotification
    })
  )
}

function renderUsersView(params) {
  const {
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    users,
    pagination,
    pendingCount,
    activeCount,
    filters,
    areasByType,
    successNotification,
    errorNotification
  } = params

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
      areasByType,
      successNotification,
      errorNotification
    })
  )
}

function handleSuccessResponse(params) {
  const {
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    accountsResult,
    pendingCount,
    activeCount,
    filters,
    successNotification,
    areasByType
  } = params

  const { data: users, pagination } = accountsResult.data
  return renderUsersView({
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    users,
    pagination,
    pendingCount,
    activeCount,
    filters,
    areasByType,
    successNotification,
    errorNotification: params.errorNotification
  })
}

/**
 * Handle failed data fetch
 * @param {Object} params - Handler parameters
 * @returns {Object} Hapi response
 */
function handleErrorResponse(params) {
  const {
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    filters,
    areasByType,
    successNotification,
    errorNotification,
    logger,
    error
  } = params

  if (error) {
    logger.error({ error }, `Error loading ${status} users page`)
  } else {
    logger.error(
      { errors: params.errors },
      `Failed to fetch ${status} accounts`
    )
  }

  return renderEmptyView({
    h,
    request,
    viewTemplate,
    status,
    baseUrl,
    session,
    filters,
    areasByType,
    successNotification,
    errorNotification
  })
}

export function createUsersListController({ status, viewTemplate, baseUrl }) {
  return {
    async handler(request, h) {
      const {
        session,
        logger,
        successNotification,
        errorNotification,
        page,
        filters
      } = buildListingRequestContext(request, ['search', 'areaId'])

      const cacheService = createAccountsCacheService(request.server)

      try {
        // Fetch areas data from request decorator
        const areasByType = await request.getAreas()

        const [accountsResult, pendingCount, activeCount] =
          await fetchUsersData({
            status,
            session,
            cacheService,
            page,
            filters
          })

        if (!accountsResult.success) {
          return handleErrorResponse({
            h,
            request,
            viewTemplate,
            status,
            baseUrl,
            session,
            filters,
            areasByType,
            successNotification,
            errorNotification,
            logger,
            errors: accountsResult.errors
          })
        }

        return handleSuccessResponse({
          h,
          request,
          viewTemplate,
          status,
          baseUrl,
          session,
          accountsResult,
          pendingCount,
          activeCount,
          filters,
          areasByType,
          successNotification,
          errorNotification
        })
      } catch (error) {
        return handleErrorResponse({
          h,
          request,
          viewTemplate,
          status,
          baseUrl,
          session,
          filters,
          areasByType: null,
          successNotification,
          errorNotification,
          logger,
          error
        })
      }
    }
  }
}
