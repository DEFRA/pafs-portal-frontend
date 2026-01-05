/**
 * Parse JSON string, return default value on error
 * @param {string} str - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export function jsonParse(str, defaultValue = {}) {
  if (!str || typeof str !== 'string') {
    return defaultValue
  }

  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}
