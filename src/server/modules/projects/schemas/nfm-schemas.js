/**
 * NFM (Natural Flood Management) Validation Schemas
 *
 * This file consolidates all NFM-related validation schemas.
 * Individual schema files in nfm/ folder are kept for backwards compatibility
 * but this file serves as the central export point.
 */

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

/**
 * NFM River Restoration Schema
 * Validates area (hectares) and volume (m³) for river/floodplain restoration
 */
export const nfmRiverRestorationSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: Joi.number()
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
  [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: Joi.number()
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

/**
 * NFM Leaky Barriers Schema
 * Validates volume (m³), length (km), and width (m) for leaky barriers
 */
export const nfmLeakyBarriersSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: Joi.number()
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
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: Joi.number()
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
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: Joi.number()
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

/**
 * NFM Offline Storage Schema
 * Validates area (hectares) and volume (m³) for offline flood storage
 */
export const nfmOfflineStorageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Enter an area',
      'number.positive': 'Area must be a positive number',
      'any.required': 'Enter an area'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: Joi.number()
    .positive()
    .precision(2)
    .allow(null, '')
    .messages({
      'number.base': 'Volume must be a number',
      'number.positive': 'Volume must be a positive number'
    })
}).unknown(true)

/**
 * NFM Woodland Schema
 * Validates area (hectares) for woodland creation
 */
export const nfmWoodlandSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.base': 'Enter an area',
      'number.positive': 'Area must be a positive number',
      'any.required': 'Enter an area'
    })
}).unknown(true)

/**
 * NFM Headwater Drainage Schema
 * Validates area (hectares) for headwater drainage management
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
