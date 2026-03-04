import Joi from 'joi'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const {
  NFM_LEAKY_BARRIERS_VOLUME,
  NFM_LEAKY_BARRIERS_LENGTH,
  NFM_LEAKY_BARRIERS_WIDTH
} = PROJECT_PAYLOAD_FIELDS

export const nfmLeakyBarriersSchema = Joi.object({
  [NFM_LEAKY_BARRIERS_VOLUME]: Joi.number()
    .positive()
    .precision(2)
    .allow(null, '')
    .optional()
    .messages({
      'number.base':
        'Volume must be a positive number with up to 2 decimal places',
      'number.positive':
        'Volume must be a positive number with up to 2 decimal places',
      'number.precision': 'Volume must have up to 2 decimal places'
    }),
  [NFM_LEAKY_BARRIERS_LENGTH]: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base':
        'Length must be a positive number with up to 2 decimal places',
      'number.positive':
        'Length must be a positive number with up to 2 decimal places',
      'number.precision': 'Length must have up to 2 decimal places',
      'any.required': 'Enter the length in kilometres'
    }),
  [NFM_LEAKY_BARRIERS_WIDTH]: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base':
        'Width must be a positive number with up to 2 decimal places',
      'number.positive':
        'Width must be a positive number with up to 2 decimal places',
      'number.precision': 'Width must have up to 2 decimal places',
      'any.required': 'Enter the typical width in metres'
    })
}).unknown(true)
