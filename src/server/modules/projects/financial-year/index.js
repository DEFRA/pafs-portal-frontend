import { ROUTES } from '../../../common/constants/routes.js'
import {
  requireRmaUser,
  requireFinancialStartYearSet,
  requirePrimaryInterventionTypeSet,
  noEditSessionRequired
} from '../helpers/permissions.js'
import { createRoutePair } from '../helpers/route-helpers.js'
import { financialYearController } from './controller.js'

export const projectFinancialYear = {
  plugin: {
    name: 'Project - Financial Year',
    register(server) {
      const basePreHandlers = [
        { method: requireRmaUser },
        { method: noEditSessionRequired }
      ]

      server.route([
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_START_YEAR,
          ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR,
          [...basePreHandlers, requirePrimaryInterventionTypeSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL,
          ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL,
          [...basePreHandlers, requirePrimaryInterventionTypeSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_END_YEAR,
          ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR,
          [...basePreHandlers, requireFinancialStartYearSet],
          financialYearController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL,
          ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL,
          [...basePreHandlers, requireFinancialStartYearSet],
          financialYearController
        )
      ])
    }
  }
}
