import Joi from 'joi'
import { SIZE, VALIDATION_PATTERNS } from '../constants/common.js'
import { VALIDATION_CODES } from '../constants/validation.js'

/**
 * Email schema - validates email format, max length, trims and lowercases
 * Local part (before @) is limited to 64 characters per RFC 5321
 * Total email length limited to 254 characters
 */
export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(SIZE.LENGTH_254)
  .custom((value, helpers) => {
    const localPart = value.split('@')[0]
    if (localPart && localPart.length > 64) {
      return helpers.error('string.emailLocalTooLong')
    }
    return value
  })
  .label('email')
  .trim()
  .lowercase()
  .required()
  .messages({
    'string.empty': VALIDATION_CODES.EMAIL_REQUIRED,
    'any.required': VALIDATION_CODES.EMAIL_REQUIRED,
    'string.email': VALIDATION_CODES.EMAIL_INVALID_FORMAT,
    'string.max': VALIDATION_CODES.EMAIL_TOO_LONG,
    'string.emailLocalTooLong': VALIDATION_CODES.EMAIL_LOCAL_TOO_LONG
  })

/**
 * Basic password schema - only checks presence
 */
export const passwordSchema = Joi.string()
  .required()
  .label('password')
  .messages({
    'string.empty': VALIDATION_CODES.PASSWORD_REQUIRED,
    'any.required': VALIDATION_CODES.PASSWORD_REQUIRED
  })

/**
 * Strong password schema - enforces strength requirements
 */
export const passwordStrengthSchema = Joi.string()
  .min(SIZE.LENGTH_8)
  .max(SIZE.LENGTH_128)
  .pattern(/[A-Z]/, 'UPPERCASE')
  .pattern(/[a-z]/, 'LOWERCASE')
  .pattern(/\d/, 'NUMBER')
  .pattern(/[!@#$%^&*()_.+\-=[\]]/, 'SPECIAL')
  .required()
  .label('password')
  .messages({
    'string.empty': VALIDATION_CODES.PASSWORD_REQUIRED,
    'any.required': VALIDATION_CODES.PASSWORD_REQUIRED,
    'string.min': VALIDATION_CODES.PASSWORD_MIN_LENGTH,
    'string.max': VALIDATION_CODES.PASSWORD_MAX_LENGTH,
    'string.pattern.name': 'PASSWORD_STRENGTH_{#name}'
  })
  .options({ abortEarly: true })

/**
 * Confirm password schema - must match password field
 */
export const confirmPasswordSchema = Joi.string()
  .valid(Joi.ref('password'))
  .required()
  .label('confirmPassword')
  .messages({
    'string.empty': VALIDATION_CODES.PASSWORD_REQUIRED,
    'any.required': VALIDATION_CODES.PASSWORD_REQUIRED,
    'any.only': VALIDATION_CODES.PASSWORD_MISMATCH
  })

/**
 * Token schema - validates token format
 */
export const tokenSchema = Joi.string()
  .trim()
  .label('token')
  .required()
  .messages({
    'string.empty': VALIDATION_CODES.TOKEN_REQUIRED,
    'any.required': VALIDATION_CODES.TOKEN_REQUIRED
  })

/**
 * First name schema - allows letters, spaces, hyphens, apostrophes
 */
export const firstNameSchema = Joi.string()
  .max(SIZE.LENGTH_255)
  .trim()
  .pattern(VALIDATION_PATTERNS.NAME)
  .required()
  .label('firstName')
  .messages({
    'string.empty': VALIDATION_CODES.FIRST_NAME_REQUIRED,
    'any.required': VALIDATION_CODES.FIRST_NAME_REQUIRED,
    'string.max': VALIDATION_CODES.FIRST_NAME_TOO_LONG,
    'string.pattern.base': VALIDATION_CODES.FIRST_NAME_INVALID_FORMAT
  })

/**
 * Last name schema - allows letters, spaces, hyphens, apostrophes
 */
export const lastNameSchema = Joi.string()
  .max(SIZE.LENGTH_255)
  .trim()
  .pattern(VALIDATION_PATTERNS.NAME)
  .required()
  .label('lastName')
  .messages({
    'string.empty': VALIDATION_CODES.LAST_NAME_REQUIRED,
    'any.required': VALIDATION_CODES.LAST_NAME_REQUIRED,
    'string.max': VALIDATION_CODES.LAST_NAME_TOO_LONG,
    'string.pattern.base': VALIDATION_CODES.LAST_NAME_INVALID_FORMAT
  })

/**
 * Job title schema - allows letters, digits, spaces, common punctuation
 */
export const jobTitleSchema = Joi.string()
  .max(SIZE.LENGTH_255)
  .trim()
  .pattern(VALIDATION_PATTERNS.TEXT_WITH_COMMON_SYMBOLS)
  .allow(null, '')
  .label('jobTitle')
  .messages({
    'string.max': VALIDATION_CODES.JOB_TITLE_TOO_LONG,
    'string.pattern.base': VALIDATION_CODES.JOB_TITLE_INVALID_FORMAT
  })

/**
 * Organisation schema - allows letters, digits, spaces, common punctuation
 */
export const organisationSchema = Joi.string()
  .max(SIZE.LENGTH_255)
  .trim()
  .pattern(VALIDATION_PATTERNS.TEXT_WITH_COMMON_SYMBOLS)
  .allow('')
  .label('organisation')
  .messages({
    'string.max': VALIDATION_CODES.ORGANISATION_TOO_LONG,
    'string.pattern.base': VALIDATION_CODES.ORGANISATION_INVALID_FORMAT
  })

/**
 * Telephone number schema
 */
export const telephoneNumberSchema = Joi.string()
  .max(SIZE.LENGTH_255)
  .trim()
  .pattern(VALIDATION_PATTERNS.TELEPHONE)
  .allow(null, '')
  .label('telephoneNumber')
  .messages({
    'string.pattern.base': VALIDATION_CODES.TELEPHONE_INVALID_FORMAT,
    'string.max': VALIDATION_CODES.TELEPHONE_TOO_LONG
  })

/**
 * Responsibility schema
 */
export const responsibilitySchema = Joi.string()
  .valid('EA', 'RMA', 'PSO')
  .required()
  .label('responsibility')
  .messages({
    'any.required': VALIDATION_CODES.RESPONSIBILITY_REQUIRED,
    'any.only': VALIDATION_CODES.RESPONSIBILITY_INVALID
  })

/**
 * Admin flag schema
 */
export const adminFlagSchema = Joi.boolean()
  .default(false)
  .label('admin')
  .required()
  .messages({
    'boolean.base': VALIDATION_CODES.ADMIN_FLAG_INVALID,
    'any.required': VALIDATION_CODES.ADMIN_FLAG_REQUIRED
  })

/**
 * User ID schema
 */
export const userIdSchema = Joi.number()
  .integer()
  .positive()
  .label('userId')
  .messages({
    'number.base': VALIDATION_CODES.USER_ID_INVALID,
    'number.positive': VALIDATION_CODES.USER_ID_INVALID
  })
