import Joi from 'joi'
import { SIZE, VALIDATION_CODES } from '../constants/validation.js'

/**
 * Email schema - validates email format, max length, trims and lowercases
 */
export const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(SIZE.LENGTH_254)
  .label('email')
  .trim()
  .lowercase()
  .required()
  .messages({
    'string.empty': VALIDATION_CODES.EMAIL_REQUIRED,
    'any.required': VALIDATION_CODES.EMAIL_REQUIRED,
    'string.email': VALIDATION_CODES.EMAIL_INVALID_FORMAT,
    'string.max': VALIDATION_CODES.EMAIL_TOO_LONG
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
