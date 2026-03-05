import { describe, test, expect } from 'vitest'
import { nfmOfflineStorageSchema } from './offline-storage-schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const { NFM_OFFLINE_STORAGE_AREA, NFM_OFFLINE_STORAGE_VOLUME } =
  PROJECT_PAYLOAD_FIELDS

describe('NFM Offline Storage Schema', () => {
  describe('Area field validation', () => {
    test('should validate valid area value', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10.5,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeUndefined()
      expect(result.value[NFM_OFFLINE_STORAGE_AREA]).toBe(10.5)
    })

    test('should validate area with 2 decimal places', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 15.25,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeUndefined()
      expect(result.value[NFM_OFFLINE_STORAGE_AREA]).toBe(15.25)
    })

    test('should reject negative area', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: -10,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('positive')
    })

    test('should reject zero area', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 0,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('positive')
    })

    test('should reject missing area', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_VOLUME]: 500
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('area')
    })

    test('should reject non-numeric area', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 'abc',
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('area')
    })
  })

  describe('Volume field validation', () => {
    test('should allow optional volume value', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty string for volume', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: ''
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate valid volume value', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: 500.5
      })
      expect(result.error).toBeUndefined()
      expect(result.value[NFM_OFFLINE_STORAGE_VOLUME]).toBe(500.5)
    })

    test('should validate volume with 2 decimal places', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: 250.75
      })
      expect(result.error).toBeUndefined()
      expect(result.value[NFM_OFFLINE_STORAGE_VOLUME]).toBe(250.75)
    })

    test('should reject negative volume', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: -100
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('positive')
    })

    test('should reject zero volume', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: 0
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('positive')
    })

    test('should reject non-numeric volume', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: 'invalid'
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('number')
    })
  })

  describe('Complete form validation', () => {
    test('should validate all required fields present', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 20,
        [NFM_OFFLINE_STORAGE_VOLUME]: null
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate all fields with valid values including optional volume', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 15.5,
        [NFM_OFFLINE_STORAGE_VOLUME]: 750.25
      })
      expect(result.error).toBeUndefined()
      expect(result.value[NFM_OFFLINE_STORAGE_AREA]).toBe(15.5)
      expect(result.value[NFM_OFFLINE_STORAGE_VOLUME]).toBe(750.25)
    })

    test('should allow unknown fields like crumb', () => {
      const result = nfmOfflineStorageSchema.validate({
        [NFM_OFFLINE_STORAGE_AREA]: 10,
        [NFM_OFFLINE_STORAGE_VOLUME]: 500,
        crumb: 'test-crumb-value'
      })
      expect(result.error).toBeUndefined()
    })
  })
})
