import { getDefaultPageSize } from '../../../common/helpers/pagination/index.js'
import { getProjects } from '../../../common/services/project/project-service.js'
import { createProjectsCacheService } from '../../../common/services/project/project-cache.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildListingRequestContext,
  buildListingViewModel,
  buildEmptyListingViewModel
} from '../../admin/common/listing-helpers.js'
import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../common/constants/common.js'
import { PROJECT_STATUS } from '../../../common/constants/projects.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

/**
 * I18n key configuration for each listing variant.
 * Maps listing type to its title and heading translation keys.
 */
const LISTING_I18N_KEYS = {
  adminProjects: {
    titleKey: 'projects.manage_projects.title',
    headingKey: 'projects.manage_projects.heading',
    status: null
  },
  userProposals: {
    titleKey: 'home.title',
    headingKey: 'home.heading',
    status: null
  },
  submissions: {
    titleKey: 'projects.failed_submissions.title',
    headingKey: 'projects.failed_submissions.heading',
    status: PROJECT_STATUS.SUBMITTED
  },
  archive: {
    titleKey: 'projects.archived_proposals.title',
    headingKey: 'projects.archived_proposals.heading',
    status: PROJECT_STATUS.ARCHIVED
  }
}

/**
 * Determine listing context based on the current route path.
 * Returns the view template, base URL, boolean flags indicating
 * which listing variant is being rendered, and i18n keys for page title/heading.
 *
 * @param {Object} request - Hapi request object
 * @returns {Object} context - { viewTemplate, baseUrl, titleKey, headingKey, isAdminProjectListing, isUserProjectListing, isSubmission, isArchive }
 */
function getListingContext(request) {
  const path = request.route.path
  const session = getAuthSession(request)
  const user = session?.user

  const isAdminProjectListing = path === ROUTES.ADMIN.PROJECTS
  const isUserProjectListing =
    path === ROUTES.GENERAL.HOME || path === ROUTES.GENERAL.PROPOSALS
  const isSubmission = path === ROUTES.ADMIN.SUBMISSIONS
  const isArchive = path === ROUTES.GENERAL.ARCHIVE

  let i18nKeys = ''
  if (isUserProjectListing) {
    i18nKeys = LISTING_I18N_KEYS.userProposals
  } else if (isSubmission) {
    i18nKeys = LISTING_I18N_KEYS.submissions
  } else if (isArchive) {
    i18nKeys = LISTING_I18N_KEYS.archive
  } else {
    i18nKeys = LISTING_I18N_KEYS.adminProjects
  }

  return {
    viewTemplate: ADMIN_VIEWS.PROJECTS,
    baseUrl: path,
    ...i18nKeys,
    isAdminProjectListing,
    isUserProjectListing,
    isSubmission,
    isArchive,
    isAdmin: user?.admin || false,
    canCreateProjects: user?.isRma || false,
    isNotRMA: user?.admin || user?.isPso || user?.isEa || false
  }
}

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
  options.push(
    ...rmaAreas.map((area) => ({
      value: area.id,
      text: area.name
    }))
  )

  return options
}

async function fetchProjectsData({
  session,
  cacheService,
  page,
  filters,
  status
}) {
  const { search, areaId } = filters

  return getProjects({
    search,
    areaId,
    status,
    page,
    pageSize: getDefaultPageSize(),
    accessToken: session?.accessToken,
    cacheService
  })
}

/**
 * Build additional view data common to all listing variants.
 *
 * @param {Object} params
 * @param {Function} params.t - Translation function
 * @param {string} params.pageHeading - Translated page heading
 * @param {Object|null} params.areasByType - Areas data from cache
 * @param {Object} params.listingFlags - Route context flags
 * @param {Object} [extra] - Extra properties (e.g. projects)
 * @returns {Object} Additional data to merge into view model
 */
function buildAdditionalViewData(
  { t, pageHeading, areasByType, listingFlags },
  extra = {}
) {
  return {
    pageHeading,
    areas: getRmaAreaFilterOptions(t, areasByType),
    ...listingFlags,
    ...extra
  }
}

function renderEmptyView(params) {
  const { h, viewTemplate, request } = params

  return h.view(
    viewTemplate,
    buildEmptyListingViewModel({
      request,
      session: params.session,
      pageTitle: params.pageTitle,
      filters: params.filters,
      baseUrl: params.baseUrl,
      error: request.t('projects.manage_projects.errors.fetch_failed'),
      successNotification: params.successNotification,
      errorNotification: params.errorNotification,
      additionalData: buildAdditionalViewData({
        t: request.t,
        pageHeading: params.pageHeading,
        areasByType: params.areasByType,
        listingFlags: params.listingFlags
      })
    })
  )
}

function renderProjectsView(params) {
  const { h, viewTemplate, request } = params

  return h.view(
    viewTemplate,
    buildListingViewModel({
      request,
      session: params.session,
      pageTitle: params.pageTitle,
      pagination: params.pagination,
      filters: params.filters,
      baseUrl: params.baseUrl,
      successNotification: params.successNotification,
      errorNotification: params.errorNotification,
      additionalData: buildAdditionalViewData(
        {
          t: request.t,
          pageHeading: params.pageHeading,
          areasByType: params.areasByType,
          listingFlags: params.listingFlags
        },
        { projects: params.projects }
      )
    })
  )
}

function handleSuccessResponse({ sharedParams, projectsResult }) {
  const projects = projectsResult.data?.data || []
  const pagination = projectsResult.data?.pagination || {}

  return renderProjectsView({
    ...sharedParams,
    projects,
    pagination
  })
}

function handleErrorResponse({ sharedParams, logger, error, errors }) {
  if (error) {
    logger.error({ error }, 'Error loading projects page')
  } else {
    logger.error({ errors }, 'Failed to fetch projects')
  }

  return renderEmptyView(sharedParams)
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
    const {
      viewTemplate,
      baseUrl,
      titleKey,
      headingKey,
      status,
      isAdminProjectListing,
      isUserProjectListing,
      isSubmission,
      isArchive,
      isAdmin,
      canCreateProjects,
      isNotRMA
    } = getListingContext(request)

    const pageTitle = request.t(titleKey)
    const pageHeading = request.t(headingKey)

    const listingFlags = {
      isAdminProjectListing,
      isUserProjectListing,
      isSubmission,
      isArchive,
      isAdmin,
      canCreateProjects,
      isNotRMA
    }

    const sharedParams = {
      h,
      viewTemplate,
      request,
      session,
      filters,
      baseUrl,
      pageTitle,
      pageHeading,
      successNotification,
      errorNotification,
      areasByType: null,
      listingFlags
    }

    try {
      const areasByType = await request.getAreas()
      sharedParams.areasByType = areasByType

      const projectsResult = await fetchProjectsData({
        session,
        cacheService,
        page,
        filters,
        status
      })

      if (!projectsResult.success) {
        return handleErrorResponse({
          sharedParams,
          logger,
          errors: projectsResult.errors
        })
      }

      return handleSuccessResponse({ sharedParams, projectsResult })
    } catch (error) {
      return handleErrorResponse({ sharedParams, logger, error })
    }
  }
}

export { getListingContext }
