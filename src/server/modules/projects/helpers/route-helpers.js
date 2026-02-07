import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from './project-edit-session.js'
import { requireEditPermission } from './permissions.js'

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
  const editPreHandlers = [
    { method: requireAuth },
    { method: fetchProjectForEdit },
    { method: initializeEditSessionPreHandler },
    { method: requireEditPermission }
  ]

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
    {
      method: 'GET',
      path: editPath,
      options: { pre: editPreHandlers, handler: controller.getHandler }
    },
    {
      method: 'POST',
      path: editPath,
      options: { pre: editPreHandlers, handler: controller.postHandler }
    }
  ]
}
