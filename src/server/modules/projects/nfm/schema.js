import Joi from 'joi'
import {
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES
} from '../../../common/constants/projects.js'

/**
 * NFM Selected Measures Schema
 * Validates natural flood management measures selection
 * At least one measure must be selected
 */
export const nfmSelectedMeasuresSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: Joi.array()
    .items(Joi.string().valid(...Object.values(NFM_MEASURES)))
    .min(1)
    .required()
    .messages({
      'array.min': PROJECT_VALIDATION_MESSAGES.NFM_SELECTED_MEASURES_REQUIRED,
      'any.required':
        PROJECT_VALIDATION_MESSAGES.NFM_SELECTED_MEASURES_REQUIRED,
      'array.includesRequiredUnknowns':
        PROJECT_VALIDATION_MESSAGES.NFM_SELECTED_MEASURES_REQUIRED,
      'any.only': PROJECT_VALIDATION_MESSAGES.NFM_SELECTED_MEASURES_INVALID
    })
    .label(PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES)
}).unknown(true)
