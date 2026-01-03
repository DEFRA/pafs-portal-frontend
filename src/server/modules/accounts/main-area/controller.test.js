import { describe, test, expect, beforeEach, vi } from 'vitest'
import { mainAreaController, mainAreaPostController } from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getSessionKey: vi.fn()
  }
})
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../schema.js')

const { getAreasByType, findAreaById } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey } = await import('../helpers.js')
const { extractJoiErrors } =
  await import('../../../common/helpers/error-renderer/index.js')
const { mainAreaSchema } = await import('../schema.js')

describe('MainAreaController', () => {
  let mockRequest
  let mockH
  let mockAreas

  beforeEach(() => {
    mockAreas = {
      EA: [
        { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
        { id: '2', name: 'Thames', area_type: 'EA', parent_id: null }
      ],
      PSO: [{ id: '3', name: 'PSO West', area_type: 'PSO', parent_id: '1' }],
      RMA: [{ id: '4', name: 'Bristol', area_type: 'RMA', parent_id: '3' }]
    }

    mockRequest = {
      path: '/request-account/main-area',
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
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('redirects to details if no responsibility in session', async () => {
      mockRequest.yar.get.mockReturnValue({})

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('redirects admin to admin details if no responsibility', async () => {
      mockRequest.path = '/admin/accounts/main-area'
      mockRequest.yar.get.mockReturnValue({})

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account/details')
    })

    test('renders main area view for EA user', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          isAdmin: false,
          responsibility: 'ea',
          availableAreas: mockAreas.EA
        })
      )
    })

    test('renders main area view with selected area', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          mainArea: '1'
        })
      )
    })

    test('fetches areas from request decorator', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockRequest.getAreas).toHaveBeenCalled()
    })

    test('builds grouped areas for PSO', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      getAreasByType.mockReturnValue(mockAreas.PSO)

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          responsibility: 'pso'
        })
      )
    })
  })

  describe('POST handler', () => {
    test('redirects to details if no responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({})

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/details')
    })

    test('validates main area selection', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = { mainArea: '1' }
      mainAreaSchema.validate.mockReturnValue({
        error: null,
        value: { mainArea: '1' }
      })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mainAreaSchema.validate).toHaveBeenCalledWith(
        { mainArea: '1' },
        { abortEarly: false }
      )
    })

    test('shows validation errors for missing selection', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = {}
      const validationError = {
        details: [{ path: ['mainArea'], message: 'Required' }]
      }
      mainAreaSchema.validate.mockReturnValue({ error: validationError })
      extractJoiErrors.mockReturnValue({ mainArea: 'Required' })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          fieldErrors: { mainArea: 'Required' }
        })
      )
    })

    test('saves main area to session', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = { mainArea: '1' }
      mainAreaSchema.validate.mockReturnValue({ error: null })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: expect.arrayContaining([
            expect.objectContaining({ areaId: '1', primary: true })
          ])
        })
      )
    })

    test('filters out invalid additional areas when main area changes', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false },
          { areaId: '3', primary: false }
        ]
      })
      mockRequest.payload = { mainArea: '2' }
      mainAreaSchema.validate.mockReturnValue({ error: null })
      getAreasByType.mockReturnValue(mockAreas.EA)

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: expect.not.arrayContaining([
            expect.objectContaining({ areaId: '2', primary: false })
          ])
        })
      )
    })

    test('redirects EA user to additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = { mainArea: '1' }
      mainAreaSchema.validate.mockReturnValue({ error: null })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/additional-areas'
      )
    })

    test('redirects PSO user to additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      mockRequest.payload = { mainArea: '3' }
      mainAreaSchema.validate.mockReturnValue({ error: null })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/additional-areas'
      )
    })

    test('redirects RMA user to additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      mockRequest.payload = { mainArea: '4' }
      mainAreaSchema.validate.mockReturnValue({ error: null })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/additional-areas'
      )
    })

    test('redirects admin EA user to admin additional areas', async () => {
      mockRequest.path = '/admin/accounts/main-area'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = { mainArea: '1' }
      mainAreaSchema.validate.mockReturnValue({ error: null })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/additional-areas'
      )
    })

    test('redirects admin to admin details if no responsibility in POST', async () => {
      mockRequest.path = '/admin/accounts/main-area'
      mockRequest.yar.get.mockReturnValue({})

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account/details')
    })

    test('shows validation errors in admin context', async () => {
      mockRequest.path = '/admin/accounts/main-area'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })
      mockRequest.payload = {}
      const validationError = {
        details: [{ path: ['mainArea'], message: 'Required' }]
      }
      mainAreaSchema.validate.mockReturnValue({ error: validationError })
      extractJoiErrors.mockReturnValue({ mainArea: 'Required' })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          isAdmin: true,
          fieldErrors: { mainArea: 'Required' }
        })
      )
    })

    test('preserves valid additional areas of same type', async () => {
      const extendedMockAreas = {
        ...mockAreas,
        EA: [
          { id: '1', name: 'Wessex', area_type: 'EA Area', parent_id: null },
          { id: '2', name: 'Thames', area_type: 'EA Area', parent_id: null },
          { id: '3', name: 'Anglian', area_type: 'EA Area', parent_id: null }
        ]
      }
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false },
          { areaId: '3', primary: false }
        ]
      })
      mockRequest.payload = { mainArea: '1' }
      mockRequest.getAreas.mockResolvedValue(extendedMockAreas)
      mainAreaSchema.validate.mockReturnValue({ error: null })
      getAreasByType.mockReturnValue(extendedMockAreas.EA)
      findAreaById.mockImplementation((areas, id) => {
        return Object.values(areas)
          .flat()
          .find((a) => a.id === id)
      })

      await mainAreaPostController.handler(mockRequest, mockH)

      const setCall = mockRequest.yar.set.mock.calls[0]
      expect(setCall[0]).toBe('accountData')
      expect(setCall[1].areas).toHaveLength(3)
      expect(setCall[1].areas).toContainEqual({ areaId: '1', primary: true })
      expect(setCall[1].areas).toContainEqual({ areaId: '2', primary: false })
      expect(setCall[1].areas).toContainEqual({ areaId: '3', primary: false })
    })

    test('filters out additional areas with invalid type', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [
          { areaId: '1', primary: true },
          { areaId: '3', primary: false }
        ]
      })
      mockRequest.payload = { mainArea: '1' }
      mainAreaSchema.validate.mockReturnValue({ error: null })
      getAreasByType.mockReturnValue(mockAreas.EA)
      findAreaById.mockImplementation((areas, id) => {
        if (id === '3') return { id: '3', area_type: 'PSO' }
        return Object.values(areas)
          .flat()
          .find((a) => a.id === id)
      })

      await mainAreaPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: expect.not.arrayContaining([
            expect.objectContaining({ areaId: '3', primary: false })
          ])
        })
      )
    })
  })

  describe('buildGroupedAreas', () => {
    test('returns null for EA responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          groupedAreas: null
        })
      )
    })

    test('returns null for PSO with no EA areas selected', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        eaAreas: []
      })
      getAreasByType.mockReturnValue(mockAreas.PSO)

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          groupedAreas: null
        })
      )
    })

    test('builds PSO grouped areas by EA parent', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        eaAreas: ['1']
      })
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        return []
      })

      await mainAreaController.handler(mockRequest, mockH)

      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'EA Area')
      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'PSO Area')
    })

    test('returns null for RMA with no PSO areas selected', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        psoAreas: []
      })
      getAreasByType.mockReturnValue(mockAreas.RMA)

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          groupedAreas: null
        })
      )
    })

    test('builds RMA grouped areas by EA and PSO hierarchy', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        psoAreas: ['3']
      })
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        if (type === 'RMA Area' || type === 'RMA') return mockAreas.RMA
        return []
      })

      await mainAreaController.handler(mockRequest, mockH)

      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'EA Area')
      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'PSO Area')
    })
  })

  describe('getBackLink', () => {
    test('returns details link for EA users', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          backLink: '/request-account/details'
        })
      )
    })

    test('returns EA parent areas link for PSO users', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'PSO' })
      getAreasByType.mockReturnValue(mockAreas.PSO)

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          backLink: '/request-account/parent-areas/ea'
        })
      )
    })

    test('returns PSO parent areas link for RMA users', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'RMA' })
      getAreasByType.mockReturnValue(mockAreas.RMA)

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          backLink: '/request-account/parent-areas/pso'
        })
      )
    })

    test('returns admin details link for EA admin users', async () => {
      mockRequest.path = '/admin/accounts/main-area'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await mainAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/main-area/index',
        expect.objectContaining({
          backLink: '/admin/user-account/details'
        })
      )
    })
  })
})
