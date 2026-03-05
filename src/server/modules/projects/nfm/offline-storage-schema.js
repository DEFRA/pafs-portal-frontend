import Joi from 'joi'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const areaSchema = Joi.number().positive().precision(2).messages({
  'number.base': 'Enter an area',
  'number.positive': 'Area must be a positive number',
  'any.required': 'Enter an area'
})

const volumeSchema = Joi.number()
  .positive()
  .precision(2)
  .allow(null, '')
  .messages({
    'number.base': 'Volume must be a number',
    'number.positive': 'Volume must be a positive number'
  })

export const nfmOfflineStorageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: areaSchema.required(),
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: volumeSchema,
  crumb: Joi.string().allow('').optional()
}).unknown(true)
