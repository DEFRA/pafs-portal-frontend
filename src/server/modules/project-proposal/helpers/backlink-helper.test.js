import { describe, test, expect, beforeEach } from 'vitest'
import { getBacklink } from './backlink-helper.js'

describe('Backlink Helper', () => {
  let request

  beforeEach(() => {
    request = {
      t: (key) => {
        const translations = {
          'common.back_link': 'Back',
          'common.back_to_overview': 'Back to overview'
        }
        return translations[key] || key
      },
      params: {}
    }
  })

  describe('alwaysOverview option', () => {
    test('should return overview link when alwaysOverview is true and referenceNumber exists', () => {
      request.params.referenceNumber = 'REF-123-456'

      const result = getBacklink(request, { alwaysOverview: true })

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe(
        '/project-proposal/proposal-overview/REF-123-456'
      )
    })

    test('should return defaultUrl when alwaysOverview is true but no referenceNumber', () => {
      const result = getBacklink(request, {
        alwaysOverview: true,
        defaultUrl: '/custom-fallback'
      })

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe('/custom-fallback')
    })

    test('should use default "/" when alwaysOverview is true, no referenceNumber, and no defaultUrl', () => {
      const result = getBacklink(request, { alwaysOverview: true })

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe('/')
    })
  })

  describe('ignoreEditMode option', () => {
    test('should return defaultUrl when ignoreEditMode is true, even with referenceNumber', () => {
      request.params.referenceNumber = 'REF-123-456'

      const result = getBacklink(request, {
        ignoreEditMode: true,
        defaultUrl: '/custom-back'
      })

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/custom-back')
    })

    test('should return defaultUrl when ignoreEditMode is true without referenceNumber', () => {
      const result = getBacklink(request, {
        ignoreEditMode: true,
        defaultUrl: '/another-page'
      })

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/another-page')
    })

    test('should use custom defaultText when ignoreEditMode is true', () => {
      const result = getBacklink(request, {
        ignoreEditMode: true,
        defaultUrl: '/back',
        defaultText: 'Go back'
      })

      expect(result.text).toBe('Go back')
      expect(result.href).toBe('/back')
    })
  })

  describe('edit mode behavior (default)', () => {
    test('should return overview link when referenceNumber exists', () => {
      request.params.referenceNumber = 'REF-789-012'

      const result = getBacklink(request)

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe(
        '/project-proposal/proposal-overview/REF-789-012'
      )
    })

    test('should return overview link with custom defaultUrl when in edit mode', () => {
      request.params.referenceNumber = 'REF-789-012'

      const result = getBacklink(request, { defaultUrl: '/ignored-in-edit' })

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe(
        '/project-proposal/proposal-overview/REF-789-012'
      )
    })
  })

  describe('non-edit mode behavior (default)', () => {
    test('should return defaultUrl when no referenceNumber', () => {
      const result = getBacklink(request, { defaultUrl: '/start' })

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/start')
    })

    test('should use default "/" when no referenceNumber and no defaultUrl', () => {
      const result = getBacklink(request)

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/')
    })

    test('should use custom defaultText when not in edit mode', () => {
      const result = getBacklink(request, {
        defaultUrl: '/previous',
        defaultText: 'Previous page'
      })

      expect(result.text).toBe('Previous page')
      expect(result.href).toBe('/previous')
    })
  })

  describe('edge cases', () => {
    test('should handle referenceNumber with special characters', () => {
      request.params.referenceNumber = 'ANC/501/E/001'

      const result = getBacklink(request)

      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe(
        '/project-proposal/proposal-overview/ANC/501/E/001'
      )
    })

    test('should handle empty options object', () => {
      const result = getBacklink(request, {})

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/')
    })

    test('should prioritize alwaysOverview over ignoreEditMode when both are true', () => {
      request.params.referenceNumber = 'REF-123'

      const result = getBacklink(request, {
        alwaysOverview: true,
        ignoreEditMode: true
      })

      // alwaysOverview is checked first in the function
      expect(result.text).toBe('Back to overview')
      expect(result.href).toBe('/project-proposal/proposal-overview/REF-123')
    })

    test('should handle missing params object', () => {
      delete request.params

      const result = getBacklink(request, { defaultUrl: '/fallback' })

      expect(result.text).toBe('Back')
      expect(result.href).toBe('/fallback')
    })
  })
})
