import { describe, test, expect, vi } from 'vitest'
import { buildRadioItems, getLabelForValue } from './radio-options.js'

describe('radio-options', () => {
  describe('buildRadioItems', () => {
    const mockT = vi.fn((key, options) => {
      if (options?.returnObjects) {
        // Return the translation options object structure
        const optionsMap = {
          'projects.urgency.options': {
            not_urgent: { label: 'Not urgent' },
            divider: '',
            statutory_need: { label: 'Statutory need' },
            legal_need: { label: 'Legal need' }
          },
          'projects.confidence.options': {
            high: { label: 'High', hint: 'High confidence hint' },
            medium_high: {
              label: 'Medium High',
              hint: 'Medium high hint'
            },
            medium: { label: 'Medium', hint: 'Medium hint' },
            low: { label: 'Low', hint: 'Low hint' }
          },
          'projects.flat.options': {
            option_a: 'Option A text',
            option_b: 'Option B text'
          }
        }
        return optionsMap[key] || key
      }

      // Regular translation lookups
      const translations = {
        'common.or': 'or',
        'projects.urgency.options.not_urgent.label': 'Not urgent',
        'projects.urgency.options.statutory_need.label': 'Statutory need',
        'projects.urgency.options.legal_need.label': 'Legal need',
        'projects.confidence.options.high.label': 'High',
        'projects.confidence.options.high.hint': 'High confidence hint',
        'projects.confidence.options.medium_high.label': 'Medium High',
        'projects.confidence.options.medium_high.hint': 'Medium high hint',
        'projects.confidence.options.medium.label': 'Medium',
        'projects.confidence.options.medium.hint': 'Medium hint',
        'projects.confidence.options.low.label': 'Low',
        'projects.confidence.options.low.hint': 'Low hint',
        'projects.flat.options.option_a.label':
          'projects.flat.options.option_a.label',
        'projects.flat.options.option_a': 'Option A text',
        'projects.flat.options.option_b.label':
          'projects.flat.options.option_b.label',
        'projects.flat.options.option_b': 'Option B text'
      }
      return translations[key] || key
    })

    test('should build basic radio items from itemsMap', () => {
      const itemsMap = {
        not_urgent: 'not_urgent',
        statutory_need: 'statutory_need',
        legal_need: 'legal_need'
      }

      const result = buildRadioItems(
        mockT,
        'projects.urgency.options',
        itemsMap,
        null
      )

      // 3 items + 1 divider
      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({
        value: 'not_urgent',
        text: 'Not urgent',
        checked: false
      })
      expect(result[1]).toEqual({ divider: 'or' })
      expect(result[2]).toEqual({
        value: 'statutory_need',
        text: 'Statutory need',
        checked: false
      })
      expect(result[3]).toEqual({
        value: 'legal_need',
        text: 'Legal need',
        checked: false
      })
    })

    test('should set checked state for the current value', () => {
      const itemsMap = {
        not_urgent: 'not_urgent',
        statutory_need: 'statutory_need',
        legal_need: 'legal_need'
      }

      const result = buildRadioItems(
        mockT,
        'projects.urgency.options',
        itemsMap,
        'statutory_need'
      )

      expect(result[0].checked).toBe(false)
      expect(result[2].checked).toBe(true)
      expect(result[3].checked).toBe(false)
    })

    test('should include hint text when useHints is true', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        'high',
        { useHints: true }
      )

      expect(result).toHaveLength(4)
      expect(result[0].hint).toEqual({ text: 'High confidence hint' })
      expect(result[0].checked).toBe(true)
      expect(result[1].hint).toEqual({ text: 'Medium high hint' })
      expect(result[2].hint).toEqual({ text: 'Medium hint' })
      expect(result[3].hint).toEqual({ text: 'Low hint' })
    })

    test('should not include hints when useHints is false', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null,
        { useHints: false }
      )

      result.forEach((item) => {
        expect(item.hint).toBeUndefined()
      })
    })

    test('should fall back to flat key when .label key returns itself', () => {
      const itemsMap = {
        option_a: 'a_value',
        option_b: 'b_value'
      }

      const result = buildRadioItems(
        mockT,
        'projects.flat.options',
        itemsMap,
        null
      )

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe('Option A text')
      expect(result[1].text).toBe('Option B text')
    })

    test('should insert divider from translation data', () => {
      const itemsMap = {
        not_urgent: 'not_urgent',
        statutory_need: 'statutory_need',
        legal_need: 'legal_need'
      }

      const result = buildRadioItems(
        mockT,
        'projects.urgency.options',
        itemsMap,
        null
      )

      const dividers = result.filter((item) => item.divider)
      expect(dividers).toHaveLength(1)
      expect(dividers[0].divider).toBe('or')
    })

    test('should build all items from translations when itemsMap is partial', () => {
      // itemsMap only has 'not_urgent', but translation has more
      // Now all translation keys are used, with itemsMap providing custom values where available
      const itemsMap = {
        not_urgent: 'not_urgent'
      }

      const result = buildRadioItems(
        mockT,
        'projects.urgency.options',
        itemsMap,
        null
      )

      // All translation keys are included: not_urgent, statutory_need, legal_need + divider
      const radioItems = result.filter((item) => !item.divider)
      expect(radioItems).toHaveLength(3)
      expect(radioItems[0].value).toBe('not_urgent') // from itemsMap
      expect(radioItems[1].value).toBe('statutory_need') // fallback to key
      expect(radioItems[2].value).toBe('legal_need') // fallback to key
    })

    test('should handle non-object translation options gracefully', () => {
      const nonObjectT = vi.fn((key, options) => {
        if (options?.returnObjects) {
          return 'not_an_object'
        }
        return key
      })

      const result = buildRadioItems(
        nonObjectT,
        'projects.missing.options',
        { a: 'a' },
        null
      )

      expect(result).toEqual([])
    })

    test('should not include hint when hint key returns itself', () => {
      const noHintT = vi.fn((key, options) => {
        if (options?.returnObjects) {
          return { item_a: { label: 'Item A' } }
        }
        const translations = {
          'prefix.item_a.label': 'Item A',
          'prefix.item_a.hint': 'prefix.item_a.hint'
        }
        return translations[key] || key
      })

      const result = buildRadioItems(
        noHintT,
        'prefix',
        { item_a: 'val_a' },
        null,
        { useHints: true }
      )

      expect(result).toHaveLength(1)
      expect(result[0].hint).toBeUndefined()
    })

    test('should default useHints to false when no options provided', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null
      )

      result.forEach((item) => {
        expect(item.hint).toBeUndefined()
      })
    })

    test('should use html property with bold labels when useBoldLabels is true', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null,
        { useBoldLabels: true }
      )

      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({
        value: 'high',
        html: '<strong>High</strong>',
        checked: false
      })
      expect(result[1]).toEqual({
        value: 'medium_high',
        html: '<strong>Medium High</strong>',
        checked: false
      })
      // Should not have text property when using html
      expect(result[0].text).toBeUndefined()
      expect(result[1].text).toBeUndefined()
    })

    test('should use text property when useBoldLabels is false', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null,
        { useBoldLabels: false }
      )

      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({
        value: 'high',
        text: 'High',
        checked: false
      })
      expect(result[1]).toEqual({
        value: 'medium_high',
        text: 'Medium High',
        checked: false
      })
      // Should not have html property when using text
      expect(result[0].html).toBeUndefined()
      expect(result[1].html).toBeUndefined()
    })

    test('should combine useBoldLabels with useHints', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null,
        { useBoldLabels: true, useHints: true }
      )

      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({
        value: 'high',
        html: '<strong>High</strong>',
        checked: false,
        hint: { text: 'High confidence hint' }
      })
      expect(result[1]).toEqual({
        value: 'medium_high',
        html: '<strong>Medium High</strong>',
        checked: false,
        hint: { text: 'Medium high hint' }
      })
    })

    test('should default useBoldLabels to false when not provided', () => {
      const itemsMap = {
        high: 'high',
        medium_high: 'medium_high',
        medium: 'medium',
        low: 'low'
      }

      const result = buildRadioItems(
        mockT,
        'projects.confidence.options',
        itemsMap,
        null,
        { useHints: true }
      )

      expect(result).toHaveLength(4)
      expect(result[0].text).toBe('High')
      expect(result[0].html).toBeUndefined()
    })
  })

  describe('getLabelForValue', () => {
    const mockT = vi.fn((key) => {
      const translations = {
        'projects.confidence.options.high.label': 'High',
        'projects.confidence.options.medium.label': 'Medium',
        'projects.flat.options.option_a.label':
          'projects.flat.options.option_a.label',
        'projects.flat.options.option_a': 'Option A text'
      }
      return translations[key] || key
    })

    test('should return the label for a matching value', () => {
      const itemsMap = { high: 'high', medium: 'medium' }

      const result = getLabelForValue(
        mockT,
        'projects.confidence.options',
        itemsMap,
        'high'
      )

      expect(result).toBe('High')
    })

    test('should return null for null value', () => {
      const result = getLabelForValue(mockT, 'prefix', { a: 'a' }, null)
      expect(result).toBeNull()
    })

    test('should return null for undefined value', () => {
      const result = getLabelForValue(mockT, 'prefix', { a: 'a' }, undefined)
      expect(result).toBeNull()
    })

    test('should return null for empty string value', () => {
      const result = getLabelForValue(mockT, 'prefix', { a: 'a' }, '')
      expect(result).toBeNull()
    })

    test('should return null when value is not found in itemsMap', () => {
      const itemsMap = { high: 'high', medium: 'medium' }

      const result = getLabelForValue(
        mockT,
        'projects.confidence.options',
        itemsMap,
        'unknown_value'
      )

      expect(result).toBeNull()
    })

    test('should fall back to flat key when .label key returns itself', () => {
      const itemsMap = { option_a: 'a_value' }

      const result = getLabelForValue(
        mockT,
        'projects.flat.options',
        itemsMap,
        'a_value'
      )

      expect(result).toBe('Option A text')
    })
  })
})
