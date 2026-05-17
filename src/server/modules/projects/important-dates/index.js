import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { requireFinancialYears } from '../helpers/require-financial-years.js'
import { importantDatesController } from './controller.js'

const controller = importantDatesController
const importantDatesPreHandlers = [{ method: requireFinancialYears }]

export const projectImportantDates = {
  plugin: {
    name: 'Project - Important Dates',
    register(server) {
      server.route([
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.START_WORK,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.START_BENEFITS,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.COULD_START_EARLY,
          controller,
          importantDatesPreHandlers
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.EARLIEST_START_DATE,
          controller,
          importantDatesPreHandlers
        )
      ])
    }
  }
}
