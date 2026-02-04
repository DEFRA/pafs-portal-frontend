import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  noEditSessionRequired,
  requireEditPermission,
  requireInterventionTypesSet,
  requireProjectAreaSet,
  requireProjectTypeSet,
  requireRmaUser
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { typeController } from './controller.js'

export const projectType = {
  plugin: {
    name: 'Project - Project Type',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectAreaSet
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectAreaSet
            ],
            handler: typeController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectTypeSet
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectTypeSet
            ],
            handler: typeController.postHandler
          }
        },

        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireInterventionTypesSet
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireInterventionTypesSet
            ],
            handler: typeController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: typeController.postHandler
          }
        }
      ])
    }
  }
}
