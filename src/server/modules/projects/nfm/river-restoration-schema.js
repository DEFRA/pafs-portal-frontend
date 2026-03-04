import Joi from 'joi'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const { NFM_RIVER_RESTORATION_AREA, NFM_RIVER_RESTORATION_VOLUME } =
  PROJECT_PAYLOAD_FIELDS

export const nfmRiverRestorationSchema = Joi.object({
  [NFM_RIVER_RESTORATION_AREA]: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base':
        'Area must be a positive number with up to 2 decimal places',
      'number.positive':
        'Area must be a positive number with up to 2 decimal places',
      'number.precision': 'Area must have up to 2 decimal places',
      'any.required': 'Enter the area in hectares'
    }),
  [NFM_RIVER_RESTORATION_VOLUME]: Joi.number()
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
    })
}).unknown(true)
