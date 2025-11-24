import {
  journeySelectionController,
  journeySelectionPostController
} from './controller.js'
import { requireAdmin } from '../../common/helpers/auth/auth-middleware.js'

export const journeySelection = {
  plugin: {
    name: 'Admin Journey Selection',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/admin/journey-selection',
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...journeySelectionController
        },
        {
          method: 'POST',
          path: '/admin/journey-selection',
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...journeySelectionPostController
        }
      ])
    }
  }
}
