import { createFirstFinancialYearController, VIEW_TYPES } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireProjectName,
  requireProjectType
} from '../helpers/proposal-guard.js'

const radioController = createFirstFinancialYearController(VIEW_TYPES.RADIO)
const manualController = createFirstFinancialYearController(VIEW_TYPES.MANUAL)

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
          ...radioController
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
          ...radioController
        },
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
          ...manualController
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
          ...manualController
        }
      ])
    }
  }
}
