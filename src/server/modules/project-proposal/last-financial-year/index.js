import { lastFinancialYearController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType,
  requireFirstFinancialYear
} from '../common/proposal-guard.js'

export const lastFinancialYear = {
  plugin: {
    name: 'Project Proposal - Last Financial Year',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireFirstFinancialYear
            ]
          },
          ...lastFinancialYearController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireFirstFinancialYear
            ]
          },
          ...lastFinancialYearController
        }
      ])
    }
  }
}
