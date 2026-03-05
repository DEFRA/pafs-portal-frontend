import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  NFM_MEASURES
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
 * Clear river restoration data from payload
 * @param {Object} payload - Request payload
 */
function clearRiverRestorationData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME] = null
}

/**
 * Clear leaky barriers data from payload
 * @param {Object} payload - Request payload
 */
function clearLeakyBarriersData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH] = null
}

/**
 * Clear offline storage data from payload
 * @param {Object} payload - Request payload
 */
function clearOfflineStorageData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME] = null
}

/**
 * Clear woodland data from payload
 * @param {Object} payload - Request payload
 */
function clearWoodlandData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA] = null
}

/**
 * Clear headwater drainage data from payload
 * @param {Object} payload - Request payload
 */
function clearHeadwaterDrainageData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA] = null
}

/**
 * Normalize NFM measures payload - convert to array if needed
 * @param {string|Array} measures - Measures as string or array
 * @returns {Array} Normalized array of measures
 */
function normalizeNfmMeasuresPayload(measures) {
  if (!measures) {
    return []
  }
  if (Array.isArray(measures)) {
    return measures
  }
  if (typeof measures === 'string') {
    return measures
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Process NFM measure changes and clear data for removed measures
 * @param {Array} previousMeasures - Previously selected measures
 * @param {Array} newMeasures - Newly selected measures
 * @param {Object} payload - Request payload to update
 */
function processNfmMeasureChanges(previousMeasures, newMeasures, payload) {
  const removedMeasures = previousMeasures.filter(
    (measure) => !newMeasures.includes(measure)
  )

  removedMeasures.forEach((measure) => {
    switch (measure) {
      case NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION:
        clearRiverRestorationData(payload)
        break
      case NFM_MEASURES.LEAKY_BARRIERS:
        clearLeakyBarriersData(payload)
        break
      case NFM_MEASURES.OFFLINE_STORAGE:
        clearOfflineStorageData(payload)
        break
      case NFM_MEASURES.WOODLAND:
        clearWoodlandData(payload)
        break
      case NFM_MEASURES.HEADWATER_DRAINAGE:
        clearHeadwaterDrainageData(payload)
        break
      default:
        break
    }
  })
}

/**
 * Process selected measures payload
 * @param {Object} payload - Request payload
 * @param {Object} sessionData - Session data for comparison
 */
function processSelectedMeasures(payload, sessionData) {
  // Normalize nfmSelectedMeasures to always be an array
  const newMeasures = normalizeNfmMeasuresPayload(payload.nfmSelectedMeasures)

  // Get previous measures from session
  const previousMeasures = normalizeNfmMeasuresPayload(
    sessionData?.[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]
  )

  // Process changes and clear data for removed measures
  if (previousMeasures.length > 0) {
    processNfmMeasureChanges(previousMeasures, newMeasures, payload)
  }

  // Convert array to comma-separated string for backend and session
  const measuresString = newMeasures.join(',')
  payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES] = measuresString
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
 * Process offline storage payload
 * @param {Object} payload - Request payload
 */
function processOfflineStorage(payload) {
  payload.nfmOfflineStorageVolume = convertEmptyToNull(
    payload.nfmOfflineStorageVolume
  )
  payload.nfmOfflineStorageArea = parseToFloat(payload.nfmOfflineStorageArea)
  payload.nfmOfflineStorageVolume = parseToFloat(
    payload.nfmOfflineStorageVolume
  )
}

/**
 * Process woodland payload
 * @param {Object} payload - Request payload
 */
function processWoodland(payload) {
  payload.nfmWoodlandArea = parseToFloat(payload.nfmWoodlandArea)
}

/**
 * Process and normalize payload based on step
 * @param {string} step - Current project step
 * @param {Object} payload - Request payload
 * @param {Object} sessionData - Session data for comparison (optional)
 */
export function processPayload(step, payload, sessionData) {
  switch (step) {
    case PROJECT_STEPS.NFM_SELECTED_MEASURES:
      processSelectedMeasures(payload, sessionData)
      break

    case PROJECT_STEPS.NFM_RIVER_RESTORATION:
      processRiverRestoration(payload)
      break

    case PROJECT_STEPS.NFM_LEAKY_BARRIERS:
      processLeakyBarriers(payload)
      break

    case PROJECT_STEPS.NFM_OFFLINE_STORAGE:
      processOfflineStorage(payload)
      break

    case PROJECT_STEPS.NFM_WOODLAND:
      processWoodland(payload)
      break

    // Add more cases for other NFM steps here
    default:
      break
  }
}
