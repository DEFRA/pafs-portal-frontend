import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  parentAreasController,
  parentAreasPostController
} from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers.js')

const { getAreasByType, findAreaById, getParentAreas } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey } = await import('../helpers.js')

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

      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'EA Area')
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
})
