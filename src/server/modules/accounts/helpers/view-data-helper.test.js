import { describe, test, expect } from 'vitest'
import { addEditModeContext } from './view-data-helper.js'
import { ROUTES } from '../../../common/constants/routes.js'

describe('view-data-helper', () => {
  describe('addEditModeContext', () => {
    test('returns unchanged viewData when not in edit mode', () => {
      const request = { params: {} }
      const viewData = {
        pageTitle: 'Test Page',
        submitRoute: '/submit'
      }
      const routes = { editRoute: '/edit/{encodedId}' }

      const result = addEditModeContext(request, viewData, routes)

      expect(result).toEqual(viewData)
      expect(result.isEditMode).toBeUndefined()
      expect(result.cancelRoute).toBeUndefined()
    })

    test('adds edit mode context when encodedId present', () => {
      const request = { params: { encodedId: 'abc123' } }
      const viewData = {
        pageTitle: 'Test Page',
        submitRoute: '/submit'
      }
      const routes = { editRoute: '/edit/{encodedId}/submit' }

      const result = addEditModeContext(request, viewData, routes)

      expect(result.isEditMode).toBe(true)
      expect(result.cancelRoute).toBe(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'abc123')
      )
      expect(result.submitRoute).toBe('/edit/abc123/submit')
    })

    test('adds edit mode flag and cancel route but not submitRoute when routes not provided', () => {
      const request = { params: { encodedId: 'xyz789' } }
      const viewData = {
        pageTitle: 'Test Page',
        submitRoute: '/submit'
      }

      const result = addEditModeContext(request, viewData)

      expect(result.isEditMode).toBe(true)
      expect(result.cancelRoute).toBe(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'xyz789')
      )
      expect(result.submitRoute).toBe('/submit')
    })

    test('does not update submitRoute when editRoute not in routes object', () => {
      const request = { params: { encodedId: 'abc123' } }
      const viewData = {
        pageTitle: 'Test Page',
        submitRoute: '/submit'
      }
      const routes = {}

      const result = addEditModeContext(request, viewData, routes)

      expect(result.isEditMode).toBe(true)
      expect(result.cancelRoute).toBe(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'abc123')
      )
      expect(result.submitRoute).toBe('/submit')
    })

    test('handles empty routes object', () => {
      const request = { params: { encodedId: 'test123' } }
      const viewData = {
        pageTitle: 'Test Page'
      }
      const routes = {}

      const result = addEditModeContext(request, viewData, routes)

      expect(result.isEditMode).toBe(true)
      expect(result.cancelRoute).toBe(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', 'test123')
      )
    })

    test('preserves all original viewData properties', () => {
      const request = { params: { encodedId: 'abc123' } }
      const viewData = {
        pageTitle: 'Test Page',
        submitRoute: '/submit',
        errors: { field: 'error' },
        customProp: 'value',
        nestedData: { key: 'value' }
      }
      const routes = { editRoute: '/edit/{encodedId}' }

      const result = addEditModeContext(request, viewData, routes)

      expect(result.pageTitle).toBe('Test Page')
      expect(result.errors).toEqual({ field: 'error' })
      expect(result.customProp).toBe('value')
      expect(result.nestedData).toEqual({ key: 'value' })
    })

    test('handles null/undefined params gracefully', () => {
      const request = { params: null }
      const viewData = { pageTitle: 'Test' }

      const result = addEditModeContext(request, viewData)

      expect(result).toEqual(viewData)
      expect(result.isEditMode).toBeUndefined()
    })

    test('handles undefined params object', () => {
      const request = {}
      const viewData = { pageTitle: 'Test' }

      const result = addEditModeContext(request, viewData)

      expect(result).toEqual(viewData)
    })

    test('replaces {encodedId} placeholder correctly', () => {
      const request = { params: { encodedId: 'special-id-123' } }
      const viewData = { pageTitle: 'Test' }
      const routes = {
        editRoute: '/admin/accounts/edit/{encodedId}/details'
      }

      const result = addEditModeContext(request, viewData, routes)

      expect(result.submitRoute).toBe(
        '/admin/accounts/edit/special-id-123/details'
      )
    })
  })
})
