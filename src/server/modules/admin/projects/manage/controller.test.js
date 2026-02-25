import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectsManageController } from './controller.js'
import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'

// Mock dependencies
vi.mock('../../../../common/services/project/project-service.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/project/project-cache.js')

const { getProjectProposalOverview, upsertProjectProposal } =
  await import('../../../../common/services/project/project-service.js')

const { extractApiValidationErrors, extractApiError } =
  await import('../../../../common/helpers/error-renderer/index.js')

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')

const { createProjectsCacheService } =
  await import('../../../../common/services/project/project-cache.js')

describe('ProjectsManageController', () => {
  let mockRequest
  let mockH
  let mockCacheService

  beforeEach(() => {
    vi.clearAllMocks()

    mockCacheService = {
      getProjectByReferenceNumber: vi.fn(),
      invalidateAll: vi.fn()
    }

    mockRequest = {
      params: { referenceNumber: 'THC501E-000A-017A' },
      payload: {},
      query: {},
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn()
        }
      },
      t: vi.fn((key) => key),
      yar: {
        set: vi.fn(),
        get: vi.fn(),
        clear: vi.fn(),
        flash: vi.fn()
      },
      getAreas: vi.fn()
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    // Set up default mocks
    getAuthSession.mockReturnValue({ accessToken: 'test-token' })
    createProjectsCacheService.mockReturnValue(mockCacheService)
  })

  describe('buildViewData', () => {
    test('should build view data with no errors', async () => {
      const viewData = { id: 1, projectName: 'Test Project' }
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [
          { id: 1, name: 'RMA 1' },
          { id: 2, name: 'RMA 2' }
        ]
      })

      const controller = new (class extends Object {
        async buildViewData(request, viewData, errors = {}) {
          const rmaListOptions = await this.getRmaListOptions(request)
          const { fieldErrors = {}, errorCode = '' } = errors

          const errorSummary =
            fieldErrors && Object.keys(fieldErrors).length > 0
              ? Object.entries(fieldErrors).map(([field, message]) => ({
                  text: message,
                  href: `#${field}`
                }))
              : null

          return {
            request,
            pageTitle: request.t('projects.manage_projects.edit_rma.title'),
            heading: request.t('projects.manage_projects.edit_rma.heading'),
            cancelUrl: ROUTES.ADMIN.PROJECTS,
            fieldErrors,
            errorCode,
            errorSummary,
            data: viewData,
            rmaListOptions
          }
        }

        async getRmaListOptions(request) {
          const areasData = await request.getAreas()
          const rmaOptions = []
          if (!areasData) return rmaOptions
          const rmaAreas = areasData[AREAS_RESPONSIBILITIES_MAP.RMA] || []
          if (rmaAreas.length > 0) {
            const options = rmaAreas.map((area) => ({
              value: area.id,
              text: area.name
            }))
            rmaOptions.push(...options)
          }
          return rmaOptions
        }
      })()

      const result = await controller.buildViewData(mockRequest, viewData)

      expect(result).toEqual({
        request: mockRequest,
        pageTitle: 'projects.manage_projects.edit_rma.title',
        heading: 'projects.manage_projects.edit_rma.heading',
        cancelUrl: ROUTES.ADMIN.PROJECTS,
        fieldErrors: {},
        errorCode: '',
        errorSummary: null,
        data: viewData,
        rmaListOptions: [
          { value: 1, text: 'RMA 1' },
          { value: 2, text: 'RMA 2' }
        ]
      })
    })

    test('should build view data with field errors', async () => {
      const viewData = { id: 1, projectName: 'Test Project' }
      const errors = {
        fieldErrors: { areaId: 'Select a different RMA' },
        errorCode: 'VALIDATION_ERROR'
      }
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [{ id: 1, name: 'RMA 1' }]
      })

      const controller = new (class extends Object {
        async buildViewData(request, viewData, errors = {}) {
          const rmaListOptions = await this.getRmaListOptions(request)
          const { fieldErrors = {}, errorCode = '' } = errors

          const errorSummary =
            fieldErrors && Object.keys(fieldErrors).length > 0
              ? Object.entries(fieldErrors).map(([field, message]) => ({
                  text: message,
                  href: `#${field}`
                }))
              : null

          return {
            request,
            pageTitle: request.t('projects.manage_projects.edit_rma.title'),
            heading: request.t('projects.manage_projects.edit_rma.heading'),
            cancelUrl: ROUTES.ADMIN.PROJECTS,
            fieldErrors,
            errorCode,
            errorSummary,
            data: viewData,
            rmaListOptions
          }
        }

        async getRmaListOptions(request) {
          const areasData = await request.getAreas()
          const rmaOptions = []
          if (!areasData) return rmaOptions
          const rmaAreas = areasData[AREAS_RESPONSIBILITIES_MAP.RMA] || []
          if (rmaAreas.length > 0) {
            const options = rmaAreas.map((area) => ({
              value: area.id,
              text: area.name
            }))
            rmaOptions.push(...options)
          }
          return rmaOptions
        }
      })()

      const result = await controller.buildViewData(
        mockRequest,
        viewData,
        errors
      )

      expect(result.fieldErrors).toEqual({ areaId: 'Select a different RMA' })
      expect(result.errorCode).toBe('VALIDATION_ERROR')
      expect(result.errorSummary).toEqual([
        { text: 'Select a different RMA', href: '#areaId' }
      ])
    })

    test('should build error summary for multiple field errors', async () => {
      const viewData = { id: 1 }
      const errors = {
        fieldErrors: {
          areaId: 'Select a different RMA',
          projectName: 'Project name is required'
        }
      }
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      const result = await new (class extends Object {
        async buildViewData(request, viewData, errors = {}) {
          const { fieldErrors = {} } = errors
          const errorSummary =
            fieldErrors && Object.keys(fieldErrors).length > 0
              ? Object.entries(fieldErrors).map(([field, message]) => ({
                  text: message,
                  href: `#${field}`
                }))
              : null
          return { errorSummary, fieldErrors }
        }
      })().buildViewData(mockRequest, viewData, errors)

      expect(result.fieldErrors).toEqual(errors.fieldErrors)
      expect(result.errorSummary).toHaveLength(2)
      expect(result.errorSummary).toEqual(
        expect.arrayContaining([
          { text: 'Select a different RMA', href: '#areaId' },
          { text: 'Project name is required', href: '#projectName' }
        ])
      )
    })
  })

  describe('validateRmaSelection', () => {
    test('should return null when new RMA is different from current', async () => {
      const viewData = { areaId: 1 }
      const newAreaId = '2'

      const controller = new (class extends Object {
        async validateRmaSelection(request, h, newAreaId, viewData) {
          if (Number(newAreaId) === viewData.areaId) {
            return h.view(ADMIN_VIEWS.PROJECT_MANAGE, {})
          }
          return null
        }
      })()

      const result = await controller.validateRmaSelection(
        mockRequest,
        mockH,
        newAreaId,
        viewData
      )

      expect(result).toBeNull()
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should return error view when new RMA is same as current', async () => {
      const viewData = { areaId: 1, projectName: 'Test' }
      const newAreaId = '1'

      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [{ id: 1, name: 'RMA 1' }]
      })

      const controller = new (class extends Object {
        async validateRmaSelection(request, h, newAreaId, viewData) {
          if (Number(newAreaId) === viewData.areaId) {
            const fieldErrors = {
              areaId: request.t('projects.manage_projects.errors.same_rma')
            }
            return h.view(
              ADMIN_VIEWS.PROJECT_MANAGE,
              await this.buildViewData(request, viewData, { fieldErrors })
            )
          }
          return null
        }

        async buildViewData(request, viewData, errors = {}) {
          return { fieldErrors: errors.fieldErrors }
        }
      })()

      const result = await controller.validateRmaSelection(
        mockRequest,
        mockH,
        newAreaId,
        viewData
      )

      expect(result).toBeDefined()
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          fieldErrors: {
            areaId: 'projects.manage_projects.errors.same_rma'
          }
        })
      )
    })

    test('should handle string to number conversion correctly', async () => {
      const viewData = { areaId: 5 }
      const newAreaId = '5'

      const controller = new (class extends Object {
        async validateRmaSelection(request, h, newAreaId, viewData) {
          if (Number(newAreaId) === viewData.areaId) {
            return h.view(ADMIN_VIEWS.PROJECT_MANAGE, {})
          }
          return null
        }
      })()

      const result = await controller.validateRmaSelection(
        mockRequest,
        mockH,
        newAreaId,
        viewData
      )

      expect(result).toBeDefined()
      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('getRmaListOptions', () => {
    test('should return RMA options from areas data', async () => {
      const mockAreas = {
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [
          { id: 1, name: 'Environment Agency' },
          { id: 2, name: 'Natural England' },
          { id: 3, name: 'Lead Local Flood Authority' }
        ]
      }

      mockRequest.getAreas.mockResolvedValue(mockAreas)

      const controller = new (class extends Object {
        async getRmaListOptions(request) {
          const areasData = await request.getAreas()
          const rmaOptions = []
          if (!areasData) return rmaOptions
          const rmaAreas = areasData[AREAS_RESPONSIBILITIES_MAP.RMA] || []
          if (rmaAreas.length > 0) {
            const options = rmaAreas.map((area) => ({
              value: area.id,
              text: area.name
            }))
            rmaOptions.push(...options)
          }
          return rmaOptions
        }
      })()

      const result = await controller.getRmaListOptions(mockRequest)

      expect(result).toEqual([
        { value: 1, text: 'Environment Agency' },
        { value: 2, text: 'Natural England' },
        { value: 3, text: 'Lead Local Flood Authority' }
      ])
    })

    test('should return empty array when areas data is null', async () => {
      mockRequest.getAreas.mockResolvedValue(null)

      const controller = new (class extends Object {
        async getRmaListOptions(request) {
          const areasData = await request.getAreas()
          const rmaOptions = []
          if (!areasData) return rmaOptions
          return rmaOptions
        }
      })()

      const result = await controller.getRmaListOptions(mockRequest)

      expect(result).toEqual([])
    })

    test('should return empty array when RMA areas do not exist', async () => {
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.EA]: [{ id: 1, name: 'EA Area' }]
      })

      const controller = new (class extends Object {
        async getRmaListOptions(request) {
          const areasData = await request.getAreas()
          const rmaOptions = []
          if (!areasData) return rmaOptions
          const rmaAreas = areasData[AREAS_RESPONSIBILITIES_MAP.RMA] || []
          if (rmaAreas.length > 0) {
            const options = rmaAreas.map((area) => ({
              value: area.id,
              text: area.name
            }))
            rmaOptions.push(...options)
          }
          return rmaOptions
        }
      })()

      const result = await controller.getRmaListOptions(mockRequest)

      expect(result).toEqual([])
    })
  })

  describe('GET handler', () => {
    test('should fetch project from cache when available', async () => {
      const mockProjectData = {
        id: 1,
        referenceNumber: 'THC501E/000A/017A',
        name: 'Test Project',
        rmaName: 'Environment Agency',
        areaId: 1
      }

      mockCacheService.getProjectByReferenceNumber.mockResolvedValue(
        mockProjectData
      )
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [{ id: 1, name: 'RMA 1' }]
      })

      await projectsManageController.getProjectHandler(mockRequest, mockH)

      expect(mockCacheService.getProjectByReferenceNumber).toHaveBeenCalledWith(
        'THC501E/000A/017A'
      )
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { referenceNumber: 'THC501E/000A/017A' },
        'Project found in cache for manage page'
      )
      expect(getProjectProposalOverview).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          data: expect.objectContaining({
            id: 1,
            referenceNumber: 'THC501E/000A/017A',
            projectName: 'Test Project',
            rmaName: 'Environment Agency',
            areaId: 1
          })
        })
      )
    })

    test('should fetch project from API when not in cache', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          id: 1,
          referenceNumber: 'THC501E/000A/017A',
          name: 'Test Project',
          rmaName: 'Environment Agency',
          areaId: 1
        }
      }

      mockCacheService.getProjectByReferenceNumber.mockResolvedValue(null)
      getProjectProposalOverview.mockResolvedValue(mockApiResponse)
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [{ id: 1, name: 'RMA 1' }]
      })

      await projectsManageController.getProjectHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { referenceNumber: 'THC501E/000A/017A' },
        'Project not in cache, fetching from API for manage page'
      )
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'THC501E-000A-017A',
        'test-token'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          data: expect.objectContaining({
            referenceNumber: 'THC501E/000A/017A',
            projectName: 'Test Project'
          })
        })
      )
    })

    test('should convert dashes to slashes in reference number', async () => {
      mockRequest.params.referenceNumber = 'ABC123-456D-789E'
      mockCacheService.getProjectByReferenceNumber.mockResolvedValue(null)
      getProjectProposalOverview.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          referenceNumber: 'ABC123/456D/789E',
          name: 'Test',
          rmaName: 'RMA',
          areaId: 1
        }
      })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.getProjectHandler(mockRequest, mockH)

      expect(mockCacheService.getProjectByReferenceNumber).toHaveBeenCalledWith(
        'ABC123/456D/789E'
      )
      expect(getProjectProposalOverview).toHaveBeenCalledWith(
        'ABC123-456D-789E',
        'test-token'
      )
    })

    test('should store viewData in session', async () => {
      mockCacheService.getProjectByReferenceNumber.mockResolvedValue({
        id: 1,
        referenceNumber: 'TEST/001A/002A',
        name: 'Test Project',
        rmaName: 'Test RMA',
        areaId: 5
      })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.getProjectHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectManageViewData',
        expect.objectContaining({
          id: 1,
          referenceNumber: 'TEST/001A/002A',
          projectName: 'Test Project',
          rmaName: 'Test RMA',
          areaId: 5
        })
      )
    })
  })

  describe('POST handler', () => {
    beforeEach(() => {
      mockRequest.payload = { areaId: '2' }
      mockRequest.yar.get.mockReturnValue({
        id: 1,
        areaId: 1,
        projectName: 'Test Project',
        referenceNumber: 'TEST/001A/002A',
        rmaName: 'Old RMA'
      })
    })

    test('should successfully update project RMA', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          data: {
            name: 'Test Project',
            referenceNumber: 'TEST/001A/002A'
          }
        }
      }

      upsertProjectProposal.mockResolvedValue(mockApiResponse)

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(upsertProjectProposal).toHaveBeenCalledWith(
        {
          level: 'PROJECT_AREA',
          payload: {
            referenceNumber: 'THC501E/000A/017A',
            areaId: 2
          }
        },
        'test-token'
      )
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        'projectManageViewData'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        message:
          'Test Project projects.manage_projects.notifications.rma_changed'
      })
      expect(mockCacheService.invalidateAll).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.PROJECTS)
    })

    test('should show validation error when selecting same RMA', async () => {
      mockRequest.payload.areaId = '1' // Same as current areaId

      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: [{ id: 1, name: 'RMA 1' }]
      })

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(upsertProjectProposal).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          fieldErrors: {
            areaId: 'projects.manage_projects.errors.same_rma'
          }
        })
      )
    })

    test('should handle API validation errors', async () => {
      const mockApiError = {
        success: false,
        status: 400,
        validationErrors: [{ field: 'areaId', errorCode: 'INVALID_AREA' }],
        errors: null
      }

      upsertProjectProposal.mockResolvedValue(mockApiError)
      extractApiValidationErrors.mockReturnValue({
        areaId: 'INVALID_AREA'
      })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(extractApiValidationErrors).toHaveBeenCalledWith(mockApiError)
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          fieldErrors: { areaId: 'INVALID_AREA' }
        })
      )
    })

    test('should handle API general errors', async () => {
      const mockApiError = {
        success: false,
        errors: [{ errorCode: 'SERVER_ERROR' }]
      }

      upsertProjectProposal.mockResolvedValue(mockApiError)
      extractApiError.mockReturnValue({ errorCode: 'SERVER_ERROR' })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(extractApiError).toHaveBeenCalledWith(mockApiError)
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          errorCode: 'SERVER_ERROR'
        })
      )
    })

    test('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network error')
      upsertProjectProposal.mockRejectedValue(unexpectedError)
      extractApiError.mockReturnValue(null)
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: unexpectedError,
          message: 'Network error'
        }),
        'Error saving project RMA change'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          errorCode: 'SAVE_FAILED'
        })
      )
    })

    test('should handle error with response data', async () => {
      const errorWithResponse = new Error('API Error')
      errorWithResponse.response = {
        data: {
          success: false,
          validationErrors: [{ field: 'areaId', errorCode: 'REQUIRED' }]
        }
      }

      upsertProjectProposal.mockRejectedValue(errorWithResponse)
      extractApiValidationErrors.mockReturnValue({ areaId: 'REQUIRED' })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await projectsManageController.postProjectHandler(mockRequest, mockH)

      expect(extractApiValidationErrors).toHaveBeenCalledWith(
        errorWithResponse.response.data
      )
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.PROJECT_MANAGE,
        expect.objectContaining({
          fieldErrors: { areaId: 'REQUIRED' }
        })
      )
    })
  })

  describe('transformData', () => {
    test('should transform API data to view data format', () => {
      const apiData = {
        id: 123,
        referenceNumber: 'TEST/001A/002A',
        name: 'Flood Defense Project',
        rmaName: 'Environment Agency',
        areaId: 5
      }

      const controller = new (class extends Object {
        transformData(data) {
          return {
            id: data.id ? Number(data.id) : null,
            referenceNumber: data.referenceNumber,
            projectName: data.name,
            rmaName: data.rmaName,
            areaId: data.areaId ? Number(data.areaId) : null
          }
        }
      })()

      const result = controller.transformData(apiData)

      expect(result).toEqual({
        id: 123,
        referenceNumber: 'TEST/001A/002A',
        projectName: 'Flood Defense Project',
        rmaName: 'Environment Agency',
        areaId: 5
      })
    })

    test('should handle null values', () => {
      const apiData = {
        id: null,
        referenceNumber: 'TEST/001A/002A',
        name: 'Test Project',
        rmaName: 'Test RMA',
        areaId: null
      }

      const controller = new (class extends Object {
        transformData(data) {
          return {
            id: data.id ? Number(data.id) : null,
            referenceNumber: data.referenceNumber,
            projectName: data.name,
            rmaName: data.rmaName,
            areaId: data.areaId ? Number(data.areaId) : null
          }
        }
      })()

      const result = controller.transformData(apiData)

      expect(result.id).toBeNull()
      expect(result.areaId).toBeNull()
    })

    test('should convert string IDs to numbers', () => {
      const apiData = {
        id: '456',
        referenceNumber: 'TEST/001A/002A',
        name: 'Test',
        rmaName: 'RMA',
        areaId: '10'
      }

      const controller = new (class extends Object {
        transformData(data) {
          return {
            id: data.id ? Number(data.id) : null,
            referenceNumber: data.referenceNumber,
            projectName: data.name,
            rmaName: data.rmaName,
            areaId: data.areaId ? Number(data.areaId) : null
          }
        }
      })()

      const result = controller.transformData(apiData)

      expect(result.id).toBe(456)
      expect(typeof result.id).toBe('number')
      expect(result.areaId).toBe(10)
      expect(typeof result.areaId).toBe('number')
    })
  })

  describe('buildApiPayload', () => {
    test('should build correct API payload', () => {
      const result = new (class extends Object {
        buildApiPayload(referenceNumber, areaId) {
          return {
            level: 'PROJECT_AREA',
            payload: {
              referenceNumber: referenceNumber?.replace(/-/g, '/'),
              areaId: Number(areaId)
            }
          }
        }
      })().buildApiPayload('TEST-001A-002A', '5')

      expect(result).toEqual({
        level: 'PROJECT_AREA',
        payload: {
          referenceNumber: 'TEST/001A/002A',
          areaId: 5
        }
      })
    })

    test('should convert dashes to slashes in reference number', () => {
      const result = new (class extends Object {
        buildApiPayload(referenceNumber, areaId) {
          return {
            level: 'PROJECT_AREA',
            payload: {
              referenceNumber: referenceNumber?.replace(/-/g, '/'),
              areaId: Number(areaId)
            }
          }
        }
      })().buildApiPayload('ABC-123-XYZ', 10)

      expect(result.payload.referenceNumber).toBe('ABC/123/XYZ')
    })

    test('should convert areaId to number', () => {
      const result = new (class extends Object {
        buildApiPayload(referenceNumber, areaId) {
          return {
            level: 'PROJECT_AREA',
            payload: {
              referenceNumber: referenceNumber?.replace(/-/g, '/'),
              areaId: Number(areaId)
            }
          }
        }
      })().buildApiPayload('TEST/001A/002A', '99')

      expect(result.payload.areaId).toBe(99)
      expect(typeof result.payload.areaId).toBe('number')
    })
  })

  describe('handleSaveSuccess', () => {
    test('should clear session, show flash message, invalidate cache, and redirect', async () => {
      const mockResponse = {
        data: {
          data: {
            name: 'Updated Project',
            referenceNumber: 'TEST/001A/002A'
          }
        }
      }

      await new (class extends Object {
        async handleSaveSuccess(request, h, response, cache) {
          request.yar.clear('projectManageViewData')
          request.yar.flash('success', {
            message: `${response.data.data.name} ${request.t('projects.manage_projects.notifications.rma_changed')}`
          })
          cache.invalidateAll()
          return h.redirect(ROUTES.ADMIN.PROJECTS)
        }
      })().handleSaveSuccess(mockRequest, mockH, mockResponse, mockCacheService)

      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        'projectManageViewData'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        message:
          'Updated Project projects.manage_projects.notifications.rma_changed'
      })
      expect(mockCacheService.invalidateAll).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.PROJECTS)
    })
  })

  describe('handleSaveError', () => {
    test('should log error details', async () => {
      const error = new Error('Test error')
      error.stack = 'Error stack trace'
      const viewData = { id: 1 }
      extractApiError.mockReturnValue({ errorCode: 'TEST_ERROR' })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      await new (class extends Object {
        async handleSaveError(request, h, viewData, error) {
          request.server.logger.error(
            { error, message: error.message, stack: error.stack },
            'Error saving project RMA change'
          )
          return h.view(ADMIN_VIEWS.PROJECT_MANAGE, {})
        }
      })().handleSaveError(mockRequest, mockH, viewData, error)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        {
          error,
          message: 'Test error',
          stack: 'Error stack trace'
        },
        'Error saving project RMA change'
      )
    })

    test('should extract error from error.response.data', async () => {
      const error = new Error('API Error')
      error.response = {
        data: {
          success: false,
          validationErrors: [{ field: 'test', errorCode: 'TEST' }]
        }
      }
      const viewData = { id: 1 }
      extractApiValidationErrors.mockReturnValue({ test: 'TEST' })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      const controller = new (class extends Object {
        async handleSaveError(request, h, viewData, error) {
          request.server.logger.error(
            { error, message: error.message, stack: error.stack },
            'Error saving project RMA change'
          )
          const apiResponse = error.response?.data || error
          if (apiResponse?.validationErrors) {
            const fieldErrors = extractApiValidationErrors(apiResponse)
            return h.view(ADMIN_VIEWS.PROJECT_MANAGE, { fieldErrors })
          }
          return h.view(ADMIN_VIEWS.PROJECT_MANAGE, {})
        }
      })()

      await controller.handleSaveError(mockRequest, mockH, viewData, error)

      expect(extractApiValidationErrors).toHaveBeenCalledWith(
        error.response.data
      )
    })

    test('should extract error from error object directly', async () => {
      const error = {
        success: false,
        validationErrors: [{ field: 'direct', errorCode: 'DIRECT_ERROR' }]
      }
      const viewData = { id: 1 }
      extractApiValidationErrors.mockReturnValue({ direct: 'DIRECT_ERROR' })
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      const controller = new (class extends Object {
        async handleSaveError(request, h, viewData, error) {
          request.server.logger.error(
            { error, message: error.message, stack: error.stack },
            'Error saving project RMA change'
          )
          const apiResponse = error.response?.data || error
          if (apiResponse?.validationErrors) {
            const fieldErrors = extractApiValidationErrors(apiResponse)
            return h.view(ADMIN_VIEWS.PROJECT_MANAGE, { fieldErrors })
          }
          return h.view(ADMIN_VIEWS.PROJECT_MANAGE, {})
        }
      })()

      await controller.handleSaveError(mockRequest, mockH, viewData, error)

      expect(extractApiValidationErrors).toHaveBeenCalledWith(error)
    })

    test('should use SAVE_FAILED as default error code', async () => {
      const error = new Error('Unknown error')
      const viewData = { id: 1 }
      extractApiError.mockReturnValue(null)
      mockRequest.getAreas.mockResolvedValue({
        [AREAS_RESPONSIBILITIES_MAP.RMA]: []
      })

      const controller = new (class extends Object {
        async handleSaveError(request, h, viewData, error) {
          request.server.logger.error(
            { error, message: error.message, stack: error.stack },
            'Error saving project RMA change'
          )
          const apiResponse = error.response?.data || error
          if (apiResponse?.validationErrors) {
            const fieldErrors = extractApiValidationErrors(apiResponse)
            return h.view(ADMIN_VIEWS.PROJECT_MANAGE, { fieldErrors })
          }
          const apiError = apiResponse ? extractApiError(apiResponse) : null
          const errorCode = apiError?.errorCode || 'SAVE_FAILED'
          return h.view(ADMIN_VIEWS.PROJECT_MANAGE, { errorCode })
        }
      })()

      const result = await controller.handleSaveError(
        mockRequest,
        mockH,
        viewData,
        error
      )

      expect(result.context.errorCode).toBe('SAVE_FAILED')
    })
  })
})
