import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  validateProjectGoals,
  validateUrgencyReason,
  validateUrgencyDetails,
  validateConfidenceHomesBetterProtected,
  validateConfidenceHomesByGatewayFour,
  validateConfidenceSecuredPartnershipFunding
} from '../../schema.js'

/**
 * Configuration for project goals, urgency, and confidence assessment steps
 * These sections use only character-count (textarea) and radio field types.
 */
export const GOALS_URGENCY_CONFIDENCE_CONFIG = {
  [PROJECT_STEPS.PROJECT_GOALS]: {
    localKeyPrefix: 'projects.project_goals',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateProjectGoals,
    fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
    fieldType: 'character-count',
    maxLength: 700
  },
  [PROJECT_STEPS.URGENCY_REASON]: {
    localKeyPrefix: 'projects.project_urgency.urgency_reason',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateUrgencyReason,
    fieldName: PROJECT_PAYLOAD_FIELDS.URGENCY_REASON,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.URGENCY_DETAILS]: {
    localKeyPrefix: 'projects.project_urgency.urgency_detail',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.URGENCY_REASON,
      conditionalRedirect: false
    },
    schema: validateUrgencyDetails,
    fieldName: PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS,
    fieldType: 'character-count',
    maxLength: 700
  },
  [PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED]: {
    localKeyPrefix: 'projects.confidence_assessment.property_confidence',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateConfidenceHomesBetterProtected,
    fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]: {
    localKeyPrefix: 'projects.confidence_assessment.gateway_confidence',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED,
      conditionalRedirect: false
    },
    schema: validateConfidenceHomesByGatewayFour,
    fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]: {
    localKeyPrefix: 'projects.confidence_assessment.funding_confidence',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
      conditionalRedirect: false
    },
    schema: validateConfidenceSecuredPartnershipFunding,
    fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING,
    fieldType: 'radio'
  }
}
