import { describe, test, expect } from 'vitest'

// Financial year starts in April; compute current and next financial year dynamically
const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()
const currentFinancialYear = currentMonth >= 4 ? currentYear : currentYear - 1
const nextFinancialYear = currentFinancialYear + 1
import {
  validateProjectName,
  validateAreaId,
  validateProjectType,
  validateProjectInterventionTypes,
  validateMainInterventionType,
  validateFinancialStartYear,
  validateFinancialEndYear,
  validateStartOutlineBusinessCase,
  validateCompleteOutlineBusinessCase,
  validateAwardMainContract,
  validateStartWork,
  validateStartBenefits,
  validateCouldStartEarlier,
  validateEarliestStartDate,
  validateRisks,
  validateMainRisk,
  validatePropertyAffectedFlooding,
  validatePropertyAffectedCoastalErosion
} from './schema.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_RISK_TYPES
} from '../../common/constants/projects.js'

describe('Project Schemas', () => {
  describe('validateProjectName', () => {
    test('should validate valid project name', () => {
      const result = validateProjectName.validate({
        [PROJECT_PAYLOAD_FIELDS.NAME]: 'Test Project'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing project name', () => {
      const result = validateProjectName.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateAreaId', () => {
    test('should validate valid area ID', () => {
      const result = validateAreaId.validate({
        [PROJECT_PAYLOAD_FIELDS.AREA_ID]: '1'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing area ID', () => {
      const result = validateAreaId.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateProjectType', () => {
    test('should validate valid project type', () => {
      const result = validateProjectType.validate({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing project type', () => {
      const result = validateProjectType.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateProjectInterventionTypes', () => {
    test('should validate valid intervention types', () => {
      const result = validateProjectInterventionTypes.validate({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: ['NFM']
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing project type', () => {
      const result = validateProjectInterventionTypes.validate({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: ['NFM']
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validateMainInterventionType', () => {
    test('should validate valid main intervention type', () => {
      const result = validateMainInterventionType.validate({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: ['NFM', 'SUDS'],
        [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]: 'NFM'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing main intervention type', () => {
      const result = validateMainInterventionType.validate({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: ['NFM', 'SUDS']
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validateFinancialStartYear', () => {
    test('should validate valid financial start year', () => {
      const result = validateFinancialStartYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
          String(currentFinancialYear)
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow optional financial end year', () => {
      const result = validateFinancialStartYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
          String(currentFinancialYear),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: String(nextFinancialYear)
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing financial start year', () => {
      const result = validateFinancialStartYear.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateFinancialEndYear', () => {
    test('should validate valid financial years', () => {
      const result = validateFinancialEndYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
          String(currentFinancialYear),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: String(nextFinancialYear)
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing financial end year', () => {
      const result = validateFinancialEndYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]:
          String(currentFinancialYear)
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validateStartOutlineBusinessCase', () => {
    test('should validate valid month and year', () => {
      const result = validateStartOutlineBusinessCase.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '4',
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2027'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing month', () => {
      const result = validateStartOutlineBusinessCase.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2025'
      })
      expect(result.error).toBeDefined()
    })

    test('should return error for missing year', () => {
      const result = validateStartOutlineBusinessCase.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '4'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validateCompleteOutlineBusinessCase', () => {
    test('should validate valid month and year', () => {
      const result = validateCompleteOutlineBusinessCase.validate({
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: '6',
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: '2027'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid data', () => {
      const result = validateCompleteOutlineBusinessCase.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateAwardMainContract', () => {
    test('should validate valid month and year', () => {
      const result = validateAwardMainContract.validate({
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: '9',
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: '2027'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid data', () => {
      const result = validateAwardMainContract.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateStartWork', () => {
    test('should validate valid month and year', () => {
      const result = validateStartWork.validate({
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: '6',
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: '2027'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid data', () => {
      const result = validateStartWork.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateStartBenefits', () => {
    test('should validate valid month and year', () => {
      const result = validateStartBenefits.validate({
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: '4',
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: '2026'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid data', () => {
      const result = validateStartBenefits.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateCouldStartEarlier', () => {
    test('should validate boolean true', () => {
      const result = validateCouldStartEarlier.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate boolean false', () => {
      const result = validateCouldStartEarlier.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: false
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate string "true"', () => {
      const result = validateCouldStartEarlier.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: 'true'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing value', () => {
      const result = validateCouldStartEarlier.validate({})
      expect(result.error).toBeDefined()
    })
  })

  describe('validateEarliestStartDate', () => {
    test('should validate valid earliest date when couldStartEarly is true', () => {
      const result = validateEarliestStartDate.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: '4',
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: '2025'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing month when couldStartEarly is true', () => {
      const result = validateEarliestStartDate.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: '2025'
      })
      expect(result.error).toBeDefined()
    })

    test('should return error for missing year when couldStartEarly is true', () => {
      const result = validateEarliestStartDate.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: '4'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validateRisks', () => {
    test('should validate valid risks array', () => {
      const result = validateRisks.validate({
        [PROJECT_PAYLOAD_FIELDS.RISKS]: [
          PROJECT_RISK_TYPES.FLUVIAL,
          PROJECT_RISK_TYPES.TIDAL
        ]
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate single risk', () => {
      const result = validateRisks.validate({
        [PROJECT_PAYLOAD_FIELDS.RISKS]: [PROJECT_RISK_TYPES.COASTAL_EROSION]
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for empty risks array', () => {
      const result = validateRisks.validate({
        [PROJECT_PAYLOAD_FIELDS.RISKS]: []
      })
      expect(result.error).toBeDefined()
    })

    test('should return error for missing risks', () => {
      const result = validateRisks.validate({})
      expect(result.error).toBeDefined()
    })

    test('should allow unknown fields for clearing properties', () => {
      const result = validateRisks.validate({
        [PROJECT_PAYLOAD_FIELDS.RISKS]: [PROJECT_RISK_TYPES.FLUVIAL],
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: null,
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]:
          null
      })
      expect(result.error).toBeUndefined()
    })
  })

  describe('validateMainRisk', () => {
    test('should validate valid main risk', () => {
      const result = validateMainRisk.validate({
        [PROJECT_PAYLOAD_FIELDS.MAIN_RISK]: PROJECT_RISK_TYPES.FLUVIAL
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate coastal erosion as main risk', () => {
      const result = validateMainRisk.validate({
        [PROJECT_PAYLOAD_FIELDS.MAIN_RISK]: PROJECT_RISK_TYPES.COASTAL_EROSION
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing main risk', () => {
      const result = validateMainRisk.validate({})
      expect(result.error).toBeDefined()
    })

    test('should return error for invalid risk type', () => {
      const result = validateMainRisk.validate({
        [PROJECT_PAYLOAD_FIELDS.MAIN_RISK]: 'invalid_risk'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validatePropertyAffectedFlooding', () => {
    test('should validate when checkbox is checked (no properties)', () => {
      const result = validatePropertyAffectedFlooding.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]: true
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate with property values when checkbox unchecked', () => {
      const result = validatePropertyAffectedFlooding.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]: false,
        [PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]: 10,
        [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS]: 5,
        [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50]: 3,
        [PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty strings when checkbox is checked', () => {
      const result = validatePropertyAffectedFlooding.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]: 'true',
        [PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]: '',
        [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS]: '',
        [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50]: '',
        [PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE]: ''
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid property value when checkbox unchecked', () => {
      const result = validatePropertyAffectedFlooding.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]: false,
        [PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]: 'invalid'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('validatePropertyAffectedCoastalErosion', () => {
    test('should validate when checkbox is checked (no properties)', () => {
      const result = validatePropertyAffectedCoastalErosion.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: true
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate with property values when checkbox unchecked', () => {
      const result = validatePropertyAffectedCoastalErosion.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: false,
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]: 8,
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION]: 12
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty strings when checkbox is checked', () => {
      const result = validatePropertyAffectedCoastalErosion.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: 'true',
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]:
          '',
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION]:
          ''
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for invalid property value when checkbox unchecked', () => {
      const result = validatePropertyAffectedCoastalErosion.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: false,
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]:
          'invalid'
      })
      expect(result.error).toBeDefined()
    })

    test('should return error for negative property values', () => {
      const result = validatePropertyAffectedCoastalErosion.validate({
        [PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]: false,
        [PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL]:
          -5
      })
      expect(result.error).toBeDefined()
    })
  })
})
