import Joi from 'joi'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Joi validation schema for NFM Headwater Drainage page
 * Validates the area field for headwater drainage management measures
 */
export const nfmHeadwaterDrainageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: Joi.number()
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
    })
}).unknown(true)
