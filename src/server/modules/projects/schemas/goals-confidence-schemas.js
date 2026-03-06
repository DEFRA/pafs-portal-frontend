import Joi from 'joi'
import {
  approachSchema,
  urgencyReasonSchema,
  urgencyDetailsSchema,
  confidenceHomesBetterProtectedSchema,
  confidenceHomesByGatewayFourSchema,
  confidenceSecuredPartnershipFundingSchema
} from '../../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Goals, urgency, and confidence validation schemas
 * Includes: approach, urgency reason/details, confidence assessments
 */

export const validateProjectGoals = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.APPROACH]: approachSchema
})
  .options({ abortEarly: false })
  .label('Project Goals')

export const validateUrgencyReason = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: urgencyReasonSchema
})
  .options({ abortEarly: false })
  .label('Urgency Reason')

export const validateUrgencyDetails = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: urgencyReasonSchema,
  [PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS]: urgencyDetailsSchema
})
  .options({ abortEarly: false })
  .label('Urgency Details')

export const validateConfidenceHomesBetterProtected = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED]:
    confidenceHomesBetterProtectedSchema
})
  .options({ abortEarly: false })
  .label('Confidence Homes Better Protected')

export const validateConfidenceHomesByGatewayFour = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]:
    confidenceHomesByGatewayFourSchema
})
  .options({ abortEarly: false })
  .label('Confidence Homes By Gateway Four')

export const validateConfidenceSecuredPartnershipFunding = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]:
    confidenceSecuredPartnershipFundingSchema
})
  .options({ abortEarly: false })
  .label('Confidence Secured Partnership Funding')
