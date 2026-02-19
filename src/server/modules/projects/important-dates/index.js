import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { importantDatesController } from './controller.js'

const controller = importantDatesController

export const projectImportantDates = {
  plugin: {
    name: 'Project - Important Dates',
    register(server) {
      server.route([
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
          controller
        ),
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.START_WORK, controller),
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.START_BENEFITS, controller),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.COULD_START_EARLY,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.EARLIEST_START_DATE,
          controller
        )
      ])
    }
  }
}
