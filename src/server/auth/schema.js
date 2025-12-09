import Joi from 'joi'
import {
  confirmPasswordSchema,
  emailSchema,
  passwordSchema,
  passwordStrengthSchema,
  tokenSchema
} from '../common/schemas/account.js'
import { TOKEN_TYPES } from '../common/constants/validation.js'

export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema
})

export const forgotPasswordSchema = Joi.object({
  email: emailSchema
})

export const passwordFormSchema = Joi.object({
  token: tokenSchema,
  newPassword: passwordStrengthSchema.label('newPassword'),
  confirmPassword: confirmPasswordSchema.valid(Joi.ref('newPassword'))
})

export const validateTokenSchema = Joi.object({
  token: tokenSchema,
  type: Joi.string()
    .valid(TOKEN_TYPES.RESET, TOKEN_TYPES.INVITATION)
    .required()
    .messages({
      'string.empty': 'VALIDATION_TOKEN_TYPE_REQUIRED',
      'any.required': 'VALIDATION_TOKEN_TYPE_REQUIRED',
      'any.only': 'VALIDATION_TOKEN_TYPE_INVALID'
    })
})
