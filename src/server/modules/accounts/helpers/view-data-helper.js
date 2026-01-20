import { ROUTES } from '../../../common/constants/routes.js'

/**
 * Add edit mode context to view data
 * @param {Object} request - Hapi request object
 * @param {Object} viewData - Base view data
 * @param {Object} routes - Route configuration with base routes
 * @returns {Object} View data with edit mode context
 */
export function addEditModeContext(request, viewData, routes) {
  const encodedId = request.params?.encodedId
  const isEditMode = !!encodedId

  if (!isEditMode) {
    return viewData
  }

  // Add edit mode flag
  viewData.isEditMode = true

  // Add cancel route
  viewData.cancelRoute = ROUTES.ADMIN.USER_VIEW.replace(
    '{encodedId}',
    encodedId
  )

  // Update submit route if provided
  if (routes?.editRoute && encodedId) {
    viewData.submitRoute = routes.editRoute.replace('{encodedId}', encodedId)
  }

  return viewData
}
