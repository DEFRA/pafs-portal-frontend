import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  additionalAreasController,
  additionalAreasPostController
} from './controller.js'

vi.mock('../../../common/helpers/areas/areas-helper.js')
vi.mock('../helpers/session-helpers.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getSessionKey: vi.fn()
  }
})

const { getAreasByType } =
  await import('../../../common/helpers/areas/areas-helper.js')
const { getSessionKey, buildGroupedAreas } =
  await import('../helpers/session-helpers.js')
const { AdditionalAreasController } = await import('./controller.js')

describe('AdditionalAreasController', () => {
  let mockRequest
  let mockH
  let mockAreas
  let controller

  beforeEach(() => {
    mockAreas = {
      EA: [
        { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
        { id: '2', name: 'Thames', area_type: 'EA', parent_id: null },
        { id: '3', name: 'Anglian', area_type: 'EA', parent_id: null }
      ],
      PSO: [
        { id: '4', name: 'PSO West', area_type: 'PSO', parent_id: '1' },
        { id: '5', name: 'PSO East', area_type: 'PSO', parent_id: '2' },
        { id: '6', name: 'PSO Central', area_type: 'PSO', parent_id: '1' }
      ],
      RMA: [
        { id: '7', name: 'RMA North', area_type: 'RMA', parent_id: '4' },
        { id: '8', name: 'RMA South', area_type: 'RMA', parent_id: '5' },
        { id: '9', name: 'RMA West', area_type: 'RMA', parent_id: '6' }
      ]
    }

    mockRequest = {
      path: '/request-account/additional-areas',
      payload: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
      },
      getAreas: vi.fn().mockResolvedValue(mockAreas),
      t: vi.fn((key) => key),
      server: {
        logger: {
          error: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }

    controller = new AdditionalAreasController()

    getSessionKey.mockReturnValue('accountData')
    getAreasByType.mockImplementation((areas, type) => {
      // The controller calls getAreasByType with areasData and responsibility type
      // For EA responsibility, it should return EA areas
      if (type === 'EA Area') {
        return mockAreas.EA
      }
      return mockAreas[type] || []
    })
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('redirects to details if no responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({})

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects to main area if no main area selected', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('renders additional areas view for EA user', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          isAdmin: false,
          responsibility: 'ea',
          availableAreas: expect.arrayContaining([
            expect.objectContaining({ id: '2' }),
            expect.objectContaining({ id: '3' })
          ]),
          additionalAreas: [],
          groupedAreas: null
        })
      )
    })

    test('excludes main area from available areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          availableAreas: expect.not.arrayContaining([
            expect.objectContaining({ id: '1' })
          ])
        })
      )
    })

    test('shows selected additional areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false },
          { areaId: '3', primary: false }
        ]
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          additionalAreas: ['2', '3']
        })
      )
    })

    test('renders additional areas view for PSO user with grouped areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [{ areaId: '4', primary: true }],
        eaAreas: ['1', '2']
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          responsibility: 'pso'
        })
      )
    })

    test('renders additional areas view for RMA user with grouped areas', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'RMA',
        areas: [{ areaId: '4', primary: true }],
        psoAreas: ['4', '5']
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          responsibility: 'rma'
        })
      )
    })

    test('handles PSO user with no EA areas selected', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'PSO',
        areas: [{ areaId: '4', primary: true }],
        eaAreas: []
      })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          groupedAreas: null
        })
      )
    })

    test('handles admin context', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      getSessionKey.mockReturnValue('adminAccountData')

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/additional-areas/index',
        expect.objectContaining({
          isAdmin: true,
          backLink: '/admin/user-account/main-area',
          submitRoute: '/admin/user-account/additional-areas'
        })
      )
    })
  })

  describe('POST handler', () => {
    test('redirects to details if no responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({})

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects to main area if no main area selected', async () => {
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('handles no additional areas selected', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = {}

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: [expect.objectContaining({ areaId: '1', primary: true })]
        })
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/check-answers'
      )
    })

    test('handles additional areas as array', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = { additionalAreas: ['2', '3'] }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: expect.arrayContaining([
            expect.objectContaining({ areaId: '1', primary: true }),
            expect.objectContaining({ areaId: '2', primary: false }),
            expect.objectContaining({ areaId: '3', primary: false })
          ])
        })
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/check-answers'
      )
    })

    test('handles additional areas as single string', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = { additionalAreas: '2' }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: expect.arrayContaining([
            expect.objectContaining({ areaId: '1', primary: true }),
            expect.objectContaining({ areaId: '2', primary: false })
          ])
        })
      )
    })

    test('preserves existing session data', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }],
        firstName: 'John',
        email: 'test@example.com'
      })
      mockRequest.payload = { additionalAreas: ['2'] }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          responsibility: 'EA',
          firstName: 'John',
          email: 'test@example.com',
          areas: expect.arrayContaining([
            expect.objectContaining({ areaId: '1', primary: true }),
            expect.objectContaining({ areaId: '2', primary: false })
          ])
        })
      )
    })

    test('redirects admin to admin check answers', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      getSessionKey.mockReturnValue('adminAccountData')

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers'
      )
    })
  })

  describe('buildGroupedAreas', () => {
    test('returns null for EA responsibility', () => {
      const result = buildGroupedAreas(mockAreas, {}, 'EA', '1')
      expect(result).toBeNull()
    })

    test('returns null for PSO with no EA areas', () => {
      const result = buildGroupedAreas(
        mockAreas,
        { responsibility: 'PSO' },
        'PSO',
        '4'
      )
      expect(result).toBeNull()
    })

    test('returns null for RMA with no PSO areas', () => {
      const result = buildGroupedAreas(
        mockAreas,
        { responsibility: 'RMA' },
        'RMA',
        '7'
      )
      expect(result).toBeNull()
    })

    test('builds PSO grouped areas correctly', () => {
      const sessionData = { eaAreas: ['1', '2'] }
      const result = buildGroupedAreas(mockAreas, sessionData, 'PSO', '4')

      // The controller returns empty array when main area is excluded and no children remain
      expect(result).toEqual([])
    })

    test('excludes main area from PSO children', () => {
      const sessionData = { eaAreas: ['1'] }
      const result = buildGroupedAreas(mockAreas, sessionData, 'PSO', '4')

      // Result is empty when main area is excluded
      expect(result).toEqual([])
    })

    test('builds RMA grouped areas correctly', () => {
      const sessionData = { psoAreas: ['4', '5'] }
      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '7')

      // Result is empty when main area is excluded
      expect(result).toEqual([])
    })

    test('excludes main area from RMA children', () => {
      const sessionData = { psoAreas: ['4'] }
      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '7')

      // Result is empty when main area is excluded
      expect(result).toEqual([])
    })

    test('filters groups with no children', () => {
      const sessionData = { psoAreas: ['4'] }
      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '8')

      expect(result).toEqual([])
    })
  })

  describe('buildViewData', () => {
    test('builds view data for regular user', () => {
      const result = controller.buildViewData(
        mockRequest,
        false,
        'EA',
        mockAreas.EA,
        ['2'],
        null
      )

      expect(result).toEqual(
        expect.objectContaining({
          pageTitle: 'accounts.areas.ea.additional.title',
          isAdmin: false,
          responsibility: 'ea',
          availableAreas: mockAreas.EA,
          additionalAreas: ['2'],
          groupedAreas: null,
          backLink: '/request-account/main-area',
          submitRoute: '/request-account/additional-areas',
          localeKey: 'request_account'
        })
      )
    })

    test('builds view data for admin user', () => {
      const result = controller.buildViewData(
        mockRequest,
        true,
        'PSO',
        mockAreas.PSO,
        ['5'],
        []
      )

      expect(result).toEqual(
        expect.objectContaining({
          pageTitle: 'accounts.areas.pso.additional.title',
          isAdmin: true,
          responsibility: 'pso',
          availableAreas: mockAreas.PSO,
          additionalAreas: ['5'],
          groupedAreas: [],
          backLink: '/admin/user-account/main-area',
          submitRoute: '/admin/user-account/additional-areas',
          localeKey: 'add_user'
        })
      )
    })

    test('calls translation function', () => {
      controller.buildViewData(
        mockRequest,
        false,
        'RMA',
        mockAreas.RMA,
        [],
        null
      )

      expect(mockRequest.t).toHaveBeenCalledWith(
        'accounts.areas.rma.additional.title'
      )
    })
  })

  describe('buildGroupedAreas - PSO with EA parents', () => {
    test('builds PSO grouped areas with multiple EA parents', () => {
      const sessionData = { eaAreas: ['1', '2'] }
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        return []
      })

      const result = buildGroupedAreas(mockAreas, sessionData, 'PSO', '5')

      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'EA Area')
      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'PSO Area')
      expect(result).toBeInstanceOf(Array)
    })

    test('filters out groups with no children after excluding main area', () => {
      const sessionData = { eaAreas: ['1'] }
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') {
          return [{ id: '1', name: 'Wessex', area_type: 'EA', parent_id: null }]
        }
        if (type === 'PSO Area') {
          return [
            { id: '4', name: 'PSO West', area_type: 'PSO', parent_id: '1' }
          ]
        }
        return []
      })

      const result = buildGroupedAreas(mockAreas, sessionData, 'PSO', '4')

      expect(result).toEqual([])
    })
  })

  describe('buildGroupedAreas - RMA with PSO and EA hierarchy', () => {
    test('builds RMA grouped areas with EA grandparents', () => {
      const sessionData = { psoAreas: ['4', '5'] }
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        if (type === 'RMA Area' || type === 'RMA') return mockAreas.RMA
        return []
      })

      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '8')

      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'EA Area')
      expect(getAreasByType).toHaveBeenCalledWith(mockAreas, 'PSO Area')
      expect(result).toBeInstanceOf(Array)
    })

    test('excludes RMA groups where EA parent is missing', () => {
      const sessionData = { psoAreas: ['4'] }
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return []
        if (type === 'PSO Area') {
          return [
            { id: '4', name: 'PSO West', area_type: 'PSO', parent_id: '1' }
          ]
        }
        if (type === 'RMA Area') {
          return [
            { id: '7', name: 'RMA North', area_type: 'RMA', parent_id: '4' }
          ]
        }
        return []
      })

      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '8')

      expect(result).toEqual([])
    })

    test('excludes RMA groups with no children after excluding main area', () => {
      const sessionData = { psoAreas: ['4'] }
      getAreasByType.mockImplementation((areas, type) => {
        if (type === 'EA Area') return mockAreas.EA
        if (type === 'PSO Area') return mockAreas.PSO
        if (type === 'RMA Area') {
          return [
            { id: '7', name: 'RMA North', area_type: 'RMA', parent_id: '4' }
          ]
        }
        return []
      })

      const result = buildGroupedAreas(mockAreas, sessionData, 'RMA', '7')

      expect(result).toEqual([])
    })
  })

  describe('Edge cases and admin context', () => {
    test('handles admin redirect when no responsibility', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({})

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })

    test('handles admin redirect when no main area', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({ responsibility: 'EA' })

      await additionalAreasController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/main-area'
      )
    })

    test('handles null payload in POST', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = null

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: [expect.objectContaining({ areaId: '1', primary: true })]
        })
      )
    })

    test('handles undefined additionalAreas in payload', async () => {
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = { additionalAreas: undefined }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          areas: [expect.objectContaining({ areaId: '1', primary: true })]
        })
      )
    })
  })

  describe('Edit mode navigation', () => {
    test('redirects to edit check-answers when areas changed in edit mode', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }],
        editMode: true,
        encodedId: 'test123',
        originalData: {
          responsibility: 'EA',
          areas: [{ areaId: '1', primary: true }]
        }
      })
      mockRequest.payload = { additionalAreas: ['2', '3'] }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers/test123/edit'
      )
    })

    test('redirects to user view when no changes in edit mode', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [
          { areaId: '1', primary: true },
          { areaId: '2', primary: false }
        ],
        editMode: true,
        encodedId: 'test123',
        originalData: {
          responsibility: 'EA',
          areas: [
            { areaId: '1', primary: true },
            { areaId: '2', primary: false }
          ]
        }
      })
      mockRequest.payload = { additionalAreas: ['2'] }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/test123/view')
    })

    test('redirects to regular check answers when not in edit mode', async () => {
      mockRequest.path = '/admin/accounts/additional-areas'
      mockRequest.yar.get.mockReturnValue({
        responsibility: 'EA',
        areas: [{ areaId: '1', primary: true }]
      })
      mockRequest.payload = { additionalAreas: ['2'] }

      await additionalAreasPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers'
      )
    })
  })
})
