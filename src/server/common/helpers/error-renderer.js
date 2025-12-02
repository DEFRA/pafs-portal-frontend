/**
 * Extract validation errors from frontend Joi error
 * Returns { field: errorCode } map for easy template rendering
 */
export function extractJoiErrors(err) {
  if (!err?.details) {
    return {}
  }
  const errors = {}
  for (const detail of err.details) {
    const field = detail.context?.label || detail.path?.[0]
    if (field) {
      errors[field] = detail.message
    }
  }
  return errors
}

/**
 * Extract validation errors from API response (validationErrors array)
 * Returns { field: errorCode } map matching frontend format
 */
export function extractApiValidationErrors(result) {
  if (!result?.validationErrors?.length) {
    return {}
  }
  const errors = {}
  for (const err of result.validationErrors) {
    if (err.field) {
      errors[err.field] = err.errorCode
    }
  }
  return errors
}

/**
 * Extract auth/general error from API response (errors array)
 * Returns { errorCode, warningCode, supportCode } or null
 */
export function extractApiError(result) {
  if (!result || result.success) {
    return null
  }
  const error = result.errors?.[0]
  if (!error) {
    return { errorCode: 'UNKNOWN_ERROR' }
  }
  return {
    errorCode: error.errorCode,
    warningCode: error.warningCode || null,
    supportCode: error.supportCode || null
  }
}
