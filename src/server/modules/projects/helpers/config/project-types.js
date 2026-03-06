import { PROJECT_STEPS } from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  validateMainInterventionType,
  validateProjectInterventionTypes,
  validateProjectType
} from '../../schema.js'

export const interventionTypesLocalKeyPrefix = 'projects.intervention_type'
export const projectTypesLocalKeyPrefix = 'projects.project_type'

/**
 * Configuration for project type related steps
 */
export const PROJECT_TYPES_CONFIG = {
  [PROJECT_STEPS.TYPE]: {
    localKeyPrefix: projectTypesLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.AREA,
      conditionalRedirect: true
    },
    schema: validateProjectType
  },
  [PROJECT_STEPS.INTERVENTION_TYPE]: {
    localKeyPrefix: interventionTypesLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.TYPE,
      targetEditURL: ROUTES.PROJECT.EDIT.TYPE,
      conditionalRedirect: false
    },
    schema: validateProjectInterventionTypes
  },
  [PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE]: {
    localKeyPrefix: 'projects.primary_intervention_type',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.INTERVENTION_TYPE,
      targetEditURL: ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
      conditionalRedirect: false
    },
    schema: validateMainInterventionType
  }
}
