import { describe, test, expect, beforeEach, vi } from 'vitest'
import { organisationsListingController } from './controller.js'
import { ORGANISATION_SESSION_KEYS } from '../../../../common/constants/organisations.js'

vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/areas/areas-service.js')
vi.mock('../../common/listing-helpers.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    buildListingRequestContext: vi.fn(actual.buildListingRequestContext),
    buildListingViewModel: vi.fn(actual.buildListingViewModel),
    buildEmptyListingViewModel: vi.fn(actual.buildEmptyListingViewModel)
  }
})

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { createAreasService } =
  await import('../../../../common/services/areas/areas-service.js')

describe('organisationsListingController', () => {
  let mockRequest
  let mockH
  let mockAreasService

  beforeEach(() => {
    mockRequest = {
      server: {
        logger: {
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn(),
          debug: vi.fn()
        }
      },
      query: {},
      yar: {
        flash: vi.fn(() => []),
        clear: vi.fn()
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context }))
    }

    mockAreasService = {
      getAreasByList: vi.fn()
    }

    getAuthSession.mockReturnValue({
      user: { id: '1', name: 'Admin User' },
      accessToken: 'test-token'
    })

    createAreasService.mockReturnValue(mockAreasService)

    vi.clearAllMocks()
  })

  test('renders organisations list successfully', async () => {
    const mockOrganisations = {
      areas: [
        { id: '1', name: 'Thames', area_type: 'EA', identifier: 'EA001' },
        {
          id: '2',
          name: 'Bristol Council',
          area_type: 'RMA',
          identifier: 'RMA001'
        }
      ],
      pagination: {
        page: 1,
        totalPages: 1,
        total: 2,
        pageSize: 10
      }
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(mockAreasService.getAreasByList).toHaveBeenCalledWith({
      search: '',
      type: '',
      page: 1,
      pageSize: 20,
      accessToken: 'test-token'
    })
    expect(mockRequest.yar.clear).toHaveBeenCalledWith(
      ORGANISATION_SESSION_KEYS.ORGANISATION_DATA
    )

    expect(result.context.organisations).toHaveLength(2)
    expect(result.context.organisations[0].name).toBe('Thames')
    expect(result.template).toBe('modules/admin/organisations/listing/index')
  })

  test('handles search and type filters', async () => {
    mockRequest.query = {
      search: 'Bristol',
      type: 'RMA',
      page: '2'
    }

    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 2, totalPages: 1, total: 0, pageSize: 10 }
    })

    await organisationsListingController.handler(mockRequest, mockH)

    expect(mockAreasService.getAreasByList).toHaveBeenCalledWith({
      search: 'Bristol',
      type: 'RMA',
      page: 2,
      pageSize: 20,
      accessToken: 'test-token'
    })
  })

  test('handles error when fetching organisations fails', async () => {
    const error = new Error('API error')
    mockAreasService.getAreasByList.mockRejectedValue(error)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
      { error },
      'Error loading organisations page'
    )

    expect(result.context.organisations).toEqual([])
    expect(result.context.error).toBe(
      'organisations.listing.errors.fetch_failed'
    )
  })

  test('displays success notification', async () => {
    mockRequest.yar.flash = vi.fn((key) => {
      if (key === 'success') {
        return [{ title: 'Success', message: 'Organisation added' }]
      }
      return []
    })

    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 1, totalPages: 1, total: 0, pageSize: 10 }
    })

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(result.context.successNotification).toEqual({
      title: 'Success',
      message: 'Organisation added'
    })
  })

  test('formats organisations correctly', async () => {
    const mockOrganisations = {
      areas: [
        { id: '1', name: 'Thames', area_type: 'EA', identifier: 'EA001' }
      ],
      pagination: { page: 1, totalPages: 1, total: 1, pageSize: 10 }
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    const org = result.context.organisations[0]
    expect(org.name).toBe('Thames')
    expect(org.type).toBe('EA')
    expect(org.identifier).toBe('EA001')
    // ID is encoded, so just verify it exists
    expect(org.id).toBeTruthy()
  })

  test('includes filter options in context', async () => {
    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 1, totalPages: 1, total: 0, pageSize: 10 }
    })

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    const typeOptions = result.context.typeOptions
    expect(typeOptions).toHaveLength(4)
    expect(typeOptions[0]).toEqual({
      value: '',
      text: 'All organisation types',
      selected: true
    })
    // Verify other options are not selected
    const psoOption = typeOptions.find((opt) => opt.value === 'PSO Area')
    expect(psoOption.selected).toBe(false)
    const rmaOption = typeOptions.find((opt) => opt.value === 'RMA')
    expect(rmaOption.selected).toBe(false)
    const authOption = typeOptions.find((opt) => opt.value === 'Authority')
    expect(authOption.selected).toBe(false)
  })

  test('marks selected type filter option correctly', async () => {
    mockRequest.query = {
      type: 'RMA'
    }

    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 1, totalPages: 1, total: 0, pageSize: 10 }
    })

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    const typeOptions = result.context.typeOptions
    expect(typeOptions).toHaveLength(4)
    expect(typeOptions[0]).toEqual({
      value: '',
      text: 'All organisation types',
      selected: false
    })
    // Find the RMA option and verify it's selected
    const rmaOption = typeOptions.find((opt) => opt.value === 'RMA')
    expect(rmaOption).toBeDefined()
    expect(rmaOption.selected).toBe(true)
    // Verify other options are not selected
    const psoOption = typeOptions.find((opt) => opt.value === 'PSO Area')
    expect(psoOption.selected).toBe(false)
    const authOption = typeOptions.find((opt) => opt.value === 'Authority')
    expect(authOption.selected).toBe(false)
  })

  test('handles result with data property instead of areas', async () => {
    const mockOrganisations = {
      data: [
        {
          id: '3',
          name: 'Anglian',
          area_type: 'PSO Area',
          identifier: 'PSO001'
        }
      ],
      pagination: { page: 1, totalPages: 1, total: 1, pageSize: 10 }
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(result.context.organisations).toHaveLength(1)
    expect(result.context.organisations[0].name).toBe('Anglian')
  })

  test('handles result with empty areas and data properties', async () => {
    const mockOrganisations = {
      pagination: { page: 1, totalPages: 1, total: 0, pageSize: 10 }
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(result.context.organisations).toEqual([])
  })

  test('formats organisation with areaType property', async () => {
    const mockOrganisations = {
      areas: [
        {
          id: '4',
          name: 'Somerset',
          areaType: 'Authority',
          identifier: 'AUTH001'
        }
      ],
      pagination: { page: 1, totalPages: 1, total: 1, pageSize: 10 }
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    const org = result.context.organisations[0]
    expect(org.name).toBe('Somerset')
    expect(org.type).toBe('Authority')
    expect(org.identifier).toBe('AUTH001')
    // ID is encoded, so just verify it exists
    expect(org.id).toBeTruthy()
  })

  test('displays error notification in error view', async () => {
    mockRequest.yar.flash = vi.fn((key) => {
      if (key === 'error') {
        return [{ title: 'Error', message: 'Something went wrong' }]
      }
      return []
    })

    const error = new Error('API error')
    mockAreasService.getAreasByList.mockRejectedValue(error)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(result.context.errorNotification).toEqual({
      title: 'Error',
      message: 'Something went wrong'
    })
  })

  test('includes type options in error view', async () => {
    mockRequest.query = { type: 'PSO Area' }
    const error = new Error('API error')
    mockAreasService.getAreasByList.mockRejectedValue(error)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    const typeOptions = result.context.typeOptions
    expect(typeOptions).toHaveLength(4)
    expect(typeOptions[0]).toEqual({
      value: '',
      text: 'All organisation types',
      selected: false
    })
    // Find the PSO option and verify it's selected
    const psoOption = typeOptions.find((opt) => opt.value === 'PSO Area')
    expect(psoOption).toBeDefined()
    expect(psoOption.selected).toBe(true)
    // Verify other options are not selected
    const rmaOption = typeOptions.find((opt) => opt.value === 'RMA')
    expect(rmaOption.selected).toBe(false)
    const authOption = typeOptions.find((opt) => opt.value === 'Authority')
    expect(authOption.selected).toBe(false)
  })

  test('handles null session gracefully', async () => {
    getAuthSession.mockReturnValue(null)

    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 1, totalPages: 1, total: 0, pageSize: 10 }
    })

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(mockAreasService.getAreasByList).toHaveBeenCalledWith({
      search: '',
      type: '',
      page: 1,
      pageSize: 20,
      accessToken: undefined
    })

    expect(result.template).toBe('modules/admin/organisations/listing/index')
  })

  test('handles result with pagination object directly', async () => {
    const mockOrganisations = {
      areas: [],
      page: 1,
      totalPages: 1,
      total: 0,
      pageSize: 10
    }

    mockAreasService.getAreasByList.mockResolvedValue(mockOrganisations)

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    // Should use entire result object as pagination since pagination property doesn't exist
    // The buildListingViewModel will process this pagination data
    expect(result.template).toBe('modules/admin/organisations/listing/index')
    expect(result.context.organisations).toEqual([])
  })

  test('passes filters to buildListingViewModel', async () => {
    mockRequest.query = {
      search: 'Test',
      type: 'Authority',
      page: '3'
    }

    mockAreasService.getAreasByList.mockResolvedValue({
      areas: [],
      pagination: { page: 3, totalPages: 5, total: 100, pageSize: 20 }
    })

    const result = await organisationsListingController.handler(
      mockRequest,
      mockH
    )

    expect(result.context.filters).toEqual({
      search: 'Test',
      type: 'Authority'
    })
    expect(result.template).toBe('modules/admin/organisations/listing/index')
  })
})
