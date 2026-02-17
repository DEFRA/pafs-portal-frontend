import { getDefaultPageSize } from '../../../../common/helpers/pagination/index.js'
import { getProjects } from '../../../../common/services/project/project-service.js'
import { createProjectsCacheService } from '../../../../common/services/project/project-cache.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  buildListingRequestContext,
  buildListingViewModel,
  buildEmptyListingViewModel
} from '../../common/listing-helpers.js'
import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'

/**
 * Get RMA area filter options for projects
 * Returns 'All RMAs' option plus RMA areas only
 *
 * @param {Function} t - Translation function
 * @param {Object} areasByType - Areas data structure from cache
 * @returns {Array} Area options for dropdown (RMA only)
 */
function getRmaAreaFilterOptions(t, areasByType) {
  const options = [
    { value: '', text: t('projects.manage_projects.filters.all_areas') }
  ]

  if (!areasByType) {
    return options
  }

  const rmaAreas = areasByType[AREAS_RESPONSIBILITIES_MAP.RMA] || []
  if (rmaAreas.length > 0) {
    const rmaOptions = rmaAreas.map((area) => ({
      value: area.id,
      text: area.name
    }))
    options.push(...rmaOptions)
  }

  return options
}

async function fetchProjectsData({ session, cacheService, page, filters }) {
  const { search, areaId } = filters

  return getProjects({
    search,
    areaId,
    page,
    pageSize: getDefaultPageSize(),
    accessToken: session?.accessToken,
    cacheService
  })
}

function renderEmptyView(params) {
  const {
    h,
    request,
    viewTemplate,
    baseUrl,
    session,
    filters,
    areasByType,
    successNotification,
    errorNotification
  } = params

  return h.view(
    viewTemplate,
    buildEmptyListingViewModel({
      request,
      session,
      filters,
      baseUrl,
      error: request.t('projects.manage_projects.errors.fetch_failed'),
      successNotification,
      errorNotification,
      additionalData: {
        areas: getRmaAreaFilterOptions(request.t, areasByType)
      }
    })
  )
}

function renderProjectsView(params) {
  const {
    h,
    request,
    viewTemplate,
    baseUrl,
    session,
    projects,
    pagination,
    filters,
    areasByType,
    successNotification,
    errorNotification
  } = params

  return h.view(
    viewTemplate,
    buildListingViewModel({
      request,
      session,
      pageTitle: request.t('projects.manage_projects.title'),
      pagination,
      filters,
      baseUrl,
      successNotification,
      errorNotification,
      additionalData: {
        projects,
        areas: getRmaAreaFilterOptions(request.t, areasByType)
      }
    })
  )
}

function handleSuccessResponse(params) {
  const {
    h,
    request,
    viewTemplate,
    baseUrl,
    session,
    projectsResult,
    filters,
    successNotification,
    areasByType
  } = params

  const projects = projectsResult.data?.data || []
  const pagination = projectsResult.data?.pagination || {}

  return renderProjectsView({
    h,
    request,
    viewTemplate,
    baseUrl,
    session,
    projects,
    pagination,
    filters,
    areasByType,
    successNotification,
    errorNotification: params.errorNotification
  })
}

function handleErrorResponse(params) {
  const {
    h,
    request,
    viewTemplate,
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
    logger.error({ error }, `Error loading projects page`)
  } else {
    logger.error({ errors: params.errors }, `Failed to fetch projects`)
  }

  return renderEmptyView({
    h,
    request,
    viewTemplate,
    baseUrl,
    session,
    filters,
    areasByType,
    successNotification,
    errorNotification
  })
}

export const projectsListingController = {
  async handler(request, h) {
    const {
      session,
      logger,
      successNotification,
      errorNotification,
      page,
      filters
    } = buildListingRequestContext(request, ['search', 'areaId'])

    const cacheService = createProjectsCacheService(request.server)
    const viewTemplate = ADMIN_VIEWS.PROJECTS
    const baseUrl = ROUTES.ADMIN.PROJECTS

    try {
      const areasByType = await request.getAreas()

      const projectsResult = await fetchProjectsData({
        session,
        cacheService,
        page,
        filters
      })

      if (!projectsResult.success) {
        return handleErrorResponse({
          h,
          request,
          viewTemplate,
          baseUrl,
          session,
          filters,
          areasByType,
          successNotification,
          errorNotification,
          logger,
          errors: projectsResult.errors
        })
      }

      return handleSuccessResponse({
        h,
        request,
        viewTemplate,
        baseUrl,
        session,
        projectsResult,
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
