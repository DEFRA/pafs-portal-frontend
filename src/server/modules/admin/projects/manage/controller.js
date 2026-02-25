import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'
import {
  getProjectProposalOverview,
  upsertProjectProposal
} from '../../../../common/services/project/project-service.js'
import {
  extractApiValidationErrors,
  extractApiError
} from '../../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createProjectsCacheService } from '../../../../common/services/project/project-cache.js'

class ProjectsManageController {
  /**
   * Build view data for project form
   */
  async buildViewData(request, viewData, errors = {}) {
    const rmaListOptions = await this.getRmaListOptions(request)
    const { fieldErrors = {}, errorCode = '' } = errors

    // Build error summary for GDS error summary component
    const errorSummary =
      fieldErrors && Object.keys(fieldErrors).length > 0
        ? Object.entries(fieldErrors).map(([field, message]) => ({
            text: message,
            href: `#${field}`
          }))
        : null

    return {
      request,
      pageTitle: request.t('projects.manage_projects.edit_rma.title'),
      heading: request.t('projects.manage_projects.edit_rma.heading'),
      cancelUrl: ROUTES.ADMIN.PROJECTS,
      fieldErrors,
      errorCode,
      errorSummary,
      data: viewData,
      rmaListOptions
    }
  }

  /**
   * Get RMA area options for project RMA edit
   * Returns 'All RMAs' option plus RMA areas only
   */
  async getRmaListOptions(request) {
    const areasData = await request.getAreas()
    const rmaAreas = areasData?.[AREAS_RESPONSIBILITIES_MAP.RMA] ?? []

    return rmaAreas.map((area) => ({
      value: area.id,
      text: area.name
    }))
  }

  async get(request, h) {
    const referenceNumberFromUrl = request.params?.referenceNumber
    const referenceNumber = referenceNumberFromUrl?.replace(/-/g, '/')
    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken

    // Try to get project from cache first
    const cacheService = createProjectsCacheService(request.server)
    const cachedProject =
      await cacheService.getProjectByReferenceNumber(referenceNumber)

    let projectData

    if (cachedProject) {
      request.server.logger.info(
        { referenceNumber },
        'Project found in cache for manage page'
      )
      projectData = {
        success: true,
        data: cachedProject
      }
    } else {
      request.server.logger.info(
        { referenceNumber },
        'Project not in cache, fetching from API for manage page'
      )
      projectData = await getProjectProposalOverview(
        referenceNumberFromUrl,
        accessToken
      )
    }

    const viewData = this.transformData(projectData.data)
    request.yar.set('projectManageViewData', viewData)

    return h.view(
      ADMIN_VIEWS.PROJECT_MANAGE,
      await this.buildViewData(request, viewData)
    )
  }

  async post(request, h) {
    const referenceNumber = request.params?.referenceNumber
    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken
    const cacheService = createProjectsCacheService(request.server)
    const newAreaId = request.payload?.areaId
    const viewData = request.yar.get('projectManageViewData') || {}

    // Validate that the selected RMA is different from the current one
    if (Number(newAreaId) === viewData.areaId) {
      const fieldErrors = {
        areaId: request.t('projects.manage_projects.errors.same_rma')
      }
      return h.view(
        ADMIN_VIEWS.PROJECT_MANAGE,
        await this.buildViewData(request, viewData, { fieldErrors })
      )
    }

    try {
      const apiPayload = this.buildApiPayload(referenceNumber, newAreaId)

      // Call the upsert API to update the project's RMA
      const result = await upsertProjectProposal(apiPayload, accessToken)

      request.server.logger.info(
        {
          result,
          newAreaId
        },
        'Upsert project RMA result'
      )

      if (!result?.success) {
        // Create error with API response attached
        const error = new Error('API request failed')
        error.response = { data: result }
        throw error
      }

      return await this.handleSaveSuccess(request, h, result, cacheService)
    } catch (error) {
      return this.handleSaveError(request, h, viewData, error)
    }
  }

  transformData(data) {
    const transformed = {
      id: data.id ? Number(data.id) : null,
      referenceNumber: data.referenceNumber,
      projectName: data.name,
      rmaName: data.rmaName,
      areaId: data.areaId ? Number(data.areaId) : null
    }
    return transformed
  }

  buildApiPayload(referenceNumber, areaId) {
    return {
      level: 'PROJECT_AREA',
      payload: {
        referenceNumber: referenceNumber?.replace(/-/g, '/'),
        areaId: Number(areaId)
      }
    }
  }

  /**
   * Handle successful save
   */
  async handleSaveSuccess(request, h, response, cache) {
    request.yar.clear('projectManageViewData')
    request.yar.flash('success', {
      message: `${response.data.data.name} ${request.t('projects.manage_projects.notifications.rma_changed')}`
    })
    cache.invalidateAll()
    return h.redirect(ROUTES.ADMIN.PROJECTS)
  }

  /**
   * Handle save error
   */
  async handleSaveError(request, h, viewData, error) {
    request.server.logger.error(
      { error, message: error.message, stack: error.stack },
      'Error saving project RMA change'
    )

    // Get API response data (could be in error.response.data or error itself)
    const apiResponse = error.response?.data || error

    // Check if this is an API response with validation errors
    if (apiResponse?.validationErrors) {
      const fieldErrors = extractApiValidationErrors(apiResponse)
      return h.view(
        ADMIN_VIEWS.PROJECT_MANAGE,
        await this.buildViewData(request, viewData, { fieldErrors })
      )
    }

    // Handle API error code or unexpected errors
    const apiError = extractApiError(apiResponse)
    const errorCode = apiError?.errorCode || 'SAVE_FAILED'

    return h.view(
      ADMIN_VIEWS.PROJECT_MANAGE,
      await this.buildViewData(request, viewData, { errorCode })
    )
  }
}

const controller = new ProjectsManageController()

export const projectsManageController = {
  getProjectHandler: (request, h) => controller.get(request, h),
  postProjectHandler: (request, h) => controller.post(request, h)
}
