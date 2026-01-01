import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { startController } from '../../accounts/start/controller.js'
import {
  isAdminController,
  isAdminPostController
} from '../../accounts/is-admin/controller.js'
import {
  detailsController,
  detailsPostController
} from '../../accounts/details/controller.js'
import {
  parentAreasController,
  parentAreasPostController
} from '../../accounts/parent-areas/controller.js'
import {
  mainAreaController,
  mainAreaPostController
} from '../../accounts/main-area/controller.js'
import {
  additionalAreasController,
  additionalAreasPostController
} from '../../accounts/additional-areas/controller.js'
import {
  checkAnswersController,
  checkAnswersPostController
} from '../../accounts/check-answers/controller.js'
import { confirmationController } from '../../accounts/confirmation/controller.js'
import { requireJourneyStarted } from '../../accounts/helpers.js'

/**
 * Admin user management routes
 */
export const accounts = {
  plugin: {
    name: 'Admin User Management',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.START,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...startController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...isAdminController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...isAdminPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.DETAILS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...detailsController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.DETAILS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...detailsPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS + '/{type}',
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...parentAreasController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS + '/{type}',
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...parentAreasPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.MAIN_AREA,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...mainAreaController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.MAIN_AREA,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...mainAreaPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...additionalAreasController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...additionalAreasPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...checkAnswersController
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS,
          options: {
            pre: [
              { method: requireAdmin },
              { method: requireJourneyStarted(true) }
            ]
          },
          ...checkAnswersPostController
        },
        {
          method: 'GET',
          path: ROUTES.ADMIN.ACCOUNTS.CONFIRMATION,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...confirmationController
        }
      ])
    }
  }
}
