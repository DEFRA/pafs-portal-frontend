import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  requireRmaUser,
  requireFinancialStartYearSet,
  requirePrimaryInterventionTypeSet,
  requireEditPermission,
  noEditSessionRequired
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { financialYearController } from './controller.js'

/**
 * Create GET/POST route pair for creation and edit modes
 */
const createRoutePair = (
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

export const projectFinancialYear = {
  plugin: {
    name: 'Project - Financial Year',
    register(server) {
      const basePreHandlers = [
        { method: requireRmaUser },
        { method: noEditSessionRequired }
      ]

      server.route([
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_START_YEAR,
          ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR,
          [...basePreHandlers, requirePrimaryInterventionTypeSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL,
          ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL,
          [...basePreHandlers, requirePrimaryInterventionTypeSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_END_YEAR,
          ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR,
          [...basePreHandlers, requireFinancialStartYearSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL,
          ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL,
          [...basePreHandlers, requireFinancialStartYearSet],
          financialYearController
        )
      ])
    }
  }
}
