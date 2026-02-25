import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectsListingController, getListingContext } from './controller.js'
import { getProjects } from '../../../common/services/project/project-service.js'
import { createProjectsCacheService } from '../../../common/services/project/project-cache.js'
import {
  buildListingRequestContext,
  buildListingViewModel,
  buildEmptyListingViewModel
} from '../../admin/common/listing-helpers.js'

// Mock dependencies
vi.mock('../../../common/services/project/project-service.js', () => ({
  getProjects: vi.fn()
}))

vi.mock('../../../common/services/project/project-cache.js', () => ({
  createProjectsCacheService: vi.fn()
}))

vi.mock('../../../common/helpers/pagination/index.js', () => ({
  getDefaultPageSize: vi.fn(() => 10)
}))

vi.mock('../../admin/common/listing-helpers.js', () => ({
  buildListingRequestContext: vi.fn(),
  buildListingViewModel: vi.fn(),
  buildEmptyListingViewModel: vi.fn()
}))

describe('projectsListingController', () => {
  let mockRequest
  let mockH
  let mockSession
  let mockLogger
  let mockCacheService

  beforeEach(() => {
    vi.clearAllMocks()

    mockSession = {
      user: { id: 1, name: 'Test User' },
      accessToken: 'test-token-123'
    }

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    }

    mockCacheService = {
      getListMetadata: vi.fn(),
      setProjects: vi.fn(),
      setListMetadata: vi.fn()
    }

    mockRequest = {
      query: {
        page: 1,
        search: '',
        areaId: ''
      },
      route: {
        path: '/admin/projects'
      },
      server: {
        logger: mockLogger
      },
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn(() => [])
      },
      getAreas: vi.fn()
    }

    mockH = {
      view: vi.fn().mockReturnValue({ statusCode: 200 })
    }

    createProjectsCacheService.mockReturnValue(mockCacheService)
  })

  describe('handler', () => {
    test('Should render projects listing view with data', async () => {
      const mockProjects = [
        {
          id: 1,
          referenceNumber: 'RMS12345',
          referenceNumberFormatted: 'RMS12345/ABC001',
          name: 'Test Project 1',
          rmaName: 'Environment Agency',
          status: 'draft',
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 2,
          referenceNumber: 'RMS67890',
          referenceNumberFormatted: 'RMS67890/XYZ002',
          name: 'Test Project 2',
          rmaName: 'Natural England',
          status: 'submitted',
          updatedAt: new Date('2024-01-02')
        }
      ]

      const mockPagination = {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1
      }

      const mockAreas = {
        RMA: [
          { id: 1, name: 'Environment Agency' },
          { id: 2, name: 'Natural England' }
        ]
      }

      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue(mockAreas)

      getProjects.mockResolvedValue({
        success: true,
        data: {
          data: mockProjects,
          pagination: mockPagination
        }
      })

      buildListingViewModel.mockReturnValue({
        pageTitle: 'projects.manage_projects.title',
        user: mockSession.user,
        projects: mockProjects,
        pagination: {},
        filters: {},
        areas: []
      })

      await projectsListingController.handler(mockRequest, mockH)

      expect(mockRequest.getAreas).toHaveBeenCalled()
      expect(getProjects).toHaveBeenCalledWith({
        search: '',
        areaId: '',
        status: null,
        page: 1,
        pageSize: 10,
        accessToken: mockSession.accessToken,
        cacheService: mockCacheService
      })
      expect(buildListingViewModel).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/listing/index',
        expect.any(Object)
      )
    })

    test('Should handle search filter', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: 'flood', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'flood'
        })
      )
    })

    test('Should handle areaId filter', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '5' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          areaId: '5'
        })
      )
    })

    test('Should handle pagination', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 2,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      )
    })

    test('Should render error view when projects fetch fails', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'FETCH_FAILED' }]
      })

      buildEmptyListingViewModel.mockReturnValue({
        error: 'projects.manage_projects.errors.fetch_failed'
      })

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildEmptyListingViewModel).toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.any(Array)
        }),
        'Failed to fetch projects'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/projects/listing/index',
        expect.objectContaining({
          error: 'projects.manage_projects.errors.fetch_failed'
        })
      )
    })

    test('Should handle exception during fetch', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      const error = new Error('Network error')
      mockRequest.getAreas.mockRejectedValue(error)

      buildEmptyListingViewModel.mockReturnValue({
        error: 'projects.manage_projects.errors.fetch_failed'
      })

      await projectsListingController.handler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error }),
        'Error loading projects page'
      )
      expect(buildEmptyListingViewModel).toHaveBeenCalled()
    })

    test('Should include RMA areas in filter options', async () => {
      const mockAreas = {
        RMA: [
          { id: 1, name: 'Environment Agency' },
          { id: 2, name: 'Natural England' }
        ],
        PSO: [{ id: 3, name: 'Some PSO' }]
      }

      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue(mockAreas)

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            areas: expect.arrayContaining([
              expect.objectContaining({
                value: 1,
                text: 'Environment Agency'
              }),
              expect.objectContaining({
                value: 2,
                text: 'Natural England'
              })
            ]),
            isAdminProjectListing: true,
            isUserProjectListing: false,
            isSubmission: false,
            isArchive: false
          })
        })
      )
    })

    test('Should include "All RMAs" option in area filter', async () => {
      const mockAreas = {
        RMA: [{ id: 1, name: 'Environment Agency' }]
      }

      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue(mockAreas)

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            areas: expect.arrayContaining([
              expect.objectContaining({
                value: '',
                text: 'projects.manage_projects.filters.all_areas'
              })
            ]),
            isAdminProjectListing: true,
            isUserProjectListing: false,
            isSubmission: false,
            isArchive: false
          })
        })
      )
    })

    test('Should handle empty areas gracefully', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue(null)

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            areas: [
              expect.objectContaining({
                value: '',
                text: 'projects.manage_projects.filters.all_areas'
              })
            ],
            isAdminProjectListing: true,
            isUserProjectListing: false,
            isSubmission: false,
            isArchive: false
          })
        })
      )
    })

    test('Should handle missing RMA areas in response', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({
        PSO: [{ id: 1, name: 'Some PSO' }]
      })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            areas: [
              expect.objectContaining({
                value: '',
                text: 'projects.manage_projects.filters.all_areas'
              })
            ],
            isAdminProjectListing: true,
            isUserProjectListing: false,
            isSubmission: false,
            isArchive: false
          })
        })
      )
    })

    test('Should display success notification when present', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: 'Project created successfully',
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          successNotification: 'Project created successfully'
        })
      )
    })

    test('Should display error notification when present', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: 'Failed to delete project',
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          errorNotification: 'Failed to delete project'
        })
      )
    })

    test('Should pass cache service to getProjects', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheService: mockCacheService
        })
      )
    })

    test('Should create cache service with server instance', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(createProjectsCacheService).toHaveBeenCalledWith(
        mockRequest.server
      )
    })

    test('Should pass dynamic pageTitle and pageHeading for admin projects', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          pageTitle: 'projects.manage_projects.title',
          additionalData: expect.objectContaining({
            pageHeading: 'projects.manage_projects.heading'
          })
        })
      )
    })

    test('Should pass dynamic pageTitle and pageHeading for submissions route', async () => {
      mockRequest.route.path = '/admin/submissions'

      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: { data: [], pagination: {} }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(getProjects).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'submitted'
        })
      )
      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          pageTitle: 'projects.failed_submissions.title',
          additionalData: expect.objectContaining({
            pageHeading: 'projects.failed_submissions.heading',
            isSubmission: true,
            isAdminProjectListing: false
          })
        })
      )
    })

    test('Should handle empty projects result', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            page: 1,
            totalPages: 0,
            total: 0,
            pageSize: 10
          }
        }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            projects: []
          })
        })
      )
    })

    test('Should handle missing data object with fallback values', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: null
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            projects: [],
            areas: expect.any(Array),
            isAdminProjectListing: true,
            isUserProjectListing: false,
            isSubmission: false,
            isArchive: false
          }),
          pagination: {}
        })
      )
    })

    test('Should handle missing projects array with fallback', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: {
          data: null,
          pagination: { page: 1, total: 0 }
        }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalData: expect.objectContaining({
            projects: [],
            isAdminProjectListing: true
          })
        })
      )
    })

    test('Should handle missing pagination object with fallback', async () => {
      buildListingRequestContext.mockReturnValue({
        session: mockSession,
        logger: mockLogger,
        successNotification: null,
        errorNotification: null,
        page: 1,
        filters: { search: '', areaId: '' }
      })

      mockRequest.getAreas.mockResolvedValue({ RMA: [] })

      getProjects.mockResolvedValue({
        success: true,
        data: {
          data: [{ id: 1, name: 'Test' }],
          pagination: null
        }
      })

      buildListingViewModel.mockReturnValue({})

      await projectsListingController.handler(mockRequest, mockH)

      expect(buildListingViewModel).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {}
        })
      )
    })
  })
})

describe('getListingContext', () => {
  test('Should return admin project listing context for /admin/projects', () => {
    const request = { route: { path: '/admin/projects' } }
    const context = getListingContext(request)

    expect(context).toEqual({
      viewTemplate: 'modules/projects/listing/index',
      baseUrl: '/admin/projects',
      titleKey: 'projects.manage_projects.title',
      headingKey: 'projects.manage_projects.heading',
      status: null,
      isAdminProjectListing: true,
      isUserProjectListing: false,
      isSubmission: false,
      isArchive: false
    })
  })

  test('Should return submission context for /admin/submissions', () => {
    const request = { route: { path: '/admin/submissions' } }
    const context = getListingContext(request)

    expect(context).toEqual({
      viewTemplate: 'modules/projects/listing/index',
      baseUrl: '/admin/submissions',
      titleKey: 'projects.failed_submissions.title',
      headingKey: 'projects.failed_submissions.heading',
      status: 'submitted',
      isAdminProjectListing: false,
      isUserProjectListing: false,
      isSubmission: true,
      isArchive: false
    })
  })

  test('Should return user project listing context for /', () => {
    const request = { route: { path: '/' } }
    const context = getListingContext(request)

    expect(context).toEqual({
      viewTemplate: 'modules/projects/listing/index',
      baseUrl: '/',
      titleKey: 'home.title',
      headingKey: 'home.heading',
      status: null,
      isAdminProjectListing: false,
      isUserProjectListing: true,
      isSubmission: false,
      isArchive: false
    })
  })

  test('Should return archive context for /archive', () => {
    const request = { route: { path: '/archive' } }
    const context = getListingContext(request)

    expect(context).toEqual({
      viewTemplate: 'modules/projects/listing/index',
      baseUrl: '/archive',
      titleKey: 'projects.archived_proposals.title',
      headingKey: 'projects.archived_proposals.heading',
      status: 'archived',
      isAdminProjectListing: false,
      isUserProjectListing: false,
      isSubmission: false,
      isArchive: true
    })
  })

  test('Should default to admin project keys for unknown route', () => {
    const request = { route: { path: '/unknown' } }
    const context = getListingContext(request)

    expect(context).toEqual({
      viewTemplate: 'modules/projects/listing/index',
      baseUrl: '/unknown',
      titleKey: 'projects.manage_projects.title',
      headingKey: 'projects.manage_projects.heading',
      status: null,
      isAdminProjectListing: false,
      isUserProjectListing: false,
      isSubmission: false,
      isArchive: false
    })
  })
})
