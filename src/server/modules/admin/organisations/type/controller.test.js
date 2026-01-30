import { describe, it, expect, beforeEach, vi } from 'vitest'
import { organisationTypeController } from './controller.js'
import { ADMIN_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { ORGANISATION_SESSION_KEYS } from '../../../../common/constants/organisations.js'

vi.mock('../../../../common/helpers/error-renderer/index.js')

describe('OrganisationTypeController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      payload: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis()
    }
  })

  describe('GET handler', () => {
    it('should render organisation type selection view', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      await organisationTypeController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_TYPE,
        expect.objectContaining({
          pageTitle: 'organisations.manage.select_type.title',
          heading: 'organisations.manage.select_type.heading',
          backLink: ROUTES.ADMIN.ORGANISATIONS
        })
      )
    })

    it('should include organisation type options', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      await organisationTypeController.getHandler(mockRequest, mockH)

      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.organisationTypeItems).toBeDefined()
      expect(viewData.organisationTypeItems.length).toBeGreaterThan(0)
      expect(viewData.organisationTypeItems[0]).toEqual({
        value: '',
        text: 'organisations.manage.select_type.select_option'
      })
    })

    it('should include session data if available', async () => {
      const sessionData = { areaType: 'Authority' }
      mockRequest.yar.get.mockReturnValue(sessionData)

      await organisationTypeController.getHandler(mockRequest, mockH)

      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.formData).toEqual(sessionData)
    })

    it('should include empty object if no session data', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      await organisationTypeController.getHandler(mockRequest, mockH)

      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.formData).toEqual({})
    })
  })

  describe('POST handler', () => {
    it('should redirect to authority form for Authority type', async () => {
      mockRequest.payload = { areaType: 'Authority' }

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA,
        { areaType: 'Authority' }
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${ROUTES.ADMIN.ORGANISATIONS}/authority`
      )
    })

    it('should redirect to pso form for PSO Area type', async () => {
      mockRequest.payload = { areaType: 'PSO Area' }

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA,
        { areaType: 'PSO Area' }
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${ROUTES.ADMIN.ORGANISATIONS}/pso`
      )
    })

    it('should redirect to rma form for RMA type', async () => {
      mockRequest.payload = { areaType: 'RMA' }

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA,
        { areaType: 'RMA' }
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${ROUTES.ADMIN.ORGANISATIONS}/rma`
      )
    })

    it('should show validation errors if no type selected', async () => {
      const { extractJoiErrors } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractJoiErrors.mockReturnValue({ areaType: 'AREA_TYPE_REQUIRED' })

      mockRequest.payload = { areaType: '' }
      mockRequest.yar.get.mockReturnValue({})

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_TYPE,
        expect.objectContaining({
          fieldErrors: { areaType: 'AREA_TYPE_REQUIRED' }
        })
      )
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    it('should show validation errors for invalid type', async () => {
      const { extractJoiErrors } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractJoiErrors.mockReturnValue({ areaType: 'AREA_TYPE_INVALID' })

      mockRequest.payload = { areaType: 'InvalidType' }
      mockRequest.yar.get.mockReturnValue({})

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        ADMIN_VIEWS.ORGANISATION_TYPE,
        expect.objectContaining({
          fieldErrors: { areaType: 'AREA_TYPE_INVALID' }
        })
      )
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    it('should set session data even when validation fails', async () => {
      const { extractJoiErrors } =
        await import('../../../../common/helpers/error-renderer/index.js')
      extractJoiErrors.mockReturnValue({ areaType: 'AREA_TYPE_REQUIRED' })

      mockRequest.payload = { areaType: '' }
      mockRequest.yar.get.mockReturnValue({})

      await organisationTypeController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        ORGANISATION_SESSION_KEYS.ORGANISATION_DATA,
        { areaType: '' }
      )
    })
  })
})
