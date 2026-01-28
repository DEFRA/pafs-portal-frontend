import { createLastFinancialYearController, VIEW_TYPES } from './controller.js'
import { requireAuth } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType,
  requireFirstFinancialYear
} from '../../helpers/proposal-guard.js'

const radioController = createLastFinancialYearController(VIEW_TYPES.RADIO)
const manualController = createLastFinancialYearController(VIEW_TYPES.MANUAL)

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
          ...radioController
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
          ...radioController
        },
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
          ...manualController
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
          ...manualController
        }
      ])
    }
  }
}
