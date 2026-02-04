/**
 * File Upload Constants
 * Frontend constants for file upload validation and error handling
 */

/**
 * File upload validation codes - must match backend codes
 */
export const FILE_UPLOAD_VALIDATION_CODES = {
  FILE_EMPTY: 'FILE_EMPTY',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',
  FILE_MIME_TYPE_INVALID: 'FILE_MIME_TYPE_INVALID',
  ZIP_CONTENT_INVALID: 'FILE_ZIP_CONTENT_INVALID',
  FILE_REQUIRED: 'FILE_REQUIRED'
}

/**
 * File size limits - must match backend configuration
 */
export const FILE_SIZE_LIMITS = {
  MIN_SIZE: 1, // 1 byte - file cannot be empty
  MAX_SIZE: 100 * 1024 * 1024, // 100 MB
  MAX_SIZE_MB: 100
}

/**
 * Allowed MIME types for file uploads
 * Primarily for shapefile uploads (.zip)
 */
export const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-compressed'
]

/**
 * File upload error messages for display
 */
export const FILE_UPLOAD_ERROR_MESSAGES = {
  [FILE_UPLOAD_VALIDATION_CODES.FILE_REQUIRED]: 'Select a file to upload',
  [FILE_UPLOAD_VALIDATION_CODES.FILE_EMPTY]: 'The selected file is empty',
  [FILE_UPLOAD_VALIDATION_CODES.FILE_TOO_LARGE]: `The selected file must be smaller than ${FILE_SIZE_LIMITS.MAX_SIZE_MB}MB`,
  [FILE_UPLOAD_VALIDATION_CODES.FILE_TYPE_INVALID]:
    'The selected file must be a ZIP file',
  [FILE_UPLOAD_VALIDATION_CODES.FILE_MIME_TYPE_INVALID]:
    'The selected file type is not allowed',
  [FILE_UPLOAD_VALIDATION_CODES.ZIP_CONTENT_INVALID]:
    'The ZIP file contains invalid file types. Only shapefile components are allowed'
}
