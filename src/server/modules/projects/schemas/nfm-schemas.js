/**
 * NFM (Natural Flood Management) Validation Schemas
 *
 * This file consolidates all NFM-related validation schemas.
 * Individual schema files in nfm/ folder are kept for backwards compatibility
 * but this file serves as the central export point.
 */

import Joi from 'joi'
import {
  NFM_EXPERIENCE_LEVEL_OPTIONS,
  NFM_LAND_TYPES,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES,
  NFM_PROJECT_READINESS_OPTIONS
} from '../../../common/constants/projects.js'

const MSG_ENTER_AREA_IN_HECTARES = 'Enter the area in hectares'
const MSG_AREA_GREATER_THAN_ZERO = 'Area must be a number greater than 0'
const MSG_AREA_PRECISION_2DP = 'Area must have up to 2 decimal places'
const MSG_AREA_NON_NEGATIVE = 'Area must be a number greater than or equal to 0'
const MSG_LAND_USE_AREA_BEFORE = 'Enter the area before natural flood measures'
const MSG_LAND_USE_AREA_AFTER = 'Enter the area after natural flood measures'

const MSG_VOLUME_GREATER_THAN_ZERO = 'Volume must be a number greater than 0'
const MSG_VOLUME_PRECISION_2DP = 'Volume must have up to 2 decimal places'

const MSG_LENGTH_GREATER_THAN_ZERO = 'Length must be a number greater than 0'
const MSG_LENGTH_PRECISION_2DP = 'Length must have up to 2 decimal places'

const MSG_WIDTH_GREATER_THAN_ZERO = 'Width must be a number greater than 0'
const MSG_WIDTH_PRECISION_2DP = 'Width must have up to 2 decimal places'
const MSG_SELECT_AT_LEAST_ONE_LAND_TYPE = 'Select at least one land type'

const maxTwoDecimalPlaces = (value, helpers) => {
  if (value === null || value === '' || value === undefined) {
    return value
  }

  // Convert to string to check decimal places accurately
  const valueStr = String(value)
  const decimalIndex = valueStr.indexOf('.')

  // If no decimal point, it's valid (whole number)
  if (decimalIndex === -1) {
    return value
  }

  // Count decimal places
  const decimalPlaces = valueStr.length - decimalIndex - 1

  // Allow up to 2 decimal places
  return decimalPlaces <= 2 ? value : helpers.error('number.precision')
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
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .optional()
    .messages({
      'number.base': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.positive': MSG_VOLUME_GREATER_THAN_ZERO,
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
      'number.base': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.positive': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.precision': MSG_VOLUME_PRECISION_2DP
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.positive': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.precision': MSG_LENGTH_PRECISION_2DP,
      'any.required': 'Enter the length in km'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_WIDTH_GREATER_THAN_ZERO,
      'number.positive': MSG_WIDTH_GREATER_THAN_ZERO,
      'number.precision': MSG_WIDTH_PRECISION_2DP,
      'any.required': 'Enter the breadth in m'
    })
}).unknown(true)

/**
 * NFM Offline Storage Schema
 * Validates area (hectares) and volume (m³) for offline flood storage
 */
export const nfmOfflineStorageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.positive': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.precision': MSG_VOLUME_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Woodland Schema
 * Validates area (hectares) for woodland creation
 */
export const nfmWoodlandSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    })
}).unknown(true)

/**
 * NFM Headwater Drainage Schema
 * Validates area (hectares) for headwater drainage management
 */
export const nfmHeadwaterDrainageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    })
}).unknown(true)

/**
 * NFM Runoff Management Schema
 * Validates area (hectares) and volume (m³) for runoff attenuation or management
 */
export const nfmRunoffManagementSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: Joi.number()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.positive': MSG_VOLUME_GREATER_THAN_ZERO,
      'number.precision': MSG_VOLUME_PRECISION_2DP
    })
}).unknown(true)

/**
 * NFM Saltmarsh Schema
 * Validates area (hectares) and length (km) for saltmarsh or mudflat management
 */
export const nfmSaltmarshSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.positive': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.precision': MSG_LENGTH_PRECISION_2DP,
      'any.required': 'Enter the length in km'
    })
}).unknown(true)

/**
 * NFM Sand Dune Schema
 * Validates area (hectares) and length (km) for sand dune management
 */
export const nfmSandDuneSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_AREA_GREATER_THAN_ZERO,
      'number.positive': MSG_AREA_GREATER_THAN_ZERO,
      'number.precision': MSG_AREA_PRECISION_2DP,
      'any.required': MSG_ENTER_AREA_IN_HECTARES
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: Joi.number()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.positive': MSG_LENGTH_GREATER_THAN_ZERO,
      'number.precision': MSG_LENGTH_PRECISION_2DP,
      'any.required': 'Enter the length in km'
    })
}).unknown(true)

/**
 * NFM Land Use Change Schema
 * Validates land use types selection after NFM measures
 */
export const nfmLandUseChangeSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: Joi.array()
    .items(Joi.string().valid(...Object.values(NFM_LAND_TYPES)))
    .min(1)
    .required()
    .messages({
      'array.min': MSG_SELECT_AT_LEAST_ONE_LAND_TYPE,
      'any.required': MSG_SELECT_AT_LEAST_ONE_LAND_TYPE,
      'array.includesRequiredUnknowns': MSG_SELECT_AT_LEAST_ONE_LAND_TYPE
    })
}).unknown(true)

/**
 * NFM Land Use Enclosed Arable Farmland Schema
 * Validates before/after area values
 */
/**
 * Helper: creates a land-use detail Joi schema for a given before/after field pair
 */
const createLandUseDetailSchema = (beforeField, afterField) =>
  Joi.object({
    [beforeField]: Joi.number()
      .empty('')
      .min(0)
      .custom(maxTwoDecimalPlaces)
      .required()
      .messages({
        'number.base': MSG_AREA_NON_NEGATIVE,
        'number.min': MSG_AREA_NON_NEGATIVE,
        'number.precision': MSG_AREA_PRECISION_2DP,
        'any.required': MSG_LAND_USE_AREA_BEFORE
      }),
    [afterField]: Joi.number()
      .empty('')
      .min(0)
      .custom(maxTwoDecimalPlaces)
      .required()
      .messages({
        'number.base': MSG_AREA_NON_NEGATIVE,
        'number.min': MSG_AREA_NON_NEGATIVE,
        'number.precision': MSG_AREA_PRECISION_2DP,
        'any.required': MSG_LAND_USE_AREA_AFTER
      })
  }).unknown(true)

export const nfmLandUseEnclosedArableFarmlandSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER
)

export const nfmLandUseEnclosedLivestockFarmlandSchema =
  createLandUseDetailSchema(
    PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_BEFORE,
    PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_AFTER
  )

export const nfmLandUseEnclosedDairyingFarmlandSchema =
  createLandUseDetailSchema(
    PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_BEFORE,
    PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_AFTER
  )

export const nfmLandUseSemiNaturalGrasslandSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_AFTER
)

export const nfmLandUseWoodlandSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_AFTER
)

export const nfmLandUseMountainMoorsAndHeathSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_AFTER
)

export const nfmLandUsePeatlandRestorationSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_AFTER
)

export const nfmLandUseRiversWetlandsFreshwaterSchema =
  createLandUseDetailSchema(
    PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_BEFORE,
    PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_AFTER
  )

export const nfmLandUseCoastalMarginsSchema = createLandUseDetailSchema(
  PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_BEFORE,
  PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_AFTER
)

export const nfmLandownerConsentSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT]: Joi.string()
    .valid(...Object.values(NFM_LANDOWNER_CONSENT_OPTIONS))
    .required()
    .messages({
      'any.required':
        PROJECT_VALIDATION_MESSAGES.NFM_LANDOWNER_CONSENT_REQUIRED,
      'string.empty':
        PROJECT_VALIDATION_MESSAGES.NFM_LANDOWNER_CONSENT_REQUIRED,
      'any.only': PROJECT_VALIDATION_MESSAGES.NFM_LANDOWNER_CONSENT_INVALID
    })
}).unknown(true)

export const nfmExperienceLevelSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL]: Joi.string()
    .valid(...Object.values(NFM_EXPERIENCE_LEVEL_OPTIONS))
    .required()
    .messages({
      'any.required': PROJECT_VALIDATION_MESSAGES.NFM_EXPERIENCE_LEVEL_REQUIRED,
      'string.empty': PROJECT_VALIDATION_MESSAGES.NFM_EXPERIENCE_LEVEL_REQUIRED,
      'any.only': PROJECT_VALIDATION_MESSAGES.NFM_EXPERIENCE_LEVEL_INVALID
    })
}).unknown(true)

export const nfmProjectReadinessSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_PROJECT_READINESS]: Joi.string()
    .valid(...Object.values(NFM_PROJECT_READINESS_OPTIONS))
    .required()
    .messages({
      'any.required':
        PROJECT_VALIDATION_MESSAGES.NFM_PROJECT_READINESS_REQUIRED,
      'string.empty':
        PROJECT_VALIDATION_MESSAGES.NFM_PROJECT_READINESS_REQUIRED,
      'any.only': PROJECT_VALIDATION_MESSAGES.NFM_PROJECT_READINESS_INVALID
    })
}).unknown(true)
