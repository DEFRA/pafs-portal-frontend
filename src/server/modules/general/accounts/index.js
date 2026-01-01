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

// Helper to create route options with not authenticated check
function createNotAuthOptions() {
  return {
    pre: [{ method: requireNotAuthenticated }]
  }
}

function createNotAuthWithJourneyOptions() {
  return {
    pre: [
      { method: requireNotAuthenticated },
      { method: requireJourneyStarted(false) }
    ]
  }
}

// Route definitions grouped by concern
function getStartRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.OLD,
      options: createNotAuthOptions(),
      ...startController
    },
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.START,
      options: createNotAuthOptions(),
      ...startController
    }
  ]
}

function getDetailsRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.DETAILS,
      options: createNotAuthWithJourneyOptions(),
      ...detailsController
    },
    {
      method: 'POST',
      path: ROUTES.GENERAL.ACCOUNTS.DETAILS,
      options: createNotAuthWithJourneyOptions(),
      ...detailsPostController
    }
  ]
}

function getParentAreasRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS + '/{type}',
      options: createNotAuthWithJourneyOptions(),
      ...parentAreasController
    },
    {
      method: 'POST',
      path: ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS + '/{type}',
      options: createNotAuthWithJourneyOptions(),
      ...parentAreasPostController
    }
  ]
}

function getMainAreaRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
      options: createNotAuthWithJourneyOptions(),
      ...mainAreaController
    },
    {
      method: 'POST',
      path: ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
      options: createNotAuthWithJourneyOptions(),
      ...mainAreaPostController
    }
  ]
}

function getAdditionalAreasRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
      options: createNotAuthWithJourneyOptions(),
      ...additionalAreasController
    },
    {
      method: 'POST',
      path: ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
      options: createNotAuthWithJourneyOptions(),
      ...additionalAreasPostController
    }
  ]
}

function getCheckAnswersRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS,
      options: createNotAuthWithJourneyOptions(),
      ...checkAnswersController
    },
    {
      method: 'POST',
      path: ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS,
      options: createNotAuthWithJourneyOptions(),
      ...checkAnswersPostController
    }
  ]
}

function getConfirmationRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.GENERAL.ACCOUNTS.CONFIRMATION,
      options: createNotAuthOptions(),
      ...confirmationController
    }
  ]
}

export const accounts = {
  plugin: {
    name: 'Accounts',
    register(server) {
      const routes = [
        ...getStartRoutes(),
        ...getDetailsRoutes(),
        ...getParentAreasRoutes(),
        ...getMainAreaRoutes(),
        ...getAdditionalAreasRoutes(),
        ...getCheckAnswersRoutes(),
        ...getConfirmationRoutes()
      ]

      server.route(routes)
    }
  }
}
