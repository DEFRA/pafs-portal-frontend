import { organisationsListingController } from './listing/controller.js'
import { organisationManageController } from './manage/controller.js'
import { organisationTypeController } from './type/controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchOrganisationForAdmin,
  initializeEditSessionPreHandler
} from './helpers/organisations.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const organisations = {
  plugin: {
    name: 'Admin Organisations',
    register(server) {
      server.route([
        // Listing
        {
          method: 'GET',
          path: ROUTES.ADMIN.ORGANISATIONS,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...organisationsListingController
        },
        // Select type (add)
        {
          method: 'GET',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/add`,
          options: {
            pre: [{ method: requireAdmin }]
          },
          handler: organisationTypeController.getHandler
        },
        {
          method: 'POST',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/add`,
          options: {
            pre: [{ method: requireAdmin }]
          },
          handler: organisationTypeController.postHandler
        },
        // Organisation add (handles all types: authority, pso, rma)
        {
          method: 'GET',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/{orgType}`,
          options: {
            pre: [{ method: requireAdmin }]
          },
          handler: organisationManageController.getOrganisationHandler
        },
        {
          method: 'POST',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/{orgType}`,
          options: {
            pre: [{ method: requireAdmin }]
          },
          handler: organisationManageController.postOrganisationHandler
        },
        // Organisation edit (handles all types: authority, pso, rma)
        {
          method: 'GET',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/{orgType}/{encodedId}`,
          options: {
            pre: [
              { method: requireAdmin },
              {
                method: fetchOrganisationForAdmin,
                assign: 'organisationData'
              },
              { method: initializeEditSessionPreHandler }
            ]
          },
          handler: organisationManageController.getOrganisationHandler
        },
        {
          method: 'POST',
          path: `${ROUTES.ADMIN.ORGANISATIONS}/{orgType}/{encodedId}`,
          options: {
            pre: [
              { method: requireAdmin },
              {
                method: fetchOrganisationForAdmin,
                assign: 'organisationData'
              },
              { method: initializeEditSessionPreHandler }
            ]
          },
          handler: organisationManageController.postOrganisationHandler
        }
      ])
    }
  }
}
