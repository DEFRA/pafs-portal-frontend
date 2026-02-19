import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { goalsUrgencyConfidenceController } from './controller.js'

const controller = goalsUrgencyConfidenceController

export const projectGoalsUrgencyConfidence = {
  plugin: {
    name: 'Project - Goals, Urgency & Confidence',
    register(server) {
      server.route([
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.PROJECT_GOALS, controller),
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.URGENCY_REASON, controller),
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.URGENCY_DETAILS, controller),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING,
          controller
        )
      ])
    }
  }
}
