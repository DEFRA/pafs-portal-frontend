import { describe, it, expect, beforeEach, vi } from 'vitest'
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
} from './project-timeline-schemas.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../constants/projects.js'

describe('project-timeline-schemas', () => {
  describe('Helper functions - getCurrentFinancialMonthYear', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    it('should return current financial year when in April-December', () => {
      // May 15, 2025 - financial year 2025
      vi.setSystemTime(new Date('2025-05-15T10:00:00Z'))

      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema
      })

      // Should allow current financial year (2025) for earliestWithGia
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()

      vi.useRealTimers()
    })

    it('should return previous year as financial year when in January-March', () => {
      // February 15, 2026 - financial year 2025 (previous year)
      vi.setSystemTime(new Date('2026-02-15T10:00:00Z'))

      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema
      })

      // Should allow financial year 2025 (not 2026) for earliestWithGia
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()

      vi.useRealTimers()
    })
  })

  describe('Helper functions - isWithinFinancialYearRange', () => {
    it('should return true when financial years are not provided', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema
      })

      // Should pass without financial years
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should reject date before financial start year', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_outside_financial_range')
    })

    it('should reject date in financial start year but before April', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 3, // March
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_outside_financial_range')
    })

    it('should reject date after financial end year', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2031,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_outside_financial_range')
    })

    it('should reject date in financial end year but after March', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5, // May
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2029,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2028
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_outside_financial_range')
    })

    it('should allow date exactly at financial end (March of end year + 1)', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 3, // March
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2031, // FY 2030 ends March 2031
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeUndefined()
    })

    it('should reject date after financial end (April of end year + 1)', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 4, // April
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2031, // After FY 2030
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_outside_financial_range')
    })
  })

  describe('Helper functions - compareMonthYear', () => {
    it('should handle year1 > year2 comparison', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      // Complete OBC date before Start OBC date (year comparison)
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2026,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_not_after_previous_stage')
    })

    it('should handle month1 > month2 comparison when years are equal', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      // Complete OBC month before Start OBC month (same year)
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_not_after_previous_stage')
    })

    it('should reject equal month and year (must be strictly greater)', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.date_not_after_previous_stage')
    })

    it('should allow date after previous stage', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 7,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })
  })

  describe('validateStandardTimelineDate edge cases', () => {
    it('should skip custom validation when both month and year present', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      })
      expect(error).toBeUndefined()
    })

    it('should skip sequential validation when previous stage month is NaN', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      // No startOutlineBusinessCaseMonth provided
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should skip sequential validation when previous stage year is NaN', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number().optional(),
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      // No startOutlineBusinessCaseYear provided
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should skip sequential validation when previous stage is not provided', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema
      })

      // No startOutlineBusinessCase provided at all
      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })
  })

  describe('validateEarliestWithGiaDate edge cases', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Set to March 2, 2026 (financial year 2025)
      vi.setSystemTime(new Date('2026-03-02T10:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should allow valid earliestWithGia date', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should skip validation when OBC month is NaN', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should skip validation when OBC year is NaN', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number().optional()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6
      })
      expect(error).toBeUndefined()
    })

    it('should reject date after OBC start', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 7,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('custom.earliest_gia_after_start_obc')
    })

    it('should reject date before current financial year start', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 3, // March 2025 (before April 2025)
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe(
        'custom.earliest_gia_before_current_financial'
      )
    })

    it('should reject date with year before current financial year', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe(
        'custom.earliest_gia_before_current_financial'
      )
    })

    it('should allow date equal to OBC start', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })

    it('should allow date at current financial year start (April)', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: true,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 4, // April 2025 (financial year start)
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()
    })
  })

  describe('All timeline stages sequential validation', () => {
    it('should validate full timeline sequence', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          startOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]:
          startOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]:
          completeOutlineBusinessCaseMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]:
          completeOutlineBusinessCaseYearSchema,
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: awardContractMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: awardContractYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]:
          startConstructionMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]:
          startConstructionYearSchema,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]:
          readyForServiceMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]:
          readyForServiceYearSchema
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: 8,
        [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: 10,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: 3,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: 2027
      })
      expect(error).toBeUndefined()
    })
  })

  describe('couldStartEarly conditional logic', () => {
    it('should forbid earliestWithGia fields when couldStartEarly is false', () => {
      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: false,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025
      })
      expect(error).toBeDefined()
    })

    it('should allow earliestWithGia fields when couldStartEarly is string "true"', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-02T10:00:00Z'))

      const schema = Joi.object({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: couldStartEarlySchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]:
          earliestWithGiaMonthSchema,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]:
          earliestWithGiaYearSchema,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]:
          Joi.number(),
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: Joi.number()
      })

      const { error } = schema.validate({
        [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: 'true',
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: 5,
        [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: 2025
      })
      expect(error).toBeUndefined()

      vi.useRealTimers()
    })
  })
})
