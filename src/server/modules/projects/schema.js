import Joi from 'joi'
import {
  projectAreaIdSchema,
  projectFinancialEndYearSchema,
  projectFinancialStartYearSchema,
  projectInterventionTypeSchema,
  projectMainInterventionTypeSchema,
  projectNameSchema,
  projectTypeSchema,
  startOutlineBusinessCaseMonthSchema,
  startOutlineBusinessCaseYearSchema,
  completeOutlineBusinessCaseMonthSchema,
  completeOutlineBusinessCaseYearSchema,
  awardContractMonthSchema,
  awardContractYearSchema,
  startConstructionMonthSchema,
  startConstructionYearSchema,
  readyForServiceMonthSchema,
  readyForServiceYearSchema,
  couldStartEarlySchema,
  earliestWithGiaMonthSchema,
  earliestWithGiaYearSchema
} from '../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../common/constants/projects.js'

/**
 * Validate project name schema
 */
export const validateProjectName = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NAME]: projectNameSchema
})
  .options({ abortEarly: false })
  .label('Project Name')

/**
 * Validate area ID schema
 */
export const validateAreaId = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.AREA_ID]: projectAreaIdSchema
})
  .options({ abortEarly: false })
  .label('Area ID')

export const validateProjectType = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema
})
  .options({ abortEarly: false })
  .label('Project Type')

export const validateProjectInterventionTypes = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
  [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
    projectInterventionTypeSchema
})
  .options({ abortEarly: false })
  .label('Project Intervention Types')

export const validateMainInterventionType = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
  [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
    projectInterventionTypeSchema,
  [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
    projectMainInterventionTypeSchema
})
  .options({ abortEarly: false })
  .label('Main Intervention Type')

export const validateFinancialStartYear = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
    projectFinancialStartYearSchema,
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: projectFinancialEndYearSchema
    .optional()
    .allow(null, '')
})
  .unknown(true)
  .options({ abortEarly: false })
  .label('Financial Start Year')

export const validateFinancialEndYear = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
    projectFinancialStartYearSchema,
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: projectFinancialEndYearSchema
})
  .options({ abortEarly: false })
  .label('Financial End Year')

/**
 * Validate important dates schemas
 */
export const validateStartOutlineBusinessCase = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
    startOutlineBusinessCaseMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
    startOutlineBusinessCaseYearSchema
})
  .options({ abortEarly: false })
  .label('Start Outline Business Case')

export const validateCompleteOutlineBusinessCase = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
    completeOutlineBusinessCaseMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
    completeOutlineBusinessCaseYearSchema
})
  .options({ abortEarly: false })
  .label('Complete Outline Business Case')

export const validateAwardMainContract = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: awardContractMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: awardContractYearSchema
})
  .options({ abortEarly: false })
  .label('Award Main Contract')

export const validateStartWork = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]:
    startConstructionMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: startConstructionYearSchema
})
  .options({ abortEarly: false })
  .label('Start Work')

export const validateStartBenefits = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: readyForServiceMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: readyForServiceYearSchema
})
  .options({ abortEarly: false })
  .label('Start Benefits')

export const validateCouldStartEarlier = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema
})
  .options({ abortEarly: false })
  .label('Could Start Earlier')

export const validateEarliestStartDate = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: Joi.any(),
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: earliestWithGiaMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: earliestWithGiaYearSchema
})
  .options({ abortEarly: false })
  .label('Earliest Start Date')
