import { PROJECT_STEPS } from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  validateRisks,
  validateMainRisk,
  validatePropertyAffectedFlooding,
  validatePropertyAffectedCoastalErosion,
  validateTwentyPercentDeprived,
  validateFortyPercentDeprived,
  validateCurrentFloodFluvialRisk,
  validateCurrentFloodSurfaceWaterRisk,
  validateCurrentCoastalErosionRisk
} from '../../schema.js'

/**
 * Configuration for risk and properties benefitting related steps
 */
export const RISK_AND_PROPERTIES_CONFIG = {
  [PROJECT_STEPS.RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateRisks,
    fieldType: 'checkbox'
  },
  [PROJECT_STEPS.MAIN_RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.main_risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.RISK,
      conditionalRedirect: false
    },
    schema: validateMainRisk,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING]: {
    localKeyPrefix: 'projects.risk_and_properties.property_affected_flooding',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
      conditionalRedirect: false
    },
    schema: validatePropertyAffectedFlooding,
    fieldType: 'table'
  },
  [PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION]: {
    localKeyPrefix:
      'projects.risk_and_properties.property_affected_coastal_erosion',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
      conditionalRedirect: false
    },
    schema: validatePropertyAffectedCoastalErosion,
    fieldType: 'table'
  },
  [PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED]: {
    localKeyPrefix: 'projects.risk_and_properties.twenty_percent_deprived',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
      conditionalRedirect: false
    },
    schema: validateTwentyPercentDeprived,
    fieldType: 'percentage'
  },
  [PROJECT_STEPS.FORTY_PERCENT_DEPRIVED]: {
    localKeyPrefix: 'projects.risk_and_properties.forty_percent_deprived',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
      conditionalRedirect: false
    },
    schema: validateFortyPercentDeprived,
    fieldType: 'percentage'
  },
  [PROJECT_STEPS.CURRENT_FLOOD_FLUVIAL_RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.current_flood_fluvial_risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
      conditionalRedirect: false
    },
    schema: validateCurrentFloodFluvialRisk,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK]: {
    localKeyPrefix:
      'projects.risk_and_properties.current_flood_surface_water_risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CURRENT_FLOOD_FLUVIAL_RISK,
      conditionalRedirect: false
    },
    schema: validateCurrentFloodSurfaceWaterRisk,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.CURRENT_COASTAL_EROSION_RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.current_coastal_erosion_risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
      conditionalRedirect: false
    },
    schema: validateCurrentCoastalErosionRisk,
    fieldType: 'radio'
  }
}
