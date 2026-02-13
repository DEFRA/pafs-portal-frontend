import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'

/**
 * Normalize risks payload to always be an array
 * Handles comma-separated strings and single values
 * @param {*} risks - Risks value from payload
 * @returns {Array} Normalized risks array
 */
export function normalizeRisksPayload(risks) {
  if (!risks) {
    return []
  }

  if (Array.isArray(risks)) {
    return risks
  }

  // If it's a comma-separated string, split it
  if (typeof risks === 'string' && risks.includes(',')) {
    return risks.split(',').filter((risk) => risk.trim())
  }

  return [risks]
}

/**
 * Clear coastal erosion property fields from payload
 * @param {object} payload - Request payload
 */
export function clearCoastalErosionFields(payload) {
  payload[
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL
  ] = null
  payload[
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
  ] = null
}

/**
 * Clear coastal erosion property fields AND the checkbox from payload
 * Used when risks change and coastal erosion is deselected
 * @param {object} payload - Request payload
 */
export function clearAllCoastalErosionFields(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK] = null
  clearCoastalErosionFields(payload)
}

/**
 * Clear flooding property fields from payload
 * @param {object} payload - Request payload
 */
export function clearFloodingFields(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS] = null
  payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS] = null
  payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50] = null
  payload[PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE] = null
}

/**
 * Clear flooding property fields AND the checkbox from payload
 * Used when risks change and flooding is deselected
 * @param {object} payload - Request payload
 */
export function clearAllFloodingFields(payload) {
  payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = null
  clearFloodingFields(payload)
}

/**
 * Process risk changes and clear related fields when risks change
 * @param {Array} previousRisks - Previous risks from session
 * @param {Array} newRisks - New risks from payload
 * @param {object} payload - Request payload to update
 */
export function processRiskChanges(previousRisks, newRisks, payload) {
  const hadCoastalErosion = previousRisks.includes(
    PROJECT_RISK_TYPES.COASTAL_EROSION
  )
  const hasCoastalErosion = newRisks.includes(
    PROJECT_RISK_TYPES.COASTAL_EROSION
  )

  const hadFloodRisks = previousRisks.some(
    (risk) => risk !== PROJECT_RISK_TYPES.COASTAL_EROSION
  )
  const hasFloodRisks = newRisks.some(
    (risk) => risk !== PROJECT_RISK_TYPES.COASTAL_EROSION
  )

  if (hadCoastalErosion && !hasCoastalErosion) {
    clearAllCoastalErosionFields(payload)
  }

  if (hadFloodRisks && !hasFloodRisks) {
    clearAllFloodingFields(payload)
  }
}

/**
 * Normalize and process no properties at risk checkbox
 * @param {object} payload - Request payload
 */
export function processNoPropertiesAtRiskCheckbox(payload) {
  if (payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]) {
    payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = true
    clearFloodingFields(payload)
  } else {
    payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = false
  }
}

/**
 * Normalize and process no properties at coastal erosion risk checkbox
 * @param {object} payload - Request payload
 */
export function processNoPropertiesCoastalErosionCheckbox(payload) {
  if (payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK]) {
    payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK] = true
    clearCoastalErosionFields(payload)
  } else {
    payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK] =
      false
  }
}

/**
 * Process payload based on step and normalize data
 * @param {string} step - Current step
 * @param {object} payload - Request payload
 * @param {object} sessionData - Session data
 */
export function processPayload(step, payload, sessionData) {
  // Normalize risks
  if (payload.risks) {
    payload.risks = normalizeRisksPayload(payload.risks)
  }

  // Handle risk changes
  if (step === PROJECT_STEPS.RISK) {
    const previousRisks = sessionData.risks || []
    const newRisks = payload.risks || []
    processRiskChanges(previousRisks, newRisks, payload)
  }

  // Handle property affected flooding
  if (step === PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING) {
    processNoPropertiesAtRiskCheckbox(payload)
  }

  // Handle property affected coastal erosion
  if (step === PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION) {
    processNoPropertiesCoastalErosionCheckbox(payload)
  }
}
