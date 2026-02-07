/**
 * File Upload Validation - Unit Tests
 * Tests for frontend file upload validation helper functions
 */

import { describe, it, expect } from 'vitest'
import {
  validateFileSelected,
  validateFileNotEmpty,
  validateFileSize,
  validateFileMimeType,
  validateFileExtension,
  validateFile
} from './file-upload-validation.js'
import {
  FILE_UPLOAD_VALIDATION_CODES,
  FILE_SIZE_LIMITS
} from '../constants/file-upload.js'

describe('file-upload-validation', () => {
  describe('validateFileSelected', () => {
    it('should return error when no file is provided', () => {
      const result = validateFileSelected(null)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED
      })
    })

    it('should return error when file is undefined', () => {
      const result = validateFileSelected(undefined)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED
      })
    })

    it('should return valid when file is provided', () => {
      const file = { name: 'test.zip', size: 1000 }
      const result = validateFileSelected(file)

      expect(result).toEqual({ isValid: true })
    })
  })

  describe('validateFileNotEmpty', () => {
    it('should return error when no file is provided', () => {
      const result = validateFileNotEmpty(null)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
      })
    })

    it('should return error when file is undefined', () => {
      const result = validateFileNotEmpty(undefined)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
      })
    })

    it('should return error when file size is less than minimum', () => {
      const file = { name: 'test.zip', size: FILE_SIZE_LIMITS.MIN_SIZE - 1 }
      const result = validateFileNotEmpty(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
      })
    })

    it('should return error when file size is zero', () => {
      const file = { name: 'test.zip', size: 0 }
      const result = validateFileNotEmpty(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
      })
    })

    it('should return valid when file size equals minimum', () => {
      const file = { name: 'test.zip', size: FILE_SIZE_LIMITS.MIN_SIZE }
      const result = validateFileNotEmpty(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file size is greater than minimum', () => {
      const file = { name: 'test.zip', size: 1000 }
      const result = validateFileNotEmpty(file)

      expect(result).toEqual({ isValid: true })
    })
  })

  describe('validateFileSize', () => {
    it('should return valid when no file is provided', () => {
      const result = validateFileSize(null)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file is undefined', () => {
      const result = validateFileSize(undefined)

      expect(result).toEqual({ isValid: true })
    })

    it('should return error when file size exceeds maximum', () => {
      const file = { name: 'test.zip', size: FILE_SIZE_LIMITS.MAX_SIZE + 1 }
      const result = validateFileSize(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TOO_LARGE
      })
    })

    it('should return valid when file size equals maximum', () => {
      const file = { name: 'test.zip', size: FILE_SIZE_LIMITS.MAX_SIZE }
      const result = validateFileSize(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file size is within limit', () => {
      const file = { name: 'test.zip', size: 50 * 1024 * 1024 } // 50 MB
      const result = validateFileSize(file)

      expect(result).toEqual({ isValid: true })
    })
  })

  describe('validateFileMimeType', () => {
    it('should return error when no file is provided', () => {
      const result = validateFileMimeType(null)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
      })
    })

    it('should return error when file is undefined', () => {
      const result = validateFileMimeType(undefined)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
      })
    })

    it('should return error when file has no type property', () => {
      const file = { name: 'test.zip', size: 1000 }
      const result = validateFileMimeType(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
      })
    })

    it('should return error when file has empty type', () => {
      const file = { name: 'test.zip', size: 1000, type: '' }
      const result = validateFileMimeType(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
      })
    })

    it('should return error when file type is not in allowed list', () => {
      const file = { name: 'test.txt', size: 1000, type: 'text/plain' }
      const result = validateFileMimeType(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file type is application/pdf', () => {
      const file = { name: 'test.pdf', size: 1000, type: 'application/pdf' }
      const result = validateFileMimeType(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return valid when file type is application/zip', () => {
      const file = {
        name: 'test.zip',
        size: 1000,
        type: 'application/zip'
      }
      const result = validateFileMimeType(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file type is application/x-zip-compressed', () => {
      const file = {
        name: 'test.zip',
        size: 1000,
        type: 'application/x-zip-compressed'
      }
      const result = validateFileMimeType(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file type is application/x-compressed', () => {
      const file = {
        name: 'test.zip',
        size: 1000,
        type: 'application/x-compressed'
      }
      const result = validateFileMimeType(file)

      expect(result).toEqual({ isValid: true })
    })
  })

  describe('validateFileExtension', () => {
    it('should return error when no file is provided', () => {
      const result = validateFileExtension(null)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file is undefined', () => {
      const result = validateFileExtension(undefined)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file has no name property', () => {
      const file = { size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file has empty name', () => {
      const file = { name: '', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file extension is not zip', () => {
      const file = { name: 'test.txt', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file extension is pdf', () => {
      const file = { name: 'test.pdf', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file has no extension', () => {
      const file = { name: 'testfile', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return valid when file extension is .zip (lowercase)', () => {
      const file = { name: 'test.zip', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file extension is .ZIP (uppercase)', () => {
      const file = { name: 'test.ZIP', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file extension is .Zip (mixed case)', () => {
      const file = { name: 'test.Zip', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file has multiple dots in name', () => {
      const file = { name: 'test.file.backup.zip', size: 1000 }
      const result = validateFileExtension(file)

      expect(result).toEqual({ isValid: true })
    })
  })

  describe('validateFile', () => {
    it('should return error when no file is provided', () => {
      const result = validateFile(null)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED
      })
    })

    it('should return error when file is empty (size 0)', () => {
      const file = {
        name: 'test.zip',
        size: 0,
        type: 'application/zip'
      }
      const result = validateFile(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
      })
    })

    it('should return error when file is too large', () => {
      const file = {
        name: 'test.zip',
        size: FILE_SIZE_LIMITS.MAX_SIZE + 1,
        type: 'application/zip'
      }
      const result = validateFile(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TOO_LARGE
      })
    })

    it('should return error when file extension is not zip', () => {
      const file = {
        name: 'test.txt',
        size: 1000,
        type: 'text/plain'
      }
      const result = validateFile(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file has zip extension but invalid MIME type', () => {
      const file = {
        name: 'test.zip',
        size: 1000,
        type: 'text/plain'
      }
      const result = validateFile(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
      })
    })

    it('should return error when file has no MIME type', () => {
      const file = {
        name: 'test.zip',
        size: 1000
      }
      const result = validateFile(file)

      expect(result).toEqual({
        isValid: false,
        errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
      })
    })

    it('should return valid when all validations pass with application/zip', () => {
      const file = {
        name: 'test.zip',
        size: 1000,
        type: 'application/zip'
      }
      const result = validateFile(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when all validations pass with application/x-zip-compressed', () => {
      const file = {
        name: 'shapefile.zip',
        size: 50 * 1024 * 1024, // 50 MB
        type: 'application/x-zip-compressed'
      }
      const result = validateFile(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when all validations pass with application/x-compressed', () => {
      const file = {
        name: 'data.ZIP',
        size: FILE_SIZE_LIMITS.MAX_SIZE,
        type: 'application/x-compressed'
      }
      const result = validateFile(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should return valid when file is at minimum size', () => {
      const file = {
        name: 'tiny.zip',
        size: FILE_SIZE_LIMITS.MIN_SIZE,
        type: 'application/zip'
      }
      const result = validateFile(file)

      expect(result).toEqual({ isValid: true })
    })

    it('should validate in correct order - file selection before size check', () => {
      // This tests that validation happens in the right order
      // If file is null, it should fail on FILE_REQUIRED, not on size
      const result = validateFile(null)

      expect(result.errorCode).toBe(FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED)
    })

    it('should validate in correct order - empty check before extension', () => {
      // Empty file should fail on FILE_EMPTY, not extension
      const file = {
        name: 'test.txt',
        size: 0,
        type: 'text/plain'
      }
      const result = validateFile(file)

      expect(result.errorCode).toBe(FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY)
    })

    it('should validate in correct order - size check before extension', () => {
      // Too large file should fail on FILE_TOO_LARGE, not extension
      const file = {
        name: 'test.txt',
        size: FILE_SIZE_LIMITS.MAX_SIZE + 1,
        type: 'text/plain'
      }
      const result = validateFile(file)

      expect(result.errorCode).toBe(FILE_UPLOAD_VALIDATION_CODES.FILE_TOO_LARGE)
    })
  })
})
