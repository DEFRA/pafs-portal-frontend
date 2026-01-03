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

// Helper to create route options with authentication
function createAuthOptions() {
  return {
    pre: [{ method: requireAdmin }]
  }
}

function createAuthWithJourneyOptions() {
  return {
    pre: [{ method: requireAdmin }, { method: requireJourneyStarted(true) }]
  }
}

// Route definitions grouped by concern
function getStartRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.START,
      options: createAuthOptions(),
      ...startController
    }
  ]
}

function getAdminFlagRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN,
      options: createAuthWithJourneyOptions(),
      ...isAdminController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN,
      options: createAuthWithJourneyOptions(),
      ...isAdminPostController
    }
  ]
}

function getDetailsRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.DETAILS,
      options: createAuthWithJourneyOptions(),
      ...detailsController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.DETAILS,
      options: createAuthWithJourneyOptions(),
      ...detailsPostController
    }
  ]
}

function getParentAreasRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS + '/{type}',
      options: createAuthWithJourneyOptions(),
      ...parentAreasController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS + '/{type}',
      options: createAuthWithJourneyOptions(),
      ...parentAreasPostController
    }
  ]
}

function getMainAreaRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.MAIN_AREA,
      options: createAuthWithJourneyOptions(),
      ...mainAreaController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.MAIN_AREA,
      options: createAuthWithJourneyOptions(),
      ...mainAreaPostController
    }
  ]
}

function getAdditionalAreasRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS,
      options: createAuthWithJourneyOptions(),
      ...additionalAreasController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS,
      options: createAuthWithJourneyOptions(),
      ...additionalAreasPostController
    }
  ]
}

function getCheckAnswersRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS,
      options: createAuthWithJourneyOptions(),
      ...checkAnswersController
    },
    {
      method: 'POST',
      path: ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS,
      options: createAuthWithJourneyOptions(),
      ...checkAnswersPostController
    }
  ]
}

function getConfirmationRoutes() {
  return [
    {
      method: 'GET',
      path: ROUTES.ADMIN.ACCOUNTS.CONFIRMATION,
      options: createAuthOptions(),
      ...confirmationController
    }
  ]
}

export const accounts = {
  plugin: {
    name: 'Admin User Management',
    register(server) {
      const routes = [
        ...getStartRoutes(),
        ...getAdminFlagRoutes(),
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
