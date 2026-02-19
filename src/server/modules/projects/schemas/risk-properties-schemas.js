import Joi from 'joi'
import {
  risksSchema,
  mainRiskSchema,
  noPropertiesAtRiskSchema,
  maintainingExistingAssetsSchema,
  reducingFloodRisk50PlusSchema,
  reducingFloodRiskLess50Schema,
  increasingFloodResilienceSchema,
  noPropertiesAtCoastalErosionRiskSchema,
  propertiesBenefitMaintainingAssetsCoastalSchema,
  propertiesBenefitInvestmentCoastalErosionSchema,
  percentProperties20PercentDeprivedSchema,
  percentProperties40PercentDeprivedSchema,
  currentFloodFluvialRiskSchema,
  currentFloodSurfaceWaterRiskSchema,
  currentCoastalErosionRiskSchema
} from '../../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Risk and properties validation schemas
 * Includes: risks, main risk, property flooding, coastal erosion, deprivation, current risks
 */

export const validateRisks = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.RISKS]: risksSchema
})
  .unknown(true)
  .options({ abortEarly: false })
  .label('Risks')

export const validateMainRisk = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.MAIN_RISK]: mainRiskSchema
})
  .unknown(true)
  .options({ abortEarly: false })
  .label('Main Risk')

export const validatePropertyAffectedFlooding = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]: noPropertiesAtRiskSchema,
  [PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]: Joi.when(
    Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK),
    {
      is: Joi.valid('true', true),
      then: Joi.any().optional().allow(''),
      otherwise: maintainingExistingAssetsSchema
    }
  ),
  [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS]: Joi.when(
    Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK),
    {
      is: Joi.valid('true', true),
      then: Joi.any().optional().allow(''),
      otherwise: reducingFloodRisk50PlusSchema
    }
  ),
  [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50]: Joi.when(
    Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK),
    {
      is: Joi.valid('true', true),
      then: Joi.any().optional().allow(''),
      otherwise: reducingFloodRiskLess50Schema
    }
  ),
  [PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE]: Joi.when(
    Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK),
    {
      is: Joi.valid('true', true),
      then: Joi.any().optional().allow(''),
      otherwise: increasingFloodResilienceSchema
    }
  )
})
  .options({ abortEarly: false })
  .label('Property Affected Flooding')

export const validatePropertyAffectedCoastalErosion = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]:
    noPropertiesAtCoastalErosionRiskSchema,
  [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]:
    Joi.when(
      Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK),
      {
        is: Joi.valid('true', true),
        then: Joi.any().optional().allow(''),
        otherwise: propertiesBenefitMaintainingAssetsCoastalSchema
      }
    ),
  [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION]:
    Joi.when(
      Joi.ref(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK),
      {
        is: Joi.valid('true', true),
        then: Joi.any().optional().allow(''),
        otherwise: propertiesBenefitInvestmentCoastalErosionSchema
      }
    )
})
  .options({ abortEarly: false })
  .label('Property Affected Coastal Erosion')

export const validateTwentyPercentDeprived = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED]:
    percentProperties20PercentDeprivedSchema
})
  .options({ abortEarly: false })
  .label('Twenty Percent Deprived')

export const validateFortyPercentDeprived = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED]:
    percentProperties40PercentDeprivedSchema
})
  .options({ abortEarly: false })
  .label('Forty Percent Deprived')

export const validateCurrentFloodFluvialRisk = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CURRENT_FLOOD_FLUVIAL_RISK]:
    currentFloodFluvialRiskSchema
})
  .options({ abortEarly: false })
  .label('Current Flood Risk')

export const validateCurrentFloodSurfaceWaterRisk = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CURRENT_FLOOD_SURFACE_WATER_RISK]:
    currentFloodSurfaceWaterRiskSchema
})
  .options({ abortEarly: false })
  .label('Current Flood Surface Water Risk')

export const validateCurrentCoastalErosionRisk = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CURRENT_COASTAL_EROSION_RISK]:
    currentCoastalErosionRiskSchema
})
  .options({ abortEarly: false })
  .label('Current Coastal Erosion Risk')
