import { lastFinancialYearManualController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType,
  requireFirstFinancialYear
} from '../common/proposal-guard.js'

export const lastFinancialYearManual = {
  plugin: {
    name: 'Project Proposal - Last Financial Year Manual',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireFirstFinancialYear
            ]
          },
          ...lastFinancialYearManualController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR_MANUAL,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireFirstFinancialYear
            ]
          },
          ...lastFinancialYearManualController
        }
      ])
    }
  }
}
