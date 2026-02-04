import { describe, test, expect } from 'vitest'
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
  validateEarliestStartDate
} from './schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../common/constants/projects.js'

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
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025'
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow optional financial end year', () => {
      const result = validateFinancialStartYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
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
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
      })
      expect(result.error).toBeUndefined()
    })

    test('should return error for missing financial end year', () => {
      const result = validateFinancialEndYear.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025'
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
})
