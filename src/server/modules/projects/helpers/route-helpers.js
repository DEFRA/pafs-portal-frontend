import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from './project-edit-session.js'
import { requireEditPermission, requireEditableStatus } from './permissions.js'

const editPreHandlers = [
  { method: requireAuth },
  { method: fetchProjectForEdit },
  { method: initializeEditSessionPreHandler },
  { method: requireEditableStatus },
  { method: requireEditPermission }
]

/**
 * Create GET/POST route pair for creation and edit modes
 * @param {string} createPath - Path for creation route
 * @param {string} editPath - Path for edit route
 * @param {Array} createPreHandlers - Pre-handlers for creation routes
 * @param {Object} controller - Controller with getHandler and postHandler methods
 * @returns {Array} Array of 4 route configurations (GET/POST for create and edit)
 */
export const createRoutePair = (
  createPath,
  editPath,
  createPreHandlers,
  controller
) => {
  return [
    {
      method: 'GET',
      path: createPath,
      options: { pre: createPreHandlers, handler: controller.getHandler }
    },
    {
      method: 'POST',
      path: createPath,
      options: { pre: createPreHandlers, handler: controller.postHandler }
    },
    ...createEditRoutePair(editPath, controller)
  ]
}

/**
 * Create GET/POST route pair for edit-only routes (no creation path)
 * @param {string} editPath - Path for edit route
 * @param {Object} controller - Controller with getHandler and postHandler methods
 * @param {Array} additionalPreHandlers - Optional additional pre-handlers to append after standard edit pre-handlers
 * @returns {Array} Array of 2 route configurations (GET/POST for edit)
 */
export const createEditRoutePair = (
  editPath,
  controller,
  additionalPreHandlers = []
) => {
  const preHandlers = [...editPreHandlers, ...additionalPreHandlers]

  return [
    {
      method: 'GET',
      path: editPath,
      options: { pre: preHandlers, handler: controller.getHandler }
    },
    {
      method: 'POST',
      path: editPath,
      options: { pre: preHandlers, handler: controller.postHandler }
    }
  ]
}
