import { firstFinancialYearController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType
} from '../helpers/proposal-guard.js'

export const firstFinancialYear = {
  plugin: {
    name: 'Project Proposal - First Financial Year',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...firstFinancialYearController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...firstFinancialYearController
        }
      ])
    }
  }
}
