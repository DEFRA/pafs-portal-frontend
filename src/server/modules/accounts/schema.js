import Joi from 'joi'
import {
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  jobTitleSchema,
  organisationSchema,
  telephoneNumberSchema,
  responsibilitySchema,
  adminFlagSchema
} from '../../common/schemas/account.js'
import { VALIDATION_CODES } from '../../common/constants/validation.js'

/**
 * Area schema - for user area assignments
 */
const areaItemSchema = Joi.object({
  areaId: Joi.number()
    .integer()
    .positive()
    .required()
    .label('areaId')
    .messages({
      'number.base': VALIDATION_CODES.AREA_ID_INVALID,
      'number.positive': VALIDATION_CODES.AREA_ID_INVALID,
      'any.required': VALIDATION_CODES.AREA_ID_REQUIRED
    }),
  primary: Joi.boolean().default(false).label('primary').messages({
    'boolean.base': VALIDATION_CODES.PRIMARY_FLAG_INVALID
  })
})

/**
 * Details schema - for user details page validation
 * Validates basic user information without areas
 */
export const detailsSchema = Joi.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  email: emailSchema,
  admin: adminFlagSchema,
  isAdminContext: Joi.boolean().optional(),
  jobTitle: Joi.when('isAdminContext', {
    is: true,
    then: jobTitleSchema.optional(),
    otherwise: Joi.when('admin', {
      is: false,
      then: jobTitleSchema.required().disallow('', null).messages({
        'any.required': VALIDATION_CODES.JOB_TITLE_REQUIRED,
        'string.empty': VALIDATION_CODES.JOB_TITLE_REQUIRED,
        'any.invalid': VALIDATION_CODES.JOB_TITLE_REQUIRED
      }),
      otherwise: jobTitleSchema.optional()
    })
  }),
  organisation: Joi.when('isAdminContext', {
    is: true,
    then: organisationSchema.optional(),
    otherwise: Joi.when('admin', {
      is: false,
      then: organisationSchema.required().disallow('', null).messages({
        'any.required': VALIDATION_CODES.ORGANISATION_REQUIRED,
        'string.empty': VALIDATION_CODES.ORGANISATION_REQUIRED,
        'any.invalid': VALIDATION_CODES.ORGANISATION_REQUIRED
      }),
      otherwise: organisationSchema.optional()
    })
  }),
  telephoneNumber: Joi.when('isAdminContext', {
    is: true,
    then: telephoneNumberSchema.optional(),
    otherwise: Joi.when('admin', {
      is: false,
      then: telephoneNumberSchema.required().disallow('', null).messages({
        'any.required': VALIDATION_CODES.TELEPHONE_REQUIRED,
        'string.empty': VALIDATION_CODES.TELEPHONE_REQUIRED,
        'any.invalid': VALIDATION_CODES.TELEPHONE_REQUIRED
      }),
      otherwise: telephoneNumberSchema.optional()
    })
  }),
  responsibility: Joi.when('admin', {
    is: false,
    then: responsibilitySchema,
    otherwise: responsibilitySchema.optional()
  })
})
  .options({ abortEarly: false })
  .label('User Details')

/**
 * User schema - for final submission with areas
 * Extends details schema with area requirements
 */
export const userSchema = detailsSchema
  .keys({
    areas: Joi.when('admin', {
      is: false,
      then: Joi.array()
        .items(areaItemSchema)
        .min(1)
        .required()
        .label('areas')
        .messages({
          'any.required': VALIDATION_CODES.AREAS_REQUIRED,
          'array.min': VALIDATION_CODES.AREAS_REQUIRED
        }),
      otherwise: Joi.array().items(areaItemSchema).optional().label('areas')
    })
  })
  .label('User')

/**
 * Validate email schema
 * Used to check if an email is valid and available before account creation
 */
export const validateEmailSchema = Joi.object({
  email: emailSchema
})
  .options({ abortEarly: false })
  .label('ValidateEmail')

/**
 * Main area schema - for main area selection validation
 */
export const mainAreaSchema = Joi.object({
  mainArea: Joi.string().required().messages({
    'any.required': VALIDATION_CODES.MAIN_AREA_REQUIRED,
    'string.empty': VALIDATION_CODES.MAIN_AREA_REQUIRED
  })
})
  .options({ abortEarly: false })
  .label('MainArea')
