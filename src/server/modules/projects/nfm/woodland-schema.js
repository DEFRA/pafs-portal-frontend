import Joi from 'joi'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const areaSchema = Joi.number().positive().precision(2).messages({
  'number.base': 'Enter an area',
  'number.positive': 'Area must be a positive number',
  'any.required': 'Enter an area'
})

export const nfmWoodlandSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: areaSchema.required(),
  crumb: Joi.string().allow('').optional()
}).unknown(true)
