import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'

/**
 * Convert empty string to null
 * @param {*} value - Value to convert
 * @returns {*} null if empty string, otherwise original value
 */
function convertEmptyToNull(value) {
  return value === '' ? null : value
}

/**
 * Parse string to float if value exists
 * @param {*} value - Value to parse
 * @returns {number|null} Parsed float or null
 */
function parseToFloat(value) {
  return value ? Number.parseFloat(value) : value
}

/**
 * Process selected measures payload
 * @param {Object} payload - Request payload
 */
function processSelectedMeasures(payload) {
  // Normalize nfmSelectedMeasures to always be an array
  if (
    payload.nfmSelectedMeasures &&
    !Array.isArray(payload.nfmSelectedMeasures)
  ) {
    payload.nfmSelectedMeasures = [payload.nfmSelectedMeasures]
  }

  // Convert array to comma-separated string for backend
  if (Array.isArray(payload.nfmSelectedMeasures)) {
    payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES] =
      payload.nfmSelectedMeasures.join(',')
  }
}

/**
 * Process river restoration payload
 * @param {Object} payload - Request payload
 */
function processRiverRestoration(payload) {
  payload.nfmRiverRestorationVolume = convertEmptyToNull(
    payload.nfmRiverRestorationVolume
  )
  payload.nfmRiverRestorationArea = parseToFloat(
    payload.nfmRiverRestorationArea
  )
  payload.nfmRiverRestorationVolume = parseToFloat(
    payload.nfmRiverRestorationVolume
  )
}

/**
 * Process leaky barriers payload
 * @param {Object} payload - Request payload
 */
function processLeakyBarriers(payload) {
  payload.nfmLeakyBarriersVolume = convertEmptyToNull(
    payload.nfmLeakyBarriersVolume
  )
  payload.nfmLeakyBarriersVolume = parseToFloat(payload.nfmLeakyBarriersVolume)
  payload.nfmLeakyBarriersLength = parseToFloat(payload.nfmLeakyBarriersLength)
  payload.nfmLeakyBarriersWidth = parseToFloat(payload.nfmLeakyBarriersWidth)
}

/**
 * Process and normalize payload based on step
 * @param {string} step - Current project step
 * @param {Object} payload - Request payload
 */
export function processPayload(step, payload) {
  switch (step) {
    case PROJECT_STEPS.NFM_SELECTED_MEASURES:
      processSelectedMeasures(payload)
      break

    case PROJECT_STEPS.NFM_RIVER_RESTORATION:
      processRiverRestoration(payload)
      break

    case PROJECT_STEPS.NFM_LEAKY_BARRIERS:
      processLeakyBarriers(payload)
      break

    // Add more cases for other NFM steps here
    default:
      break
  }
}
