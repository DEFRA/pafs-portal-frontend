import { ROUTES } from '../../../common/constants/routes.js'
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
import {
  requireJourneyStarted,
  requireNotAuthenticated
} from '../../accounts/helpers.js'
import { startController } from '../../accounts/start/controller.js'

/**
 * Account request routes - for self-registration
 */
export const accounts = {
  plugin: {
    name: 'Accounts',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.OLD,
          options: {
            pre: [{ method: requireNotAuthenticated }]
          },
          ...startController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.START,
          options: {
            pre: [{ method: requireNotAuthenticated }]
          },
          ...startController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.DETAILS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...detailsController
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.ACCOUNTS.DETAILS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...detailsPostController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS + '/{type}',
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...parentAreasController
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS + '/{type}',
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...parentAreasPostController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...mainAreaController
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...mainAreaPostController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...additionalAreasController
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...additionalAreasPostController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...checkAnswersController
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS,
          options: {
            pre: [
              { method: requireNotAuthenticated },
              { method: requireJourneyStarted(false) }
            ]
          },
          ...checkAnswersPostController
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCOUNTS.CONFIRMATION,
          options: {
            pre: [{ method: requireNotAuthenticated }]
          },
          ...confirmationController
        }
      ])
    }
  }
}
