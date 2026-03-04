import Joi from 'joi'
import {
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
} from '../../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Important dates validation schemas
 * Includes: business case dates, contract dates, construction dates, early start
 */

export const validateStartOutlineBusinessCase = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
    startOutlineBusinessCaseMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
    startOutlineBusinessCaseYearSchema
})
  .options({ abortEarly: false })
  .label('Start Outline Business Case')

export const validateCompleteOutlineBusinessCase = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
    completeOutlineBusinessCaseMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
    completeOutlineBusinessCaseYearSchema
})
  .options({ abortEarly: false })
  .label('Complete Outline Business Case')

export const validateAwardMainContract = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: awardContractMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: awardContractYearSchema
})
  .options({ abortEarly: false })
  .label('Award Main Contract')

export const validateStartWork = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]:
    startConstructionMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: startConstructionYearSchema
})
  .options({ abortEarly: false })
  .label('Start Work')

export const validateStartBenefits = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: Joi.number().optional(),
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
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
    Joi.number().optional(),
  [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: Joi.any(),
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: earliestWithGiaMonthSchema,
  [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: earliestWithGiaYearSchema
})
  .options({ abortEarly: false })
  .label('Earliest Start Date')
