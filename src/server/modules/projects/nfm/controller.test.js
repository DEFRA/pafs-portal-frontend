import { describe, test, expect, beforeEach, vi } from 'vitest'
import { nfmController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  NFM_EXPERIENCE_LEVEL_OPTIONS,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { getDynamicBackLink } from './helpers/navigation-helpers.js'
import { processPayload } from './helpers/payload-helpers.js'
import { handleConditionalRedirect } from './helpers/redirect-helpers.js'

// Mock dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')
vi.mock('./helpers/navigation-helpers.js')
vi.mock('./helpers/payload-helpers.js')
vi.mock('./helpers/redirect-helpers.js')

describe('NFM Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: {},
      t: vi.fn((key) => key),
      logger: {
        error: vi.fn()
      }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getSessionData.mockReturnValue({
      slug: 'TEST-001',
      nfmSelectedMeasures: 'river_floodplain_restoration,leaky_barriers'
    })

    buildViewData.mockReturnValue({
      pageTitle: 'NFM',
      backLink: '/project/TEST-001'
    })

    validatePayload.mockReturnValue(null)
    getDynamicBackLink.mockReturnValue(null)
    processPayload.mockImplementation(() => {})
    saveProjectWithErrorHandling.mockResolvedValue(null)
    navigateToProjectOverview.mockReturnValue(
      mockH.redirect('/project/TEST-001').takeover()
    )
    handleConditionalRedirect.mockResolvedValue(null)
  })

  describe('getHandler', () => {
    describe('NFM Selected Measures', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
      })

      test('should render NFM view for selected measures', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(PROJECT_VIEWS.NFM, {
          pageTitle: 'NFM',
          backLink: '/project/TEST-001'
        })
      })

      test('should build view data with correct configuration', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.selected_measures',
            backLinkOptions: {
              targetEditURL: '/project/{referenceNumber}',
              conditionalRedirect: true
            },
            additionalData: expect.objectContaining({
              step: PROJECT_STEPS.NFM_SELECTED_MEASURES,
              projectSteps: PROJECT_STEPS,
              fieldType: 'checkbox',
              nfmMeasureOptions: expect.any(Array),
              columnWidth: 'full'
            })
          })
        )
      })

      test('should include all 8 NFM measure options', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        const callArgs = buildViewData.mock.calls[0][1]
        const options = callArgs.additionalData.nfmMeasureOptions

        expect(options).toHaveLength(8)
        expect(options[0].value).toBe(NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION)
        expect(options[1].value).toBe(NFM_MEASURES.LEAKY_BARRIERS)
        expect(options[2].value).toBe(NFM_MEASURES.OFFLINE_STORAGE)
        expect(options[3].value).toBe(NFM_MEASURES.WOODLAND)
        expect(options[4].value).toBe(NFM_MEASURES.HEADWATER_DRAINAGE)
        expect(options[5].value).toBe(NFM_MEASURES.RUNOFF_MANAGEMENT)
        expect(options[6].value).toBe(NFM_MEASURES.SALTMARSH_MANAGEMENT)
        expect(options[7].value).toBe(NFM_MEASURES.SAND_DUNE_MANAGEMENT)
      })

      test('should translate measure option labels', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockRequest.t).toHaveBeenCalledWith(
          'projects.nfm.selected_measures.options.river_floodplain_restoration'
        )
        expect(mockRequest.t).toHaveBeenCalledWith(
          'projects.nfm.selected_measures.options.leaky_barriers'
        )
      })
    })

    describe('NFM River Restoration', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_RIVER_RESTORATION)
      })

      test('should render NFM_RIVER_RESTORATION view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_RIVER_RESTORATION,
          expect.any(Object)
        )
      })

      test('should use dynamic back link if provided', async () => {
        const dynamicBackLink = { targetURL: '/custom-back-link' }
        getDynamicBackLink.mockReturnValue(dynamicBackLink)

        await nfmController.getHandler(mockRequest, mockH)

        expect(getDynamicBackLink).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_RIVER_RESTORATION,
          expect.any(Object)
        )
        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            backLinkOptions: dynamicBackLink
          })
        )
      })
    })

    describe('NFM Leaky Barriers', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LEAKY_BARRIERS)
      })

      test('should render NFM_LEAKY_BARRIERS view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_LEAKY_BARRIERS,
          expect.any(Object)
        )
      })

      test('should build view data with correct localKeyPrefix', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.leaky_barriers'
          })
        )
      })
    })

    describe('NFM Offline Storage', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_OFFLINE_STORAGE)
      })

      test('should render NFM_OFFLINE_STORAGE view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_OFFLINE_STORAGE,
          expect.any(Object)
        )
      })

      test('should build view data with correct localKeyPrefix', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.offline_storage'
          })
        )
      })
    })

    describe('NFM Runoff Management', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT)
      })

      test('should render NFM_RUNOFF_MANAGEMENT view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_RUNOFF_MANAGEMENT,
          expect.any(Object)
        )
      })

      test('should build view data with correct localKeyPrefix', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.runoff_management'
          })
        )
      })
    })

    describe('NFM Saltmarsh', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SALTMARSH)
      })

      test('should render NFM_SALTMARSH view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_SALTMARSH,
          expect.any(Object)
        )
      })

      test('should build view data with correct localKeyPrefix', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.saltmarsh'
          })
        )
      })
    })

    describe('NFM Sand Dune', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SAND_DUNE)
      })

      test('should render NFM_SAND_DUNE view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_SAND_DUNE,
          expect.any(Object)
        )
      })

      test('should build view data with correct localKeyPrefix', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.nfm.sand_dune'
          })
        )
      })
    })

    describe('NFM Land-use detail', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(
          PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND
        )
      })

      test('should render land-use detail template with before/after field names', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_LAND_USE_DETAIL,
          expect.any(Object)
        )

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              beforeFieldName:
                PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE,
              afterFieldName:
                PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER
            })
          })
        )
      })
    })

    describe('NFM Landowner Consent', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LANDOWNER_CONSENT)
      })

      test('should render NFM_LANDOWNER_CONSENT view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_LANDOWNER_CONSENT,
          expect.any(Object)
        )
      })

      test('should include all 4 landowner consent options in order', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        const callArgs = buildViewData.mock.calls[0][1]
        const options = callArgs.additionalData.nfmLandownerConsentOptions

        expect(options).toHaveLength(4)
        expect(options[0].value).toBe(
          NFM_LANDOWNER_CONSENT_OPTIONS.CONSENT_FULLY_SECURED
        )
        expect(options[1].value).toBe(
          NFM_LANDOWNER_CONSENT_OPTIONS.ENGAGED_BUT_NOT_FULLY_SECURED
        )
        expect(options[2].value).toBe(
          NFM_LANDOWNER_CONSENT_OPTIONS.INITIAL_CONTACT_MADE
        )
        expect(options[3].value).toBe(
          NFM_LANDOWNER_CONSENT_OPTIONS.NOT_YET_ENGAGED
        )
      })
    })
  })

  describe('postHandler', () => {
    describe('NFM Selected Measures', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
        mockRequest.payload = {
          nfmSelectedMeasures: [
            NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION,
            NFM_MEASURES.LEAKY_BARRIERS
          ]
        }
      })

      test('should validate payload before processing', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(validatePayload).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          expect.objectContaining({
            template: PROJECT_VIEWS.NFM,
            schema: expect.any(Object),
            viewData: expect.any(Object)
          })
        )
      })

      test('should return validation error if validation fails', async () => {
        const validationError = { error: 'validation failed' }
        validatePayload.mockReturnValue(validationError)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(validationError)
        expect(processPayload).not.toHaveBeenCalled()
      })

      test('should process payload after validation', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(processPayload).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_SELECTED_MEASURES,
          mockRequest.payload,
          {
            slug: 'TEST-001',
            nfmSelectedMeasures: 'river_floodplain_restoration,leaky_barriers'
          }
        )
      })

      test('should update session data with processed payload', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(updateSessionData).toHaveBeenCalledWith(
          mockRequest,
          mockRequest.payload
        )
      })

      test('should save project with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_SELECTED_MEASURES,
          expect.any(Object),
          PROJECT_VIEWS.NFM
        )
      })

      test('should return submission error if save fails', async () => {
        const submissionError = { error: 'submission failed' }
        saveProjectWithErrorHandling.mockResolvedValue(submissionError)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(submissionError)
        expect(handleConditionalRedirect).not.toHaveBeenCalled()
      })

      test('should handle conditional redirect after successful save', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(handleConditionalRedirect).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_SELECTED_MEASURES,
          mockRequest,
          mockH,
          expect.objectContaining({ slug: 'TEST-001' }),
          'TEST-001'
        )
      })

      test('should return conditional redirect if applicable', async () => {
        const conditionalRedirect = mockH.redirect('/custom-path').takeover()
        handleConditionalRedirect.mockResolvedValue(conditionalRedirect)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(conditionalRedirect)
      })

      test('should redirect to next step in sequence if no conditional redirect', async () => {
        handleConditionalRedirect.mockResolvedValue(null)

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockH.redirect).toHaveBeenCalledWith(
          '/project/TEST-001/nfm-river-restoration'
        )
        expect(mockH.takeover).toHaveBeenCalled()
      })

      test('should normalize single selected measure to array before validation', async () => {
        mockRequest.payload = {
          nfmSelectedMeasures: NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        }

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockRequest.payload.nfmSelectedMeasures).toEqual([
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        ])
        expect(validatePayload).toHaveBeenCalled()
      })

      test('should handle API errors gracefully', async () => {
        const error = new Error('API Error')
        const viewResponse = { view: 'error-view' }
        mockH.view.mockReturnValue(viewResponse)
        saveProjectWithErrorHandling.mockRejectedValue(error)
        extractApiError.mockReturnValue('Extracted error message')

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          'Error NFM POST',
          error
        )
        expect(mockH.view).toHaveBeenCalledWith(PROJECT_VIEWS.NFM, {
          pageTitle: 'NFM',
          backLink: '/project/TEST-001',
          error: 'Extracted error message'
        })
        expect(result).toBe(viewResponse)
      })
    })

    describe('NFM River Restoration', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_RIVER_RESTORATION)
        mockRequest.payload = {
          nfmRiverRestorationArea: '10.5',
          nfmRiverRestorationVolume: '500'
        }
      })

      test('should save with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_RIVER_RESTORATION,
          expect.any(Object),
          PROJECT_VIEWS.NFM_RIVER_RESTORATION
        )
      })

      test('should redirect to next step after successful save', async () => {
        // When leaky barriers is NOT selected, redirect goes to overview
        const overviewRedirect = mockH.redirect('/project/TEST-001').takeover()
        handleConditionalRedirect.mockResolvedValue(overviewRedirect)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(overviewRedirect)
        expect(handleConditionalRedirect).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_RIVER_RESTORATION,
          mockRequest,
          mockH,
          expect.any(Object),
          'TEST-001'
        )
      })

      test('should handle errors and re-render form', async () => {
        const error = new Error('Save failed')
        saveProjectWithErrorHandling.mockRejectedValue(error)
        extractApiError.mockReturnValue('Save error')

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_RIVER_RESTORATION,
          expect.objectContaining({
            error: 'Save error'
          })
        )
      })
    })

    describe('NFM Leaky Barriers', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LEAKY_BARRIERS)
        mockRequest.payload = {
          nfmLeakyBarriersVolume: '100',
          nfmLeakyBarriersLength: '5',
          nfmLeakyBarriersWidth: '2'
        }
      })

      test('should save with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_LEAKY_BARRIERS,
          expect.any(Object),
          PROJECT_VIEWS.NFM_LEAKY_BARRIERS
        )
      })

      test('should handle conditional redirect to overview', async () => {
        const overviewRedirect = mockH.redirect('/project/TEST-001').takeover()
        handleConditionalRedirect.mockResolvedValue(overviewRedirect)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(overviewRedirect)
      })

      test('should fall back to overview if no next step defined', async () => {
        // Leaky barriers is last step, should redirect to overview
        handleConditionalRedirect.mockResolvedValue(null)

        await nfmController.postHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).toHaveBeenCalledWith(
          'TEST-001',
          mockH
        )
      })

      test('should handle errors and re-render form', async () => {
        const error = new Error('Save failed')
        saveProjectWithErrorHandling.mockRejectedValue(error)
        extractApiError.mockReturnValue('Save error')

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_LEAKY_BARRIERS,
          expect.objectContaining({
            error: 'Save error'
          })
        )
      })
    })

    describe('NFM Offline Storage', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_OFFLINE_STORAGE)
        mockRequest.payload = {
          nfmOfflineStorageArea: '1.5',
          nfmOfflineStorageVolume: '100'
        }
      })

      test('should save with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_OFFLINE_STORAGE,
          expect.any(Object),
          PROJECT_VIEWS.NFM_OFFLINE_STORAGE
        )
      })

      test('should handle conditional redirect to overview', async () => {
        const overviewRedirect = mockH.redirect('/project/TEST-001').takeover()
        handleConditionalRedirect.mockResolvedValue(overviewRedirect)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(overviewRedirect)
      })

      test('should handle errors and re-render form', async () => {
        const error = new Error('Save failed')
        saveProjectWithErrorHandling.mockRejectedValue(error)
        extractApiError.mockReturnValue('Save error')

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_OFFLINE_STORAGE,
          expect.objectContaining({
            error: 'Save error'
          })
        )
      })
    })

    describe('NFM Runoff Management', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT)
        mockRequest.payload = {
          [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: '15.5',
          [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: '750'
        }
      })

      test('should save runoff management data with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_RUNOFF_MANAGEMENT,
          expect.any(Object),
          PROJECT_VIEWS.NFM_RUNOFF_MANAGEMENT
        )
      })

      test('should handle conditional redirect', async () => {
        const redirect = mockH.redirect('/next-step').takeover()
        handleConditionalRedirect.mockResolvedValue(redirect)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(redirect)
      })

      test('should handle validation errors', async () => {
        const validationError = { error: 'validation failed' }
        validatePayload.mockReturnValue(validationError)

        const result = await nfmController.postHandler(mockRequest, mockH)

        expect(result).toBe(validationError)
        expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
      })
    })

    describe('NFM Saltmarsh', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SALTMARSH)
        mockRequest.payload = {
          [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: '20.5',
          [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: '3.75'
        }
      })

      test('should save saltmarsh data with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_SALTMARSH,
          expect.any(Object),
          PROJECT_VIEWS.NFM_SALTMARSH
        )
      })

      test('should handle optional length field as null', async () => {
        mockRequest.payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH] = null

        await nfmController.postHandler(mockRequest, mockH)

        expect(processPayload).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_SALTMARSH,
          expect.any(Object),
          expect.any(Object)
        )
      })

      test('should handle save errors gracefully', async () => {
        const error = new Error('Save failed')
        saveProjectWithErrorHandling.mockRejectedValue(error)
        extractApiError.mockReturnValue('Saltmarsh save error')

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          'Error NFM POST',
          error
        )
      })
    })

    describe('NFM Sand Dune', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SAND_DUNE)
        mockRequest.payload = {
          [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: '25.5',
          [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: '4.25'
        }
      })

      test('should save sand dune data with correct payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_SAND_DUNE,
          expect.any(Object),
          PROJECT_VIEWS.NFM_SAND_DUNE
        )
      })

      test('should handle empty length as null', async () => {
        mockRequest.payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH] = ''

        await nfmController.postHandler(mockRequest, mockH)

        expect(processPayload).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_SAND_DUNE,
          expect.any(Object),
          expect.any(Object)
        )
      })

      test('should redirect to overview as final step', async () => {
        handleConditionalRedirect.mockResolvedValue(null)

        await nfmController.postHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).toHaveBeenCalledWith(
          'TEST-001',
          mockH
        )
      })
    })

    describe('NFM Land Use Change', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LAND_USE_CHANGE)
        mockRequest.payload = {
          nfmLandUseChange: 'woodland'
        }
      })

      test('should normalize single land-use value into array before validation', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(validatePayload).toHaveBeenCalled()
        expect(mockRequest.payload.nfmLandUseChange).toEqual(['woodland'])
      })

      test('should save using land-use-change payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_CHANGE,
          expect.any(Object),
          PROJECT_VIEWS.NFM_LAND_USE_CHANGE
        )
      })
    })

    describe('NFM Landowner Consent', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LANDOWNER_CONSENT)
        mockRequest.payload = {
          [PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT]:
            NFM_LANDOWNER_CONSENT_OPTIONS.CONSENT_FULLY_SECURED
        }
      })

      test('should save using landowner-consent payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_LANDOWNER_CONSENT,
          expect.any(Object),
          PROJECT_VIEWS.NFM_LANDOWNER_CONSENT
        )
      })
    })

    describe('NFM Experience', () => {
      beforeEach(() => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_EXPERIENCE)
        mockRequest.payload = {
          [PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL]:
            NFM_EXPERIENCE_LEVEL_OPTIONS.SOME_EXPERIENCE
        }
      })

      test('should render NFM_EXPERIENCE view', async () => {
        await nfmController.getHandler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          PROJECT_VIEWS.NFM_EXPERIENCE,
          expect.any(Object)
        )
      })

      test('should save using nfm-experience payload level', async () => {
        await nfmController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.NFM_EXPERIENCE_LEVEL,
          expect.any(Object),
          PROJECT_VIEWS.NFM_EXPERIENCE
        )
      })
    })
  })

  describe('Error Handling', () => {
    describe('Edge Cases', () => {
      test('should handle empty payload gracefully', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
        mockRequest.payload = {}

        await nfmController.postHandler(mockRequest, mockH)

        expect(processPayload).toHaveBeenCalledWith(
          PROJECT_STEPS.NFM_SELECTED_MEASURES,
          {},
          {
            slug: 'TEST-001',
            nfmSelectedMeasures: 'river_floodplain_restoration,leaky_barriers'
          }
        )
        expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {})
      })

      test('should handle missing session data', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
        getSessionData.mockReturnValue({})
        mockRequest.payload = { nfmSelectedMeasures: [] }

        // Should not throw error
        await expect(
          nfmController.postHandler(mockRequest, mockH)
        ).resolves.toBeDefined()
      })

      test('should log errors with proper context', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
        const error = new Error('Unexpected error')
        error.stack = 'Error stack trace'
        validatePayload.mockImplementation(() => {
          throw error
        })

        await nfmController.postHandler(mockRequest, mockH)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          'Error NFM POST',
          error
        )
      })
    })
  })

  describe('Integration Scenarios', () => {
    test('should handle complete NFM flow - select measures to completion', async () => {
      // Step 1: Select measures
      getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_SELECTED_MEASURES)
      mockRequest.payload = {
        nfmSelectedMeasures: [NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION]
      }

      await nfmController.postHandler(mockRequest, mockH)

      expect(validatePayload).toHaveBeenCalled()
      expect(processPayload).toHaveBeenCalled()
      expect(updateSessionData).toHaveBeenCalled()
      expect(saveProjectWithErrorHandling).toHaveBeenCalled()
      expect(handleConditionalRedirect).toHaveBeenCalled()
    })

    test('should maintain form data on validation error', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_RIVER_RESTORATION)
      mockRequest.payload = { nfmRiverRestorationArea: 'invalid' }

      const validationError = { error: 'validation failed', view: 'error-view' }
      validatePayload.mockReturnValue(validationError)

      const result = await nfmController.postHandler(mockRequest, mockH)

      expect(result).toBe(validationError)
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should redirect to overview when all NFM steps complete', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.NFM_LEAKY_BARRIERS)
      handleConditionalRedirect.mockResolvedValue(null)

      await nfmController.postHandler(mockRequest, mockH)

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
    })
  })
})
