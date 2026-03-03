import { describe, test, expect } from 'vitest'
import {
  PROJECT_TYPES_CONFIG,
  FINANCIAL_YEAR_CONFIG,
  IMPORTANT_DATES_CONFIG,
  GOALS_URGENCY_CONFIDENCE_CONFIG,
  PROJECT_PAYLOAD_LEVEL_FIELDS,
  interventionTypesLocalKeyPrefix,
  projectTypesLocalKeyPrefix,
  financialYearStartLocalKeyPrefix,
  financialYearStartManualLocalKeyPrefix,
  financialYearEndLocalKeyPrefix,
  financialYearEndManualLocalKeyPrefix
} from './project-config.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'

describe('project-config', () => {
  describe('Local key prefix exports', () => {
    test('should export correct intervention types prefix', () => {
      expect(interventionTypesLocalKeyPrefix).toBe('projects.intervention_type')
    })

    test('should export correct project types prefix', () => {
      expect(projectTypesLocalKeyPrefix).toBe('projects.project_type')
    })

    test('should export correct financial year start prefix', () => {
      expect(financialYearStartLocalKeyPrefix).toBe(
        'projects.financial_year_start'
      )
    })

    test('should export correct financial year start manual prefix', () => {
      expect(financialYearStartManualLocalKeyPrefix).toBe(
        'projects.financial_year_start_manual'
      )
    })

    test('should export correct financial year end prefix', () => {
      expect(financialYearEndLocalKeyPrefix).toBe('projects.financial_year_end')
    })

    test('should export correct financial year end manual prefix', () => {
      expect(financialYearEndManualLocalKeyPrefix).toBe(
        'projects.financial_year_end_manual'
      )
    })
  })

  describe('PROJECT_TYPES_CONFIG', () => {
    test('should have configuration for TYPE step', () => {
      const config = PROJECT_TYPES_CONFIG[PROJECT_STEPS.TYPE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.project_type')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.AREA,
        conditionalRedirect: true
      })
      expect(config.schema).toBeDefined()
    })

    test('should have configuration for INTERVENTION_TYPE step', () => {
      const config = PROJECT_TYPES_CONFIG[PROJECT_STEPS.INTERVENTION_TYPE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.intervention_type')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.TYPE,
        targetEditURL: ROUTES.PROJECT.EDIT.TYPE,
        conditionalRedirect: false
      })
      expect(config.schema).toBeDefined()
    })

    test('should have configuration for PRIMARY_INTERVENTION_TYPE step', () => {
      const config =
        PROJECT_TYPES_CONFIG[PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.primary_intervention_type')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.INTERVENTION_TYPE,
        targetEditURL: ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
        conditionalRedirect: false
      })
      expect(config.schema).toBeDefined()
    })

    test('should have all required fields in each config', () => {
      Object.values(PROJECT_TYPES_CONFIG).forEach((config) => {
        expect(config.localKeyPrefix).toBeDefined()
        expect(config.backLinkOptions).toBeDefined()
        expect(config.schema).toBeDefined()
      })
    })
  })

  describe('FINANCIAL_YEAR_CONFIG', () => {
    test('should have configuration for FINANCIAL_START_YEAR step', () => {
      const config = FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_START_YEAR]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.financial_year_start')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.TYPE,
        conditionalRedirect: true
      })
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR)
    })

    test('should have configuration for FINANCIAL_START_YEAR_MANUAL step', () => {
      const config =
        FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.financial_year_start_manual')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.TYPE,
        conditionalRedirect: true
      })
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR)
    })

    test('should have configuration for FINANCIAL_END_YEAR step', () => {
      const config = FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_END_YEAR]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.financial_year_end')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.FINANCIAL_START_YEAR,
        conditionalRedirect: true
      })
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR)
    })

    test('should have configuration for FINANCIAL_END_YEAR_MANUAL step', () => {
      const config =
        FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.financial_year_end_manual')
      expect(config.backLinkOptions).toEqual({
        targetURL: ROUTES.PROJECT.FINANCIAL_START_YEAR,
        conditionalRedirect: true
      })
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR)
    })

    test('should have all required fields in each config', () => {
      Object.values(FINANCIAL_YEAR_CONFIG).forEach((config) => {
        expect(config.localKeyPrefix).toBeDefined()
        expect(config.backLinkOptions).toBeDefined()
        expect(config.schema).toBeDefined()
        expect(config.fieldName).toBeDefined()
      })
    })
  })

  describe('IMPORTANT_DATES_CONFIG', () => {
    test('should have configuration for START_OUTLINE_BUSINESS_CASE', () => {
      const config =
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.start_outline_business_case'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(true)
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH
      )
      expect(config.yearField).toBe(
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
      )
      expect(config.fieldType).toBe('date')
    })

    test('should have configuration for COMPLETE_OUTLINE_BUSINESS_CASE', () => {
      const config =
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.complete_outline_business_case'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(false)
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH
      )
      expect(config.yearField).toBe(
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
      )
      expect(config.fieldType).toBe('date')
    })

    test('should have configuration for AWARD_MAIN_CONTRACT', () => {
      const config = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.AWARD_MAIN_CONTRACT]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.award_main_contract'
      )
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH
      )
      expect(config.yearField).toBe(PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR)
      expect(config.fieldType).toBe('date')
    })

    test('should have configuration for START_WORK', () => {
      const config = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_WORK]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.expect_to_start_the_work'
      )
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH
      )
      expect(config.yearField).toBe(
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
      )
      expect(config.fieldType).toBe('date')
    })

    test('should have configuration for START_BENEFITS', () => {
      const config = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.start_achieving_its_benefits'
      )
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH
      )
      expect(config.yearField).toBe(
        PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR
      )
      expect(config.fieldType).toBe('date')
    })

    test('should have configuration for COULD_START_EARLY', () => {
      const config = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.could_start_earlier'
      )
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY)
      expect(config.fieldType).toBe('radio')
    })

    test('should have configuration for EARLIEST_START_DATE', () => {
      const config = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.EARLIEST_START_DATE]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.important_dates.earliest_date'
      )
      expect(config.schema).toBeDefined()
      expect(config.monthField).toBe(
        PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH
      )
      expect(config.yearField).toBe(
        PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR
      )
      expect(config.fieldType).toBe('date')
    })

    test('should have all required fields in date type configs', () => {
      Object.entries(IMPORTANT_DATES_CONFIG).forEach(([key, config]) => {
        expect(config.localKeyPrefix).toBeDefined()
        expect(config.backLinkOptions).toBeDefined()
        expect(config.schema).toBeDefined()
        expect(config.fieldType).toBeDefined()

        if (config.fieldType === 'date') {
          expect(config.monthField).toBeDefined()
          expect(config.yearField).toBeDefined()
        } else if (config.fieldType === 'radio') {
          expect(config.fieldName).toBeDefined()
        }
      })
    })

    test('should have proper back link chains for sequential steps', () => {
      const completeConfig =
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]
      expect(completeConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE
      )

      const awardConfig =
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.AWARD_MAIN_CONTRACT]
      expect(awardConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE
      )

      const startWorkConfig = IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_WORK]
      expect(startWorkConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT
      )

      const startBenefitsConfig =
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS]
      expect(startBenefitsConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.START_WORK
      )
    })
  })

  describe('PROJECT_PAYLOAD_LEVEL_FIELDS', () => {
    test('should have fields for INITIAL_SAVE level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.NAME,
        PROJECT_PAYLOAD_FIELDS.AREA_ID,
        PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE,
        PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES,
        PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
      ])
    })

    test('should have fields for PROJECT_NAME level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.PROJECT_NAME]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.NAME
      ])
    })

    test('should have fields for PROJECT_TYPE level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE,
        PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES,
        PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE
      ])
    })

    test('should have fields for FINANCIAL_START_YEAR level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR
      ])
    })

    test('should have fields for FINANCIAL_END_YEAR level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
      ])
    })

    test('should have fields for START_OUTLINE_BUSINESS_CASE level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.START_OUTLINE_BUSINESS_CASE
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
      ])
    })

    test('should have fields for COMPLETE_OUTLINE_BUSINESS_CASE level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.COMPLETE_OUTLINE_BUSINESS_CASE
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
      ])
    })

    test('should have fields for AWARD_MAIN_CONTRACT level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.AWARD_MAIN_CONTRACT]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
        PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
        PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
      ])
    })

    test('should have fields for START_WORK level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.START_WORK]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
        PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
      ])
    })

    test('should have fields for START_BENEFITS level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.START_BENEFITS]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
        PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
        PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
        PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR
      ])
    })

    test('should have fields for COULD_START_EARLY level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.COULD_START_EARLY]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY
      ])
    })

    test('should have fields for EARLIEST_START_DATE level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.EARLIEST_START_DATE]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
        PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY,
        PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
        PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR
      ])
    })

    test('should include reference number in all edit-level payloads', () => {
      const editLevels = [
        PROJECT_PAYLOAD_LEVELS.PROJECT_NAME,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR,
        PROJECT_PAYLOAD_LEVELS.START_OUTLINE_BUSINESS_CASE,
        PROJECT_PAYLOAD_LEVELS.COMPLETE_OUTLINE_BUSINESS_CASE,
        PROJECT_PAYLOAD_LEVELS.AWARD_MAIN_CONTRACT,
        PROJECT_PAYLOAD_LEVELS.START_WORK,
        PROJECT_PAYLOAD_LEVELS.START_BENEFITS,
        PROJECT_PAYLOAD_LEVELS.COULD_START_EARLY,
        PROJECT_PAYLOAD_LEVELS.EARLIEST_START_DATE
      ]

      editLevels.forEach((level) => {
        const fields = PROJECT_PAYLOAD_LEVEL_FIELDS[level]
        expect(fields).toContain(PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER)
      })
    })

    test('should have incremental field additions for sequential steps', () => {
      const completeFields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.COMPLETE_OUTLINE_BUSINESS_CASE
        ]
      expect(completeFields).toContain(
        PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH
      )
      expect(completeFields).toContain(
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH
      )

      const awardFields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.AWARD_MAIN_CONTRACT]
      expect(awardFields).toContain(
        PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH
      )
      expect(awardFields).toContain(PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH)
    })

    test('should have fields for APPROACH level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.APPROACH]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.APPROACH
      ])
    })

    test('should have fields for URGENCY_REASON level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.URGENCY_REASON]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.URGENCY_REASON
      ])
    })

    test('should have fields for URGENCY_DETAILS level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.URGENCY_DETAILS]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.URGENCY_REASON,
        PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS
      ])
    })

    test('should have fields for CONFIDENCE_HOMES_BETTER_PROTECTED level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BETTER_PROTECTED
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED
      ])
    })

    test('should have fields for CONFIDENCE_HOMES_BY_GATEWAY_FOUR level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      ])
    })

    test('should have fields for CONFIDENCE_SECURED_PARTNERSHIP_FUNDING level', () => {
      const fields =
        PROJECT_PAYLOAD_LEVEL_FIELDS[
          PROJECT_PAYLOAD_LEVELS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
        ]
      expect(fields).toEqual([
        PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      ])
    })

    test('should include reference number in all goals/urgency/confidence edit-level payloads', () => {
      const levels = [
        PROJECT_PAYLOAD_LEVELS.APPROACH,
        PROJECT_PAYLOAD_LEVELS.URGENCY_REASON,
        PROJECT_PAYLOAD_LEVELS.URGENCY_DETAILS,
        PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BETTER_PROTECTED,
        PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
        PROJECT_PAYLOAD_LEVELS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      ]

      levels.forEach((level) => {
        const fields = PROJECT_PAYLOAD_LEVEL_FIELDS[level]
        expect(fields).toContain(PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER)
      })
    })
  })

  describe('GOALS_URGENCY_CONFIDENCE_CONFIG', () => {
    test('should have configuration for PROJECT_GOALS step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.PROJECT_GOALS]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe('projects.project_goals')
      expect(config.backLinkOptions.conditionalRedirect).toBe(true)
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.APPROACH)
      expect(config.fieldType).toBe('character-count')
      expect(config.maxLength).toBe(700)
    })

    test('should have configuration for URGENCY_REASON step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.URGENCY_REASON]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.project_urgency.urgency_reason'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(true)
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.URGENCY_REASON)
      expect(config.fieldType).toBe('radio')
    })

    test('should have configuration for URGENCY_DETAILS step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.URGENCY_DETAILS]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.project_urgency.urgency_detail'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(false)
      expect(config.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.URGENCY_REASON
      )
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS)
      expect(config.fieldType).toBe('character-count')
      expect(config.maxLength).toBe(700)
    })

    test('should have configuration for CONFIDENCE_HOMES_BETTER_PROTECTED step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[
          PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
        ]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.confidence_assessment.property_confidence'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(true)
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      expect(config.fieldType).toBe('radio')
    })

    test('should have configuration for CONFIDENCE_HOMES_BY_GATEWAY_FOUR step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[
          PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
        ]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.confidence_assessment.gateway_confidence'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(false)
      expect(config.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )
      expect(config.fieldType).toBe('radio')
    })

    test('should have configuration for CONFIDENCE_SECURED_PARTNERSHIP_FUNDING step', () => {
      const config =
        GOALS_URGENCY_CONFIDENCE_CONFIG[
          PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
        ]
      expect(config).toBeDefined()
      expect(config.localKeyPrefix).toBe(
        'projects.confidence_assessment.funding_confidence'
      )
      expect(config.backLinkOptions.conditionalRedirect).toBe(false)
      expect(config.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )
      expect(config.schema).toBeDefined()
      expect(config.fieldName).toBe(
        PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )
      expect(config.fieldType).toBe('radio')
    })

    test('should have all required fields in each config', () => {
      Object.values(GOALS_URGENCY_CONFIDENCE_CONFIG).forEach((config) => {
        expect(config.localKeyPrefix).toBeDefined()
        expect(config.backLinkOptions).toBeDefined()
        expect(config.schema).toBeDefined()
        expect(config.fieldName).toBeDefined()
        expect(config.fieldType).toBeDefined()
      })
    })

    test('should have proper back link chains for sequential confidence steps', () => {
      const gatewayConfig =
        GOALS_URGENCY_CONFIDENCE_CONFIG[
          PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
        ]
      expect(gatewayConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED
      )

      const fundingConfig =
        GOALS_URGENCY_CONFIDENCE_CONFIG[
          PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
        ]
      expect(fundingConfig.backLinkOptions.targetEditURL).toBe(
        ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )
    })
  })
})
