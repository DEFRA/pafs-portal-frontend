import Joi from 'joi'
import {
  projectAreaIdSchema,
  projectFinancialEndYearSchema,
  projectFinancialStartYearSchema,
  projectInterventionTypeSchema,
  projectMainInterventionTypeSchema,
  projectNameSchema,
  projectTypeSchema
} from '../../../common/schemas/projects.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

/**
 * Core project validation schemas
 * Includes: name, area, type, intervention types, financial years
 */

export const validateProjectName = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.NAME]: projectNameSchema
})
  .options({ abortEarly: false })
  .label('Project Name')

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
