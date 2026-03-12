import {
  NFM_LAND_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  NFM_MEASURES
} from '../../../../common/constants/projects.js'

/**
 * Config mapping each land-use type to its before/after payload fields.
 * Used to clear and process land-use data generically.
 */
const LAND_TYPE_FIELD_CONFIG = [
  {
    landType: NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND
  },
  {
    landType: NFM_LAND_TYPES.ENCLOSED_LIVESTOCK_FARMLAND,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND
  },
  {
    landType: NFM_LAND_TYPES.ENCLOSED_DAIRYING_FARMLAND,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND
  },
  {
    landType: NFM_LAND_TYPES.SEMI_NATURAL_GRASSLAND,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND
  },
  {
    landType: NFM_LAND_TYPES.WOODLAND,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_WOODLAND
  },
  {
    landType: NFM_LAND_TYPES.MOUNTAIN_MOORS_AND_HEATH,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH
  },
  {
    landType: NFM_LAND_TYPES.PEATLAND_RESTORATION,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION
  },
  {
    landType: NFM_LAND_TYPES.RIVERS_WETLANDS_FRESHWATER_HABITATS,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER
  },
  {
    landType: NFM_LAND_TYPES.COASTAL_MARGINS,
    beforeField: PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_BEFORE,
    afterField: PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_AFTER,
    step: PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS
  }
]

/** Quick lookup from step → field config */
const STEP_TO_LAND_TYPE_FIELD_CONFIG = Object.fromEntries(
  LAND_TYPE_FIELD_CONFIG.map((c) => [c.step, c])
)

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
 * Clear runoff management data from payload
 * @param {Object} payload - Request payload
 */
function clearRunoffManagementData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME] = null
}

/**
 * Clear saltmarsh data from payload
 * @param {Object} payload - Request payload
 */
function clearSaltmarshData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH] = null
}

/**
 * Clear sand dune data from payload
 * @param {Object} payload - Request payload
 */
function clearSandDuneData(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA] = null
  payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH] = null
}

/**
 * Clear land-use detail data for a given land type from payload
 * @param {Object} payload - Request payload
 * @param {string} landType - NFM_LAND_TYPES value
 */
function clearLandUseDetailData(payload, landType) {
  const config = LAND_TYPE_FIELD_CONFIG.find((c) => c.landType === landType)
  if (config) {
    payload[config.beforeField] = null
    payload[config.afterField] = null
  }
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
      case NFM_MEASURES.RUNOFF_MANAGEMENT:
        clearRunoffManagementData(payload)
        break
      case NFM_MEASURES.SALTMARSH_MANAGEMENT:
        clearSaltmarshData(payload)
        break
      case NFM_MEASURES.SAND_DUNE_MANAGEMENT:
        clearSandDuneData(payload)
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

function processLandUseChange(payload, sessionData) {
  const newLandTypes = normalizeNfmMeasuresPayload(payload.nfmLandUseChange)
  const previousLandTypes = normalizeNfmMeasuresPayload(
    sessionData?.[PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]
  )

  // Clear data for any land types that have been deselected
  previousLandTypes.forEach((landType) => {
    if (!newLandTypes.includes(landType)) {
      clearLandUseDetailData(payload, landType)
    }
  })

  payload[PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE] = newLandTypes.join(',')
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
 * Process runoff management payload
 * @param {Object} payload - Request payload
 */
function processRunoffManagement(payload) {
  payload.nfmRunoffManagementVolume = convertEmptyToNull(
    payload.nfmRunoffManagementVolume
  )
  payload.nfmRunoffManagementArea = parseToFloat(
    payload.nfmRunoffManagementArea
  )
  payload.nfmRunoffManagementVolume = parseToFloat(
    payload.nfmRunoffManagementVolume
  )
}

/**
 * Process saltmarsh payload
 * @param {Object} payload - Request payload
 */
function processSaltmarsh(payload) {
  payload.nfmSaltmarshLength = convertEmptyToNull(payload.nfmSaltmarshLength)
  payload.nfmSaltmarshArea = parseToFloat(payload.nfmSaltmarshArea)
  payload.nfmSaltmarshLength = parseToFloat(payload.nfmSaltmarshLength)
}

/**
 * Process sand dune payload
 * @param {Object} payload - Request payload
 */
function processSandDune(payload) {
  payload.nfmSandDuneLength = convertEmptyToNull(payload.nfmSandDuneLength)
  payload.nfmSandDuneArea = parseToFloat(payload.nfmSandDuneArea)
  payload.nfmSandDuneLength = parseToFloat(payload.nfmSandDuneLength)
}

/**
 * Process land-use detail payload for any land type step.
 * Converts before/after string values to floats.
 * @param {Object} payload - Request payload
 * @param {string} step - Current project step
 */
function processLandUseDetailData(payload, step) {
  const config = STEP_TO_LAND_TYPE_FIELD_CONFIG[step]
  if (!config) {
    return
  }
  payload[config.beforeField] = parseToFloat(payload[config.beforeField])
  payload[config.afterField] = parseToFloat(payload[config.afterField])
}

/**
 * Process and normalize payload based on step
 * @param {string} step - Current project step
 * @param {Object} payload - Request payload
 * @param {Object} sessionData - Session data for comparison (optional)
 */
export function processPayload(step, payload, sessionData) {
  const measureHandlers = {
    [PROJECT_STEPS.NFM_SELECTED_MEASURES]: () =>
      processSelectedMeasures(payload, sessionData),
    [PROJECT_STEPS.NFM_RIVER_RESTORATION]: () =>
      processRiverRestoration(payload),
    [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: () => processLeakyBarriers(payload),
    [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: () => processOfflineStorage(payload),
    [PROJECT_STEPS.NFM_WOODLAND]: () => processWoodland(payload),
    [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: () =>
      processRunoffManagement(payload),
    [PROJECT_STEPS.NFM_SALTMARSH]: () => processSaltmarsh(payload),
    [PROJECT_STEPS.NFM_SAND_DUNE]: () => processSandDune(payload),
    [PROJECT_STEPS.NFM_LAND_USE_CHANGE]: () =>
      processLandUseChange(payload, sessionData)
  }

  if (step in measureHandlers) {
    measureHandlers[step]()
    return
  }

  // All land-use detail steps use the generic handler
  if (step in STEP_TO_LAND_TYPE_FIELD_CONFIG) {
    processLandUseDetailData(payload, step)
  }
}
