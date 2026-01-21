import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  parentAreasController,
  parentAreasPostController
} from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers/session-helpers.js')
vi.mock('../helpers/view-data-helper.js')
vi.mock('../helpers/navigation-helper.js')

const { getAreasByType, findAreaById, getParentAreas } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey, buildGroupedAreas } =
  await import('../helpers/session-helpers.js')
const { addEditModeContext } = await import('../helpers/view-data-helper.js')
const { getEditModeContext } = await import('../helpers/navigation-helper.js')

describe('ParentAreasController', () => {
  let mockRequest
  let mockH
  let mockAreas

  beforeEach(() => {
    mockAreas = {
      EA: [
        { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
        { id: '2', name: 'Thames', area_type: 'EA', parent_id: null }
      ],
      PSO: [
        { id: '3', name: 'PSO West', area_type: 'PSO', parent_id: '1' },
        { id: '4', name: 'PSO East', area_type: 'PSO', parent_id: '2' }
      ],
      RMA: [{ id: '5', name: 'Bristol', area_type: 'RMA', parent_id: '3' }]
    }

    mockRequest = {
      path: '/request-account/parent-areas/ea',
      params: { type: 'ea' },
      payload: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
      },
      getAreas: vi.fn().mockResolvedValue(mockAreas),
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }

    getSessionKey.mockReturnValue('accountData')
    getAreasByType.mockReturnValue(mockAreas.EA)
    findAreaById.mockImplementation((areas, id) => {
      return Object.values(areas)
        .flat()
        .find((a) => a.id === id)
    })
    getParentAreas.mockReturnValue([])
    buildGroupedAreas.mockReturnValue(null)
    addEditModeContext.mockImplementation((req, viewData) => viewData)
    getEditModeContext.mockReturnValue({
      isEditMode: false,
      encodedId: null,
      baseRoutes: {}
    })
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('redirects to details if invalid responsibility/parent combination', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('renders parent areas view for PSO selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          isAdmin: false,
          responsibility: 'pso',
          parentType: 'EA'
        })
      )
    })

    test('renders parent areas view for RMA selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          responsibility: 'rma',
          parentType: 'EA'
        })
      )
    })

    test('renders parent areas view for RMA selecting PSO', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      getAreasByType.mockReturnValue(mockAreas.PSO)

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          responsibility: 'rma',
          parentType: 'PSO'
        })
      )
    })

    test('shows previously selected parent areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        eaAreas: ['1', '2']
      })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          selectedAreas: ['1', '2']
        })
      )
    })

    test('reverse engineers parent areas from main/additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [
          { areaId: '3', primary: true },
          { areaId: '4', primary: false }
        ]
      })
      getParentAreas.mockReturnValue(['1', '2'])

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('POST handler', () => {
    test('validates at least one parent area selected', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = {}

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          hasError: true
        })
      )
    })

    test('saves parent areas to session', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1', '2'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          eaAreas: ['1', '2']
        })
      )
    })

    test('handles single parent area selection', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: '1' }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          eaAreas: ['1']
        })
      )
    })

    test('redirects PSO to main area after EA selection', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects RMA to PSO parent areas after EA selection', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/parent-areas/pso'
      )
    })

    test('redirects RMA to main area after PSO selection', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['3'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects admin to admin routes', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })

    test('redirects admin RMA to admin PSO parent areas after EA selection', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/parent-areas/pso'
      )
    })

    test('shows validation error in admin context', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = {}

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          hasError: true
        })
      )
    })
  })

  describe('reverseEngineerParentAreas', () => {
    test('returns empty array when no areas selected', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: []
      })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          selectedAreas: []
        })
      )
    })

    test('reverse engineers EA parents for PSO areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [
          { areaId: '3', primary: true },
          { areaId: '4', primary: false }
        ]
      })
      getParentAreas.mockReturnValue([{ id: '1', name: 'Wessex' }])

      await parentAreasController.handler(mockRequest, mockH)

      expect(getParentAreas).toHaveBeenCalled()
    })

    test('reverse engineers EA parents for RMA areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        areas: [{ areaId: '5', primary: true }]
      })
      getParentAreas.mockReturnValue([{ id: '1', name: 'Wessex' }])

      await parentAreasController.handler(mockRequest, mockH)

      expect(getParentAreas).toHaveBeenCalled()
    })

    test('reverse engineers PSO parents for RMA areas', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        areas: [{ areaId: '5', primary: true }]
      })
      getParentAreas.mockReturnValue([{ id: '3', name: 'PSO West' }])

      await parentAreasController.handler(mockRequest, mockH)

      expect(getParentAreas).toHaveBeenCalled()
    })

    test('handles missing area in reverse engineering', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [{ areaId: 'nonexistent', primary: true }]
      })
      findAreaById.mockReturnValue(null)

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('buildGroupedParentAreas', () => {
    test('returns null for PSO selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          groupedParentAreas: null
        })
      )
    })

    test('returns null for RMA selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          groupedParentAreas: null
        })
      )
    })

    test('builds grouped areas for RMA selecting PSO', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        eaAreas: ['1', '2']
      })
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        return []
      })

      await parentAreasController.handler(mockRequest, mockH)

      // When parentType is 'pso', it should call getAreasByType with 'PSO Area'
      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'PSO Area')
    })

    test('returns null for RMA selecting PSO with no EA areas', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        eaAreas: []
      })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          groupedParentAreas: null
        })
      )
    })
  })

  describe('getParentType', () => {
    test('handles lowercase ea parameter', async () => {
      mockRequest.params.type = 'ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          parentType: 'EA'
        })
      )
    })

    test('handles lowercase pso parameter', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          parentType: 'PSO'
        })
      )
    })

    test('defaults to EA for invalid parameter', async () => {
      mockRequest.params.type = 'invalid'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          parentType: 'EA'
        })
      )
    })

    test('handles undefined parameter', async () => {
      mockRequest.params.type = undefined
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          parentType: 'EA'
        })
      )
    })
  })

  describe('getBackLink', () => {
    test('returns details link for PSO selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/request-account/details'
        })
      )
    })

    test('returns details link for RMA selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/request-account/details'
        })
      )
    })

    test('returns EA parent areas link for RMA selecting PSO', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/request-account/parent-areas/ea'
        })
      )
    })

    test('returns admin details link for admin PSO selecting EA', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/admin/user-account/details'
        })
      )
    })
  })

  describe('buildViewData', () => {
    test('builds correct translation base for PSO selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          translationBase: 'accounts.areas.pso.ea_areas'
        })
      )
    })

    test('builds correct translation base for RMA selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          translationBase: 'accounts.areas.rma.ea_areas'
        })
      )
    })

    test('builds correct translation base for RMA selecting PSO', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          translationBase: 'accounts.areas.rma.pso_areas'
        })
      )
    })
  })

  describe('Route handling edge cases', () => {
    test('redirects to next route after successful parent area selection for PSO', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects to next route after successful parent area selection for RMA selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/parent-areas/pso'
      )
    })

    test('redirects admin non-edit mode PSO to admin main area', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO'
      })
      mockRequest.payload = { parentAreas: ['1'] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })

    test('redirects in edit mode for RMA selecting PSO', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/pso'
      mockRequest.params = { type: 'pso', encodedId: 'test123' }
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA'
      })
      mockRequest.payload = { parentAreas: ['3'] }
      getEditModeContext.mockReturnValue({
        isEditMode: true,
        encodedId: 'test123',
        baseRoutes: {
          MAIN_AREA: '/admin/user-account/main-area/{encodedId}/edit'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area/test123/edit'
      )
    })
  })

  describe('Edit mode scenarios', () => {
    test('handles edit mode in GET request with encodedId', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.params = { type: 'ea', encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      getEditModeContext.mockReturnValue({
        isEditMode: true,
        encodedId: 'abc123',
        baseRoutes: {
          MAIN_AREA: '/admin/user-account/main-area/{encodedId}/edit'
        }
      })
      addEditModeContext.mockImplementation((req, viewData, routes) => ({
        ...viewData,
        isEditMode: true,
        cancelRoute: '/admin/users/abc123'
      }))

      await parentAreasController.handler(mockRequest, mockH)

      expect(addEditModeContext).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('redirects in edit mode for PSO selecting EA', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.params = { type: 'ea', encodedId: 'xyz789' }
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: true,
        encodedId: 'xyz789',
        baseRoutes: {
          MAIN_AREA: '/admin/user-account/main-area/{encodedId}/edit'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area/xyz789/edit'
      )
    })

    test('redirects in edit mode for RMA selecting EA to PSO parent areas', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.params = { type: 'ea', encodedId: 'def456' }
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: true,
        encodedId: 'def456',
        baseRoutes: {
          PARENT_AREAS_PSO:
            '/admin/user-account/parent-areas/pso/{encodedId}/edit'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/parent-areas/pso/def456/edit'
      )
    })
  })

  describe('Validation error handling with grouped areas', () => {
    test('shows validation error with grouped PSO areas for RMA', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        eaAreas: ['1', '2']
      })
      mockRequest.payload = {}
      getAreasByType.mockReturnValue(mockAreas.PSO)
      buildGroupedAreas.mockReturnValue([
        {
          parent: mockAreas.EA[0],
          children: [mockAreas.PSO[0]]
        }
      ])

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(buildGroupedAreas).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          hasError: true,
          groupedParentAreas: expect.any(Array)
        })
      )
    })

    test('shows validation error without grouped areas for PSO selecting EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = {}
      buildGroupedAreas.mockReturnValue(null)

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          hasError: true,
          groupedParentAreas: null
        })
      )
    })
  })

  describe('Admin redirect scenarios', () => {
    test('redirects to admin details for invalid combination', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account/details')
    })

    test('returns admin details link for admin RMA selecting EA', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/admin/user-account/details'
        })
      )
    })

    test('returns admin EA parent areas link for admin RMA selecting PSO', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          backLink: '/admin/user-account/parent-areas/ea'
        })
      )
    })
  })

  describe('Session data edge cases', () => {
    test('handles null session data gracefully', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('handles session data without responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({})

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('handles session data without areas array', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('getTargetAreaType edge cases', () => {
    test('returns null for invalid responsibility-parentType combination', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [{ areaId: '3', primary: true }]
      })
      mockRequest.params.type = 'pso'

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('getTranslationBase edge cases', () => {
    test('uses correct locale key for admin context', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          localeKey: 'add_user'
        })
      )
    })

    test('uses correct locale key for non-admin context', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          localeKey: 'request_account'
        })
      )
    })
  })

  describe('getSubmitRoute', () => {
    test('returns correct submit route for admin EA', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          submitRoute: '/admin/user-account/parent-areas/ea'
        })
      )
    })

    test('returns correct submit route for admin PSO', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          submitRoute: '/admin/user-account/parent-areas/pso'
        })
      )
    })

    test('returns correct submit route for non-admin EA', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          submitRoute: '/request-account/parent-areas/ea'
        })
      )
    })

    test('returns correct submit route for non-admin PSO', async () => {
      mockRequest.path = '/request-account/parent-areas/pso'
      mockRequest.params.type = 'pso'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          submitRoute: '/request-account/parent-areas/pso'
        })
      )
    })
  })

  describe('buildRoute with different contexts', () => {
    test('builds non-edit admin route correctly', async () => {
      mockRequest.path = '/admin/accounts/parent-areas/ea'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: false,
        encodedId: null,
        baseRoutes: {
          MAIN_AREA: '/admin/user-account/main-area'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })

    test('builds non-edit general route correctly', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: false,
        encodedId: null,
        baseRoutes: {
          MAIN_AREA: '/request-account/main-area'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })
  })

  describe('_getRoute method coverage', () => {
    test('handles route parameter replacement for type parameter', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: false,
        encodedId: null,
        baseRoutes: {
          PARENT_AREAS: '/request-account/parent-areas/{type}'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/parent-areas/pso'
      )
    })
  })

  describe('reverseEngineerParentAreas with null areas', () => {
    test('handles null selectedAreas parameter', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: null
      })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          selectedAreas: []
        })
      )
    })

    test('handles undefined selectedAreas parameter', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: undefined
      })

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          selectedAreas: []
        })
      )
    })
  })

  describe('POST with empty array normalization', () => {
    test('handles empty array in payload', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { parentAreas: [] }

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/parent-areas/index',
        expect.objectContaining({
          hasError: true
        })
      )
    })
  })

  describe('getBackLink default fallback', () => {
    test('returns default details link for invalid responsibility-parentType combination', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        parentType: 'EA'
      })
      mockRequest.params.type = 'ea'

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('getTranslationBase default fallback', () => {
    test('returns default translation base for invalid combination', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.params.type = 'ea'

      await parentAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('getNextRouteKey default fallback', () => {
    test('returns DETAILS for invalid responsibility-parentType in POST', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.params.type = 'invalid'
      mockRequest.payload = { parentAreas: ['1'] }
      getEditModeContext.mockReturnValue({
        isEditMode: false,
        encodedId: null,
        baseRoutes: {
          DETAILS: '/request-account/details'
        }
      })

      await parentAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })
  })
})
