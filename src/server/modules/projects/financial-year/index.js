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

export const projectFinancialYear = {
  plugin: {
    name: 'Project - Financial Year',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.FINANCIAL_START_YEAR,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requirePrimaryInterventionTypeSet
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.FINANCIAL_START_YEAR,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requirePrimaryInterventionTypeSet
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requirePrimaryInterventionTypeSet
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requirePrimaryInterventionTypeSet
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.FINANCIAL_END_YEAR,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireFinancialStartYearSet
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.FINANCIAL_END_YEAR,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireFinancialStartYearSet
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireFinancialStartYearSet
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireFinancialStartYearSet
            ],
            handler: financialYearController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: financialYearController.postHandler
          }
        }
      ])
    }
  }
}
