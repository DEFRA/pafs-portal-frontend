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

const MSG_ENTER_AREA = 'Enter an area'
const MSG_AREA_POSITIVE = 'Area must be a positive number'
const MSG_AREA_POSITIVE_2DP =
  'Area must be a positive number with up to 2 decimal places'
const MSG_AREA_PRECISION_2DP = 'Area must have up to 2 decimal places'

const MSG_VOLUME_POSITIVE_2DP =
  'Volume must be a positive number with up to 2 decimal places'
const MSG_VOLUME_PRECISION_2DP = 'Volume must have up to 2 decimal places'

const MSG_LENGTH_POSITIVE_2DP =
  'Length must be a positive number with up to 2 decimal places'
const MSG_LENGTH_PRECISION_2DP = 'Length must have up to 2 decimal places'

const MSG_WIDTH_POSITIVE_2DP =
  'Width must be a positive number with up to 2 decimal places'
const MSG_WIDTH_PRECISION_2DP = 'Width must have up to 2 decimal places'

const maxTwoDecimalPlaces = (value, helpers) => {
  if (value === null || value === '' || value === undefined) {
    return value
  }

  const scaled = value * 100
  const hasMaxTwoDecimals = Math.abs(scaled - Math.trunc(scaled)) < 1e-8

  return hasMaxTwoDecimals ? value : helpers.error('number.precision')
}

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
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_POSITIVE_2DP,
      'number.positive': MSG_AREA_POSITIVE_2DP,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': 'Enter the area in hectares'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .optional()
    .messages({
      'number.base': MSG_VOLUME_POSITIVE_2DP,
      'number.positive': MSG_VOLUME_POSITIVE_2DP,
      'number.precision': MSG_VOLUME_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Leaky Barriers Schema
 * Validates volume (m³), length (km), and width (m) for leaky barriers
 */
export const nfmLeakyBarriersSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .optional()
    .messages({
      'number.base': MSG_VOLUME_POSITIVE_2DP,
      'number.positive': MSG_VOLUME_POSITIVE_2DP,
      'number.precision': MSG_VOLUME_PRECISION_2DP
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_LENGTH_POSITIVE_2DP,
      'number.positive': MSG_LENGTH_POSITIVE_2DP,
      'number.precision': MSG_LENGTH_PRECISION_2DP,
      'any.required': 'Enter the length in kilometres'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_WIDTH_POSITIVE_2DP,
      'number.positive': MSG_WIDTH_POSITIVE_2DP,
      'number.precision': MSG_WIDTH_PRECISION_2DP,
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
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_ENTER_AREA,
      'number.positive': MSG_AREA_POSITIVE,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'Volume must be a number',
      'number.positive': 'Volume must be a positive number',
      'number.precision': MSG_VOLUME_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Woodland Schema
 * Validates area (hectares) for woodland creation
 */
export const nfmWoodlandSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_ENTER_AREA,
      'number.positive': MSG_AREA_POSITIVE,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA
    })
}).unknown(true)

/**
 * NFM Headwater Drainage Schema
 * Validates area (hectares) for headwater drainage management
 */
export const nfmHeadwaterDrainageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_POSITIVE_2DP,
      'number.positive': MSG_AREA_POSITIVE_2DP,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': 'Enter the area in hectares'
    })
}).unknown(true)

/**
 * NFM Runoff Management Schema
 * Validates area (hectares) and volume (m³) for runoff attenuation or management
 */
export const nfmRunoffManagementSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_ENTER_AREA,
      'number.positive': MSG_AREA_POSITIVE,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'Volume must be a number',
      'number.positive': 'Volume must be a positive number',
      'number.precision': MSG_VOLUME_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Saltmarsh Schema
 * Validates area (hectares) and length (km) for saltmarsh or mudflat management
 */
export const nfmSaltmarshSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_ENTER_AREA,
      'number.positive': MSG_AREA_POSITIVE,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'Length must be a number',
      'number.positive': 'Length must be a positive number',
      'number.precision': MSG_LENGTH_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Sand Dune Schema
 * Validates area (hectares) and length (km) for sand dune management
 */
export const nfmSandDuneSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_ENTER_AREA,
      'number.positive': MSG_AREA_POSITIVE,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'Length must be a number',
      'number.positive': 'Length must be a positive number',
      'number.precision': MSG_LENGTH_PRECISION_2DP
    })
}).unknown(true)
