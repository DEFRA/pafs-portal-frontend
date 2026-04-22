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
// Note: PROJECT_VALIDATION_MESSAGES is still used for NFM radio/checkbox schemas (selected_measures, landowner_consent, experience, project_readiness)

const maxTwoDecimalPlaces = (value, helpers) => {
  // Use helpers.original (raw string before Joi coercion) to validate format accurately.
  // String(value) would reflect the JS float which loses precision for large numbers.
  const rawStr = String(helpers.original ?? value)

  if (!/^\d+(\.\d+)?$/.test(rawStr)) {
    return helpers.error('number.precision')
  }

  const [integerPart, decimalPart] = rawStr.split('.')

  if (decimalPart === undefined) {
    // Whole number: max 18 digits
    if (integerPart.length > 18) {
      return helpers.error('number.integer.max')
    }
  } else {
    // Decimal number: max 16 digits before decimal, max 2 after
    if (integerPart.length > 16 || decimalPart.length > 2) {
      return helpers.error('number.precision')
    }
  }

  // Return the raw string (not the coerced float) to preserve precision.
  // Callers must NOT call parseFloat on this value before sending to the backend.
  return rawStr
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
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .optional()
    .messages({
      'number.base': 'volume_invalid',
      'number.positive': 'volume_invalid',
      'number.precision': 'volume_precision',
      'number.integer.max': 'volume_whole_number_precision'
    })
}).unknown(true)

/**
 * NFM Leaky Barriers Schema
 * Validates volume (m³), length (km), and width (m) for leaky barriers
 */
export const nfmLeakyBarriersSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .optional()
    .messages({
      'number.base': 'volume_invalid',
      'number.positive': 'volume_invalid',
      'number.precision': 'volume_precision',
      'number.integer.max': 'volume_whole_number_precision'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'length_invalid',
      'number.positive': 'length_invalid',
      'number.precision': 'length_precision',
      'number.integer.max': 'length_whole_number_precision',
      'any.required': 'length_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'width_invalid',
      'number.positive': 'width_invalid',
      'number.precision': 'width_precision',
      'number.integer.max': 'width_whole_number_precision',
      'any.required': 'width_required'
    })
}).unknown(true)

/**
 * NFM Offline Storage Schema
 * Validates area (hectares) and volume (m³) for offline flood storage
 */
export const nfmOfflineStorageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'volume_invalid',
      'number.positive': 'volume_invalid',
      'number.precision': 'volume_precision',
      'number.integer.max': 'volume_whole_number_precision'
    })
}).unknown(true)

/**
 * NFM Woodland Schema
 * Validates area (hectares) for woodland creation
 */
export const nfmWoodlandSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    })
}).unknown(true)

/**
 * NFM Headwater Drainage Schema
 * Validates area (hectares) for headwater drainage management
 */
export const nfmHeadwaterDrainageSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    })
}).unknown(true)

/**
 * NFM Runoff Management Schema
 * Validates area (hectares) and volume (m³) for runoff attenuation or management
 */
export const nfmRunoffManagementSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .allow(null, '')
    .messages({
      'number.base': 'volume_invalid',
      'number.positive': 'volume_invalid',
      'number.precision': 'volume_precision',
      'number.integer.max': 'volume_whole_number_precision'
    })
}).unknown(true)

/**
 * NFM Saltmarsh Schema
 * Validates area (hectares) and length (km) for saltmarsh or mudflat management
 */
export const nfmSaltmarshSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'length_invalid',
      'number.positive': 'length_invalid',
      'number.precision': 'length_precision',
      'number.integer.max': 'length_whole_number_precision',
      'any.required': 'length_required'
    })
}).unknown(true)

/**
 * NFM Sand Dune Schema
 * Validates area (hectares) and length (km) for sand dune management
 */
export const nfmSandDuneSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: Joi.number()
    .unsafe()
    .empty('')
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'area_invalid',
      'number.positive': 'area_invalid',
      'number.precision': 'area_precision',
      'number.integer.max': 'area_whole_number_precision',
      'any.required': 'area_required'
    }),
  [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: Joi.number()
    .unsafe()
    .positive()
    .custom(maxTwoDecimalPlaces)
    .required()
    .messages({
      'number.base': 'length_invalid',
      'number.positive': 'length_invalid',
      'number.precision': 'length_precision',
      'number.integer.max': 'length_whole_number_precision',
      'any.required': 'length_required'
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
      'array.min': 'required',
      'any.required': 'required',
      'array.includesRequiredUnknowns': 'required'
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
      .unsafe()
      .empty('')
      .min(0)
      .custom(maxTwoDecimalPlaces)
      .required()
      .messages({
        'number.base': 'invalid',
        'number.min': 'invalid',
        'number.precision': 'precision',
        'number.integer.max': 'whole_number_precision',
        'any.required': 'required_before'
      }),
    [afterField]: Joi.number()
      .unsafe()
      .empty('')
      .min(0)
      .custom(maxTwoDecimalPlaces)
      .required()
      .messages({
        'number.base': 'invalid',
        'number.min': 'invalid',
        'number.precision': 'precision',
        'number.integer.max': 'whole_number_precision',
        'any.required': 'required_after'
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
