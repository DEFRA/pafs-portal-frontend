import { describe, expect, test } from 'vitest'
import {
  getStep,
  formatEmission,
  formatCurrency
} from './controller-helpers.js'
import { PROJECT_STEPS } from '../../../common/constants/projects.js'

describe('getStep', () => {
  test('returns default CARBON_COST_BUILD when request is undefined', () => {
    expect(getStep(undefined)).toBe(PROJECT_STEPS.CARBON_COST_BUILD)
  })

  test('returns default CARBON_COST_BUILD when request has no route', () => {
    expect(getStep({})).toBe(PROJECT_STEPS.CARBON_COST_BUILD)
  })

  test('returns default CARBON_COST_BUILD when request.route.path is undefined', () => {
    expect(getStep({ route: {} })).toBe(PROJECT_STEPS.CARBON_COST_BUILD)
  })
})

describe('formatEmission', () => {
  test('returns null for null', () => {
    expect(formatEmission(null)).toBeNull()
  })

  test('returns null for undefined', () => {
    expect(formatEmission(undefined)).toBeNull()
  })

  test('returns null for non-numeric string', () => {
    expect(formatEmission('abc')).toBeNull()
  })

  test('formats integer with 2 decimal places and thousands commas', () => {
    expect(formatEmission(1500000)).toBe('1,500,000.00')
  })

  test('formats decimal value correctly', () => {
    expect(formatEmission(1234.5)).toBe('1,234.50')
  })

  test('formats zero correctly', () => {
    expect(formatEmission(0)).toBe('0.00')
  })

  test('formats negative value correctly', () => {
    expect(formatEmission(-500)).toBe('-500.00')
  })

  test('formats numeric string', () => {
    expect(formatEmission('2500')).toBe('2,500.00')
  })
})

describe('formatCurrency', () => {
  test('returns Not provided for null', () => {
    expect(formatCurrency(null)).toBe('Not provided')
  })

  test('returns Not provided for undefined', () => {
    expect(formatCurrency(undefined)).toBe('Not provided')
  })

  test('returns Not provided for empty string', () => {
    expect(formatCurrency('')).toBe('Not provided')
  })

  test('returns Not provided for non-numeric string', () => {
    expect(formatCurrency('abc')).toBe('Not provided')
  })

  test('formats a plain number with £ prefix', () => {
    expect(formatCurrency(1000)).toBe('£1,000')
  })

  test('formats a comma-separated string correctly', () => {
    expect(formatCurrency('1,000,000')).toBe('£1,000,000')
  })
})
