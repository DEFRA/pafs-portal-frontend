import { describe, it, expect, beforeEach, vi } from 'vitest'
import { organisationManageController } from './controller.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  ADMIN_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../../common/constants/common.js'
import { ORGANISATION_SESSION_KEYS } from '../../../../common/constants/organisations.js'

vi.mock('../../../../common/services/areas/areas-service.js')
vi.mock('../../../../common/helpers/security/encoder.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/organisations.js')
vi.mock('../../../../common/helpers/areas/areas-helper.js')

describe('OrganisationManageController', () => {
  let mockRequest
  let mockH
  let mockAreasService

  beforeEach(() => {
    mockAreasService = {
      upsertArea: vi.fn()
    }

    mockRequest = {
      params: {},
      payload: {},
      server: {},
      logger: {
        error: vi.fn()
      },
      yar: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn(),
        flash: vi.fn()
      },
      t: vi.fn((key) => key),
      getAreas: vi.fn().mockResolvedValue({
        Authority: [],
        'PSO Area': [],
        'EA Area': [],
        RMA: []
      })
    }

    mockH = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      response: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    it('should redirect if typeConfig is invalid', async () => {
      mockRequest.params = { orgType: 'invalid' }

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
    })

    it('should render form for authority add mode', async () => {
      mockRequest.params = { orgType: 'authority' }
      mockRequest.yar.get.mockReturnValue({ areaType: 'Authority' })

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          isEditMode: false,
          step: 'authority'
        })
      )
    })

    it('should render form for PSO edit mode', async () => {
      mockRequest.params = { orgType: 'pso', encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({
        areaType: 'pso',
        name: 'Test PSO'
      })

      const { verifyOrganisationType } =
        await import('../helpers/organisations.js')
      verifyOrganisationType.mockReturnValue(false)

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          isEditMode: true,
          step: 'pso'
        })
      )
    })

    it('should redirect if no formData in add mode', async () => {
      mockRequest.params = { orgType: 'rma' }
      mockRequest.yar.get.mockReturnValue(null)

      const { getOrganisationTypeSelectionPath } =
        await import('../helpers/organisations.js')
      getOrganisationTypeSelectionPath.mockReturnValue(
        '/admin/organisations/add'
      )

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/organisations/add')
    })

    it('should redirect if organisation type mismatch in edit mode', async () => {
      mockRequest.params = { orgType: 'authority', encodedId: 'abc123' }
      mockRequest.yar.get.mockReturnValue({ areaType: 'rma' })

      const { verifyOrganisationType } =
        await import('../helpers/organisations.js')
      verifyOrganisationType.mockReturnValue(true)

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
    })
  })

  describe('POST handler', () => {
    beforeEach(async () => {
      const areasServiceModule =
        await import('../../../../common/services/areas/areas-service.js')
      areasServiceModule.createAreasService = vi
        .fn()
        .mockReturnValue(mockAreasService)

      const authModule =
        await import('../../../../common/helpers/auth/session-manager.js')
      authModule.getAuthSession = vi
        .fn()
        .mockReturnValue({ accessToken: 'test-token' })

      const errorModule =
        await import('../../../../common/helpers/error-renderer/index.js')
      errorModule.extractJoiErrors = vi.fn().mockReturnValue(null)
      errorModule.extractApiValidationErrors = vi.fn()
      errorModule.extractApiError = vi.fn()

      const orgHelpers = await import('../helpers/organisations.js')
      orgHelpers.dateToISOString = vi.fn().mockReturnValue('2025-12-31')
      orgHelpers.detectChanges = vi.fn().mockReturnValue({ hasChanges: true })
    })

    it('should redirect if typeConfig is invalid', async () => {
      mockRequest.params = { orgType: 'invalid' }

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
    })

    it('should create authority successfully', async () => {
      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: 'Test Authority',
        identifier: 'AUTH001',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      mockAreasService.upsertArea.mockResolvedValue({ id: '1' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).toHaveBeenCalledWith({
        data: expect.objectContaining({
          areaType: AREAS_RESPONSIBILITIES_MAP.AUTHORITY,
          name: 'Test Authority',
          identifier: 'AUTH001'
        }),
        accessToken: 'test-token'
      })
      expect(mockRequest.yar.clear).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA
      )
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
    })

    it('should create PSO successfully', async () => {
      mockRequest.params = { orgType: 'pso' }
      mockRequest.payload = {
        name: 'Test PSO',
        parentId: '10',
        subType: 'RFCC-01',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      mockAreasService.upsertArea.mockResolvedValue({ id: '2' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).toHaveBeenCalledWith({
        data: expect.objectContaining({
          areaType: AREAS_RESPONSIBILITIES_MAP.PSO,
          name: 'Test PSO',
          parentId: '10',
          subType: 'RFCC-01'
        }),
        accessToken: 'test-token'
      })
    })

    it('should create RMA successfully', async () => {
      mockRequest.params = { orgType: 'rma' }
      mockRequest.payload = {
        name: 'Test RMA',
        identifier: 'RMA001',
        parentId: '20',
        subType: 'AUTH001',
        'endDate-day': '31',
        'endDate-month': '12',
        'endDate-year': '2025'
      }
      mockRequest.yar.get.mockReturnValue({})

      mockAreasService.upsertArea.mockResolvedValue({ id: '3' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).toHaveBeenCalledWith({
        data: expect.objectContaining({
          areaType: AREAS_RESPONSIBILITIES_MAP.RMA,
          name: 'Test RMA',
          identifier: 'RMA001',
          parentId: '20',
          subType: 'AUTH001',
          endDate: '2025-12-31'
        }),
        accessToken: 'test-token'
      })
    })

    it('should update existing organisation', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      decodeUserId.mockReturnValue('123')

      mockRequest.params = { orgType: 'authority', encodedId: 'abc123' }
      mockRequest.payload = {
        name: 'Updated Authority',
        identifier: 'AUTH002',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({
        originalData: { name: 'Old Name' }
      })

      mockAreasService.upsertArea.mockResolvedValue({ id: '123' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: '123',
          name: 'Updated Authority'
        }),
        accessToken: 'test-token'
      })
    })

    it('should show validation errors', async () => {
      const { extractJoiErrors } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractJoiErrors.mockReturnValue({ name: 'NAME_REQUIRED' })

      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: '',
        identifier: 'AUTH001',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          fieldErrors: { name: 'NAME_REQUIRED' }
        })
      )
      expect(mockAreasService.upsertArea).not.toHaveBeenCalled()
    })

    it('should handle API validation errors', async () => {
      const { extractApiValidationErrors } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractApiValidationErrors.mockReturnValue({
        identifier: 'IDENTIFIER_DUPLICATE'
      })

      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: 'Test Authority',
        identifier: 'AUTH001',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      const apiError = {
        response: {
          data: {
            validationErrors: { identifier: 'IDENTIFIER_DUPLICATE' }
          }
        }
      }
      mockAreasService.upsertArea.mockRejectedValue(apiError)

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          fieldErrors: { identifier: 'IDENTIFIER_DUPLICATE' }
        })
      )
    })

    it('should handle API error codes', async () => {
      const { extractApiError } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractApiError.mockReturnValue({ errorCode: 'PARENT_NOT_FOUND' })

      mockRequest.params = { orgType: 'pso' }
      mockRequest.payload = {
        name: 'Test PSO',
        parentId: '999',
        subType: 'RFCC-01',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      const apiError = {
        response: {
          data: { errorCode: 'PARENT_NOT_FOUND' }
        }
      }
      mockAreasService.upsertArea.mockRejectedValue(apiError)

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          errorCode: 'PARENT_NOT_FOUND'
        })
      )
    })

    it('should handle unexpected errors', async () => {
      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: 'Test Authority',
        identifier: 'AUTH001',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      const error = new Error('Network error')
      mockAreasService.upsertArea.mockRejectedValue(error)

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockRequest.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          errorCode: 'SAVE_FAILED'
        })
      )
    })

    it('should skip save if no changes detected in edit mode', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      const { detectChanges } = await import('../helpers/organisations.js')

      decodeUserId.mockReturnValue('123')
      detectChanges.mockReturnValue({ hasChanges: false })

      mockRequest.params = { orgType: 'authority', encodedId: 'abc123' }
      mockRequest.payload = {
        name: 'Same Name',
        identifier: 'AUTH001',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({
        originalData: { name: 'Same Name' }
      })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
    })

    it('should redirect if encodedId is invalid in edit mode', async () => {
      const { decodeUserId } =
        await import('../../../../common/helpers/security/encoder.js')
      decodeUserId.mockReturnValue(null)

      mockRequest.params = { orgType: 'authority', encodedId: 'invalid' }
      mockRequest.payload = {}

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.ORGANISATIONS)
      expect(mockAreasService.upsertArea).not.toHaveBeenCalled()
    })

    it('should trim whitespace from fields', async () => {
      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: '  Test Authority  ',
        identifier: '  AUTH001  ',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      mockAreasService.upsertArea.mockResolvedValue({ id: '1' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockAreasService.upsertArea).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Authority',
          identifier: 'AUTH001'
        }),
        accessToken: 'test-token'
      })
    })

    it('should handle empty optional fields', async () => {
      mockRequest.params = { orgType: 'authority' }
      mockRequest.payload = {
        name: 'Test Authority',
        identifier: '',
        'endDate-day': '',
        'endDate-month': '',
        'endDate-year': ''
      }
      mockRequest.yar.get.mockReturnValue({})

      mockAreasService.upsertArea.mockResolvedValue({ id: '1' })

      await organisationManageController.postOrganisationHandler(
        mockRequest,
        mockH
      )

      const callArgs = mockAreasService.upsertArea.mock.calls[0][0]
      expect(callArgs.data.identifier).toBeUndefined()
    })
  })

  describe('Dropdown options', () => {
    it('should return empty arrays on error', async () => {
      mockRequest.getAreas.mockRejectedValue(new Error('API error'))
      mockRequest.params = { orgType: 'authority' }
      mockRequest.yar.get.mockReturnValue({ areaType: 'Authority' })

      await organisationManageController.getOrganisationHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_MANAGE,
        expect.objectContaining({
          authorityOptions: [],
          psoOptions: [],
          eaAreaOptions: [],
          rfccOptions: []
        })
      )
    })
  })
})
