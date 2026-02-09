/**
 * File Upload Validation
 * Frontend validation for file uploads before sending to backend
 */

import {
  FILE_UPLOAD_VALIDATION_CODES,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES
} from '../constants/file-upload.js'

/**
 * Validate file is selected
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result
 */
export function validateFileSelected(file) {
  if (!file) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED
    }
  }
  return { isValid: true }
}

/**
 * Validate file is not empty
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result
 */
export function validateFileNotEmpty(file) {
  if (!file || file.size < FILE_SIZE_LIMITS.MIN_SIZE) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY
    }
  }
  return { isValid: true }
}

/**
 * Validate file size
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result
 */
export function validateFileSize(file) {
  if (file && file.size > FILE_SIZE_LIMITS.MAX_SIZE) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TOO_LARGE
    }
  }
  return { isValid: true }
}

/**
 * Validate file MIME type
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result
 */
export function validateFileMimeType(file) {
  if (!file?.type) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID
    }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
    }
  }

  return { isValid: true }
}

/**
 * Validate file extension
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result
 */
export function validateFileExtension(file) {
  if (!file?.name) {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
    }
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'zip') {
    return {
      isValid: false,
      errorCode: FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID
    }
  }

  return { isValid: true }
}

/**
 * Performs all frontend file validations
 * @param {File} file - File object from form input
 * @returns {{isValid: boolean, errorCode?: string}} Validation result with first error encountered
 */
export function validateFile(file) {
  // Check if file is selected
  const selectedValidation = validateFileSelected(file)
  if (!selectedValidation.isValid) {
    return selectedValidation
  }

  // Check if file is empty
  const emptyValidation = validateFileNotEmpty(file)
  if (!emptyValidation.isValid) {
    return emptyValidation
  }

  // Check file size
  const sizeValidation = validateFileSize(file)
  if (!sizeValidation.isValid) {
    return sizeValidation
  }

  // Check file extension
  const extensionValidation = validateFileExtension(file)
  if (!extensionValidation.isValid) {
    return extensionValidation
  }

  // Check MIME type
  const mimeValidation = validateFileMimeType(file)
  if (!mimeValidation.isValid) {
    return mimeValidation
  }

  return { isValid: true }
}
