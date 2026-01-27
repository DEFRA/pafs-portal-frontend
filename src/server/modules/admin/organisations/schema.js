import Joi from 'joi'
import {
  dateComponentSchema,
  organisationIdentifierSchema,
  organisationNameSchema,
  areaTypeSchema
} from '../../../common/schemas/organisation.js'
import { AREA_VALIDATION_CODES } from '../../../common/constants/organisations.js'

/**
 * Area type selection schema
 */
export const areaTypeSelectionSchema = Joi.object({
  areaType: areaTypeSchema
})
  .options({ abortEarly: false })
  .label('Area Type')

/**
 * Authority organisation schema
 */
export const authoritySchema = Joi.object({
  name: organisationNameSchema,
  identifier: organisationIdentifierSchema.required().messages({
    'any.required': AREA_VALIDATION_CODES.IDENTIFIER_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.IDENTIFIER_REQUIRED
  }),
  endDate: dateComponentSchema
})
  .options({ abortEarly: false })
  .label('Authority')

/**
 * PSO Area organisation schema
 */
export const psoSchema = Joi.object({
  name: organisationNameSchema,
  parentId: Joi.string().required().messages({
    'any.required': AREA_VALIDATION_CODES.PARENT_ID_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.PARENT_ID_REQUIRED
  }),
  subType: Joi.string().required().messages({
    'any.required': AREA_VALIDATION_CODES.SUBTYPE_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.SUBTYPE_REQUIRED
  }),
  endDate: dateComponentSchema
})
  .options({ abortEarly: false })
  .label('PSO Area')

/**
 * RMA organisation schema
 */
export const rmaSchema = Joi.object({
  name: organisationNameSchema,
  identifier: organisationIdentifierSchema.required().messages({
    'any.required': AREA_VALIDATION_CODES.IDENTIFIER_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.IDENTIFIER_REQUIRED
  }),
  parentId: Joi.string().required().messages({
    'any.required': AREA_VALIDATION_CODES.PARENT_ID_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.PARENT_ID_REQUIRED
  }),
  subType: Joi.string().required().messages({
    'any.required': AREA_VALIDATION_CODES.SUBTYPE_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.SUBTYPE_REQUIRED
  }),
  endDate: dateComponentSchema
})
  .options({ abortEarly: false })
  .label('RMA')
