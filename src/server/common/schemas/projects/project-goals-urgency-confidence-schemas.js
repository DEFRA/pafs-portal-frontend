import Joi from 'joi'
import {
  URGENCY_REASONS,
  CONFIDENCE_LEVELS,
  PROJECT_VALIDATION_MESSAGES
} from '../../constants/projects.js'
import { SIZE } from '../../constants/common.js'

/**
 * Approach / Project Goals schema
 * Character count field, max 700 characters
 */
export const approachSchema = Joi.string()
  .trim()
  .required()
  .max(SIZE.LENGTH_700)
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.APPROACH_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.APPROACH_REQUIRED,
    'string.max': PROJECT_VALIDATION_MESSAGES.APPROACH_MAX_LENGTH
  })

/**
 * Urgency reason schema
 * Radio field with valid urgency reason values
 */
export const urgencyReasonSchema = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(URGENCY_REASONS))
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.URGENCY_REASON_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.URGENCY_REASON_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.URGENCY_REASON_INVALID
  })

/**
 * Urgency details schema
 * Character count field, max 700 characters
 */
export const urgencyDetailsSchema = Joi.string()
  .trim()
  .required()
  .max(SIZE.LENGTH_700)
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.URGENCY_DETAILS_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.URGENCY_DETAILS_REQUIRED,
    'string.max': PROJECT_VALIDATION_MESSAGES.URGENCY_DETAILS_MAX_LENGTH
  })

/**
 * Confidence level schema factory
 * Creates a schema for a confidence radio field
 */
function confidenceSchema(requiredMessage, invalidMessage) {
  return Joi.string()
    .trim()
    .required()
    .valid(...Object.values(CONFIDENCE_LEVELS))
    .messages({
      'string.empty': requiredMessage,
      'any.required': requiredMessage,
      'any.only': invalidMessage
    })
}

export const confidenceHomesBetterProtectedSchema = confidenceSchema(
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_HOMES_BETTER_PROTECTED_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_HOMES_BETTER_PROTECTED_INVALID
)

export const confidenceHomesByGatewayFourSchema = confidenceSchema(
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_HOMES_BY_GATEWAY_FOUR_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_HOMES_BY_GATEWAY_FOUR_INVALID
)

export const confidenceSecuredPartnershipFundingSchema = confidenceSchema(
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING_REQUIRED,
  PROJECT_VALIDATION_MESSAGES.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING_INVALID
)
