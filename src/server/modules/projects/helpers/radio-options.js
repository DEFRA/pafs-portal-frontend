/**
 * Radio Options Utility
 * Common functions to build GOV.UK Design System radio items
 * and retrieve labels for stored values.
 */

/**
 * Add hint text to a radio item if available in translations.
 *
 * @param {Object} item - The radio item object
 * @param {Function} t - i18next translate function
 * @param {string} optionsKeyPrefix - Translation key prefix
 * @param {string} key - The option key
 */
function addHintIfAvailable(item, t, optionsKeyPrefix, key) {
  const hintKey = `${optionsKeyPrefix}.${key}.hint`
  const hintText = t(hintKey)
  if (hintText !== hintKey) {
    item.hint = { text: hintText }
  }
}

/**
 * Build an array of GOV.UK radio items from translation keys.
 *
 * If the translation options contain a "divider" key, an "or" divider
 * is automatically inserted at that position.
 *
 * @param {Function} t - i18next translate function (request.t)
 * @param {string} optionsKeyPrefix - Translation key prefix for the options object
 *   e.g. 'projects.confidence_assessment.property_confidence.options'
 * @param {Object} [itemsMap] - Optional object mapping keys to custom values.
 *   If not provided, translation keys are used as values.
 *   e.g. { high: 'high', medium_high: 'medium_high', ... }
 * @param {string} currentValue - Currently selected value (for checked state)
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.useHints] - Whether to include hint text (default: false)
 * @param {boolean} [options.useBoldLabels] - Whether to make labels bold (default: false)
 * @returns {Array} Array of GOV.UK radio item objects
 */
export function buildRadioItems(
  t,
  optionsKeyPrefix,
  itemsMap,
  currentValue,
  options = {}
) {
  const { useHints = false, useBoldLabels = false } = options
  const items = []

  // Retrieve the full options object to detect divider keys
  const translationOptions = t(optionsKeyPrefix, { returnObjects: true })
  const translationKeys =
    typeof translationOptions === 'object'
      ? Object.keys(translationOptions)
      : []

  for (const key of translationKeys) {
    if (key === 'divider') {
      // Handle divider entries from the translation data
      items.push({ divider: t('common.or') })
    } else {
      // Use itemsMap value if provided, otherwise use the key itself
      const value = itemsMap?.[key] ?? key
      const labelKey = `${optionsKeyPrefix}.${key}.label`
      const labelText = t(labelKey)

      // If the label key returns itself, try without .label suffix (flat structure)
      const text =
        labelText === labelKey ? t(`${optionsKeyPrefix}.${key}`) : labelText

      const item = {
        value,
        checked: currentValue === value
      }

      // Use html property for bold labels, otherwise use text property
      if (useBoldLabels) {
        item.html = `<strong>${text}</strong>`
      } else {
        item.text = text
      }

      if (useHints) {
        addHintIfAvailable(item, t, optionsKeyPrefix, key)
      }

      items.push(item)
    }
  }

  return items
}

/**
 * Get the translated label for a given radio value.
 *
 * @param {Function} t - i18next translate function (request.t)
 * @param {string} optionsKeyPrefix - Translation key prefix for the options object
 * @param {Object} itemsMap - Object whose keys are the radio values
 * @param {string} value - The stored value to look up
 * @returns {string|null} The translated label, or null if not found
 */
export function getLabelForValue(t, optionsKeyPrefix, itemsMap, value) {
  if (!value) {
    return null
  }

  const key = Object.keys(itemsMap).find((k) => itemsMap[k] === value)
  if (!key) {
    return null
  }

  const labelKey = `${optionsKeyPrefix}.${key}.label`
  const labelText = t(labelKey)

  return labelText === labelKey ? t(`${optionsKeyPrefix}.${key}`) : labelText
}
