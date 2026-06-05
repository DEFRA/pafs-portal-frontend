import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import {
  getSessionData,
  updateSessionData
} from '../../helpers/project-utils.js'

/**
 * Zero out specified fields in every session fundingValues row.
 * Called when a funding source is deselected so the estimated-spend page
 * does not render or submit stale values for that source.
 *
 * @param {object} request - Hapi request object
 * @param {string[]} fields - Array of field names to clear
 */
export function clearFundingValueFields(request, fields) {
  const sessionData = getSessionData(request)
  const fundingValues = sessionData[PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]
  if (!Array.isArray(fundingValues) || !fundingValues.length) {
    return
  }

  const updated = fundingValues.map((row) => {
    const copy = { ...row }
    for (const field of fields) {
      copy[field] = null
    }
    return copy
  })

  updateSessionData(request, {
    [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: updated
  })
}

/**
 * Sanitise all fields in a single fundingValues row.
 * - Converts the financialYear to a Number.
 * - Strips commas and trims whitespace from string values.
 * - Handles nested contributor arrays / objects, cleaning amount, name and
 *   contributorType sub-fields.
 *
 * @param {object} row - A single raw funding-value row from the form payload
 * @returns {object} Sanitised copy of the row
 */
export function sanitiseFundingValueRow(row) {
  const cleaned = { ...row }

  for (const [key, val] of Object.entries(cleaned)) {
    if (key === PROJECT_PAYLOAD_FIELDS.FINANCIAL_YEAR) {
      // Always store as a number for consistency with DB and template comparison
      cleaned[key] = Number(val) || 0
    } else if (typeof val === 'string') {
      cleaned[key] = val.replaceAll(',', '').trim()
    } else if (Array.isArray(val) || (val && typeof val === 'object')) {
      const normalisedArray = Array.isArray(val) ? val : Object.values(val)
      cleaned[key] = normalisedArray.map((item) => {
        if (!item || typeof item !== 'object') {
          return item
        }
        const out = { ...item }
        if (typeof out.amount === 'string') {
          out.amount = out.amount.replaceAll(',', '').trim()
        }
        if (typeof out.name === 'string') {
          out.name = out.name.trim()
        }
        if (typeof out.contributorType === 'string') {
          out.contributorType = out.contributorType.trim()
        }
        return out
      })
    } else {
      // Primitive non-string values (numbers, booleans) — keep as-is
    }
  }

  return cleaned
}

/**
 * Derive the aggregated source total fields (publicContributions,
 * privateContributions, otherEaContributions) from the per-contributor arrays
 * within a single row.  Only sets the total when > 0 so that empty/absent
 * contributor arrays leave the source field untouched.
 *
 * @param {object} row - A sanitised funding-value row
 * @returns {object} The same row with source total fields updated in place
 */
export function setSourceTotalsFromContributorArrays(row) {
  const toArray = (val) => {
    if (Array.isArray(val)) {
      return val
    }
    if (val && typeof val === 'object') {
      return Object.values(val)
    }
    return []
  }

  const sumAmounts = (arr = []) =>
    arr.reduce((sum, item) => {
      const amount = typeof item?.amount === 'string' ? item.amount.trim() : ''
      if (!amount) {
        return sum
      }
      try {
        return sum + BigInt(amount)
      } catch {
        return sum
      }
    }, 0n)

  const publicTotal = sumAmounts(toArray(row.publicContributors))
  if (publicTotal > 0n) {
    row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS] = `${publicTotal}`
  }

  const privateTotal = sumAmounts(toArray(row.privateContributors))
  if (privateTotal > 0n) {
    row[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS] = `${privateTotal}`
  }

  const otherEaTotal = sumAmounts(toArray(row.otherEaContributors))
  if (otherEaTotal > 0n) {
    row[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS] = `${otherEaTotal}`
  }

  return row
}

/**
 * Remove contributor entries that have an empty/missing amount so they
 * don't trigger Joi's `required()` check.  The form always posts hidden
 * name/contributorType fields for every contributor × every year — when
 * the user leaves the amount cell blank we should simply omit that entry
 * rather than fail validation.
 *
 * @param {object} row - A sanitised funding-value row
 * @returns {object} The same row with empty contributor entries removed
 */
export function stripEmptyContributorEntries(row) {
  const CONTRIBUTOR_ARRAY_KEYS = [
    'publicContributors',
    'privateContributors',
    'otherEaContributors'
  ]
  for (const key of CONTRIBUTOR_ARRAY_KEYS) {
    const arr = row[key]
    if (!Array.isArray(arr)) {
      continue
    }
    row[key] = arr.filter((item) => {
      if (!item || typeof item !== 'object') {
        return false
      }
      const amt = typeof item.amount === 'string' ? item.amount.trim() : ''
      return amt !== ''
    })
    // If the array is now empty, remove the key entirely so the
    // optional Joi array schema doesn't iterate over zero items.
    if (row[key].length === 0) {
      delete row[key]
    }
  }
  return row
}

/**
 * Check whether a contributor entry has a non-empty amount.
 * @private
 */
function isContributorEntryPopulated(item) {
  if (!item || typeof item !== 'object') {
    return false
  }
  const amt = typeof item.amount === 'string' ? item.amount.trim() : ''
  return amt !== ''
}

/**
 * Filter a single contributor array, keeping only entries with non-empty
 * amounts and returning a mapping from kept indices to original indices.
 * @private
 */
function filterContributorArray(arr) {
  const kept = []
  const mapping = []

  for (let i = 0; i < arr.length; i++) {
    if (isContributorEntryPopulated(arr[i])) {
      mapping.push(i)
      kept.push(arr[i])
    }
  }

  return { kept, mapping }
}

/**
 * Like {@link stripEmptyContributorEntries} but also returns a mapping from
 * stripped (post-filter) indices back to the original (pre-filter) indices.
 * This is needed so that Joi validation errors (which reference the stripped
 * array positions) can be translated back to the original contributor
 * positions used in the template.
 *
 * @param {object} inputRow - A sanitised funding-value row (not mutated)
 * @returns {{ row: object, indexMaps: Object<string, number[]> }}
 */
export function stripEmptyContributorEntriesWithMapping(inputRow) {
  const CONTRIBUTOR_ARRAY_KEYS = [
    'publicContributors',
    'privateContributors',
    'otherEaContributors'
  ]
  const row = { ...inputRow }
  const indexMaps = {}

  for (const key of CONTRIBUTOR_ARRAY_KEYS) {
    const arr = row[key]
    if (!Array.isArray(arr)) {
      continue
    }

    const { kept, mapping } = filterContributorArray(arr)
    indexMaps[key] = mapping

    if (kept.length === 0) {
      delete row[key]
    } else {
      row[key] = kept
    }
  }

  return { row, indexMaps }
}

/**
 * Convert "0" values to empty strings in funding value rows so that zeros
 * are not persisted to the backend.  A row whose values are ALL zero is
 * treated as having no data; individual zero cells in a row that has other
 * non-zero values are simply stripped.
 *
 * Call this AFTER validation but BEFORE saving to session / backend.
 *
 * @param {object[]} rows - Array of funding value row objects
 * @returns {object[]} Rows with "0" amounts replaced by empty strings
 */
export function sanitiseZerosFromValidatedRows(rows) {
  const SPEND_FIELDS = [
    'fcermGia',
    'localLevy',
    'publicContributions',
    'privateContributions',
    'otherEaContributions',
    'notYetIdentified',
    'assetReplacementAllowance',
    'environmentStatutoryFunding',
    'frequentlyFloodedCommunities',
    'otherAdditionalGrantInAid',
    'otherGovernmentDepartment',
    'recovery',
    'summerEconomicFund',
    'total'
  ]
  const CONTRIBUTOR_ARRAY_KEYS = [
    'publicContributors',
    'privateContributors',
    'otherEaContributors'
  ]

  return rows.map((row) => {
    const copy = { ...row }

    for (const field of SPEND_FIELDS) {
      if (copy[field] === '0') {
        copy[field] = ''
      }
    }

    for (const key of CONTRIBUTOR_ARRAY_KEYS) {
      const arr = copy[key]
      if (!Array.isArray(arr)) {
        continue
      }
      copy[key] = arr
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return item
          }
          const amt = typeof item.amount === 'string' ? item.amount.trim() : ''
          if (amt === '0') {
            return { ...item, amount: '' }
          }
          return item
        })
        .filter((item) => {
          if (!item || typeof item !== 'object') {
            return false
          }
          const amt = typeof item.amount === 'string' ? item.amount.trim() : ''
          return amt !== ''
        })
      if (copy[key].length === 0) {
        delete copy[key]
      }
    }

    return copy
  })
}

/**
 * Recursively convert objects whose keys are all numeric strings
 * (e.g. { '0': …, '1': … }) into proper arrays.
 *
 * @param {*} obj - Value to convert
 * @returns {*} Converted value with numeric-keyed objects replaced by arrays
 */
export function numericKeysToArrays(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  const keys = Object.keys(obj)
  const allNumeric = keys.length > 0 && keys.every((k) => /^\d+$/.test(k))

  if (allNumeric) {
    const sorted = keys.toSorted((a, b) => Number(a) - Number(b))
    return sorted.map((k) => numericKeysToArrays(obj[k]))
  }

  const result = {}
  for (const [key, val] of Object.entries(obj)) {
    result[key] = numericKeysToArrays(val)
  }
  return result
}

/**
 * Try to parse already-nested fundingValues from the payload.
 * Returns an array if successful, or null if the value is not array/object.
 * @private
 */
function _parseNestedFundingValues(raw) {
  if (Array.isArray(raw)) {
    return raw
  }
  if (typeof raw === 'object') {
    return Object.values(raw)
  }
  return null
}

/**
 * Reconstruct a nested fundingValues object from flat bracket-notation keys.
 * e.g. `fundingValues[0][financialYear]` → { '0': { financialYear: … } }
 * @private
 */
function _extractBracketSegments(key, bracketRe) {
  const segments = []
  let match
  while ((match = bracketRe.exec(key)) !== null) {
    segments.push(match[1])
  }
  bracketRe.lastIndex = 0
  return segments
}

function _setNestedValue(root, segments, value) {
  let current = root
  for (let i = 0; i < segments.length - 1; i++) {
    if (current[segments[i]] === undefined) {
      current[segments[i]] = {}
    }
    current = current[segments[i]]
  }
  current[segments.at(-1)] = value
}

function _buildRootFromBracketKeys(payload) {
  const bracketRe = /\[(\w+)\]/g
  const root = {}

  for (const [key, value] of Object.entries(payload)) {
    if (key.startsWith('fundingValues[')) {
      const segments = _extractBracketSegments(key, bracketRe)
      if (segments.length > 0) {
        _setNestedValue(root, segments, value)
      }
    }
  }

  return root
}

/**
 * Parse the fundingValues array from a Hapi payload.
 *
 * Hapi's default payload parser uses Node's built-in `querystring` module
 * which does NOT support bracket notation.  Keys like
 * `fundingValues[0][financialYear]` stay as flat strings in the payload
 * rather than being parsed into nested objects.
 *
 * This function handles both cases:
 *   1. Already-parsed nested data (if a qs-like parser was configured)
 *   2. Flat bracket-notation keys (default Hapi/subtext behaviour)
 *
 * @param {object|null} payload - Raw Hapi request payload
 * @returns {Array} Parsed array of funding value rows
 */
export function parseFundingValuesPayload(payload) {
  if (!payload) {
    return []
  }

  // 1. If a nested parser (qs) already created `payload.fundingValues`
  if (payload.fundingValues) {
    const result = _parseNestedFundingValues(payload.fundingValues)
    if (result) {
      return result
    }
  }

  // 2. Reconstruct from flat bracket-notation keys produced by
  //    Node's built-in `querystring.parse`.
  const root = _buildRootFromBracketKeys(payload)

  if (Object.keys(root).length === 0) {
    return []
  }

  // Convert numeric-keyed objects → arrays at every depth
  return numericKeysToArrays(root)
}

/**
 * Parse contributors from an array-like payload value.
 *
 * @param {*} raw - Raw contributors value from payload
 * @param {string[]} sessionContributors - Session baseline
 * @returns {string[]|null} Array of contributors or null if not array-like
 */
function _parseArrayContributors(raw, sessionContributors) {
  if (!Array.isArray(raw)) {
    return null
  }
  const baselineLength = Math.max(raw.length, sessionContributors.length, 1)
  return Array.from({ length: baselineLength }, (_, i) =>
    typeof raw[i] === 'string' ? raw[i] : ''
  )
}

/**
 * Parse contributors from an object-keyed payload value.
 *
 * @param {*} raw - Raw contributors value from payload
 * @param {string[]} sessionContributors - Session baseline
 * @returns {string[]|null} Array of contributors or null if not object-like
 */
function _parseObjectContributors(raw, sessionContributors) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const numericKeys = Object.keys(raw)
    .filter((k) => /^\d+$/.test(k))
    .map(Number)
  const highestIndex = numericKeys.length ? Math.max(...numericKeys) : -1
  const baselineLength = Math.max(
    highestIndex + 1,
    sessionContributors.length,
    1
  )
  return Array.from({ length: baselineLength }, (_, i) => {
    const value = raw[String(i)]
    return typeof value === 'string' ? value : ''
  })
}

/**
 * Parse contributors from top-level bracket-notation keys.
 *
 * @param {object} payload - Raw payload object
 * @param {string[]} sessionContributors - Session baseline
 * @returns {string[]|null} Array of contributors or null if no bracket keys found
 */
function _parseBracketContributors(payload, sessionContributors) {
  const topLevelContributorEntries = Object.entries(payload || {}).filter(
    ([key]) => /^contributors\[\d+\]$/.test(key)
  )
  if (!topLevelContributorEntries.length) {
    return null
  }
  const indices = topLevelContributorEntries
    .map(([key]) => {
      const match = /^contributors\[(\d+)\]$/.exec(key)
      return Number(match?.[1])
    })
    .filter((i) => Number.isInteger(i))
  const highestIndex = indices.length ? Math.max(...indices) : -1
  const baselineLength = Math.max(
    highestIndex + 1,
    sessionContributors.length,
    1
  )
  return Array.from({ length: baselineLength }, (_, i) => {
    const value = payload[`contributors[${i}]`]
    return typeof value === 'string' ? value : ''
  })
}

/**
 * Parse contributors payload from a Hapi request payload.
 * Supports array/object forms and preserves empty slots that may be stripped
 * by the payload parser, using the session contributor count as a baseline.
 *
 * @param {object|null} payload - Raw Hapi request payload
 * @param {string[]} sessionContributors - Existing contributor names from session
 * @returns {string[]} Array of contributor name strings (may include empties)
 */
export function parseContributorsPayload(payload, sessionContributors = ['']) {
  const raw = payload?.contributors

  const arrayResult = _parseArrayContributors(raw, sessionContributors)
  if (arrayResult) {
    return arrayResult
  }

  const objectResult = _parseObjectContributors(raw, sessionContributors)
  if (objectResult) {
    return objectResult
  }

  const bracketResult = _parseBracketContributors(payload, sessionContributors)
  if (bracketResult) {
    return bracketResult
  }

  const baselineLength = Math.max(sessionContributors.length, 1)
  return Array.from({ length: baselineLength }, () => '')
}
