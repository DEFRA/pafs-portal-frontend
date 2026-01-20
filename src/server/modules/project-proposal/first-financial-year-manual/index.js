import { firstFinancialYearManualController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType
} from '../helpers/proposal-guard.js'

export const firstFinancialYearManual = {
  plugin: {
    name: 'Project Proposal - First Financial Year (Manual Entry)',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...firstFinancialYearManualController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...firstFinancialYearManualController
        }
      ])
    }
  }
}
