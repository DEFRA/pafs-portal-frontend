import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  REFERENCE_NUMBER_PARAM,
  UPLOAD_STATUS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  initiateFileUpload,
  getUploadStatus
} from '../../../common/services/file-upload/file-upload-service.js'
import {
  deleteProject,
  getBenefitAreaFileDownloadUrl
} from '../../../common/services/project/project-service.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'

const projectBenefitAreaLocalKeyPrefix = 'projects.project_benefit_area'

/**
 * Retrieve and clear upload errors from session
 */
function getAndClearUploadErrors(request) {
  const sessionData = getSessionData(request)
  const uploadErrors = sessionData?.benefitAreaUploadErrors

  if (uploadErrors) {
    updateSessionData(request, {
      benefitAreaUploadErrors: null,
      benefitAreaUploadId: null
    })
  }

  return uploadErrors
}

/**
 * Build redirect path for upload status polling
 */
function buildUploadRedirectPath(referenceNumber) {
  return ROUTES.PROJECT.EDIT.BENEFIT_AREA_UPLOAD_STATUS.replace(
    REFERENCE_NUMBER_PARAM,
    referenceNumber
  )
}

/**
 * Initiate upload session with CDP
 */
async function initiateUploadSession(
  sessionData,
  referenceNumber,
  accessToken
) {
  const redirectPath = buildUploadRedirectPath(referenceNumber)

  return initiateFileUpload(
    {
      entityType: 'project_benefit_area',
      entityId: sessionData.id || null,
      reference: referenceNumber || sessionData.slug,
      redirect: redirectPath,
      metadata: {
        step: 'benefit_area'
      }
    },
    accessToken
  )
}

/**
 * Store upload session in session storage
 */
function storeUploadSession(request, uploadId, uploadUrl) {
  updateSessionData(request, {
    benefitAreaUploadId: uploadId,
    benefitAreaUploadUrl: uploadUrl
  })
}

/**
 * Process single status check response
 */
function processStatusResponse(statusResponse) {
  if (!statusResponse.success || !statusResponse.data) {
    return null
  }
  const statusResponseData = statusResponse.data
  if (!statusResponseData?.data) {
    return null
  }
  const { uploadStatus, rejectionReason } = statusResponseData.data

  if (
    uploadStatus === UPLOAD_STATUS.READY ||
    uploadStatus === UPLOAD_STATUS.COMPLETE
  ) {
    return { success: true, data: statusResponseData.data }
  }

  if (uploadStatus === UPLOAD_STATUS.FAILED) {
    const errors = rejectionReason
      ? [{ message: rejectionReason }]
      : [{ message: 'Upload failed' }]
    return { success: false, errors }
  }

  return null
}

/**
 * Store upload success in session
 */
function storeUploadSuccess(request, filename) {
  updateSessionData(request, {
    benefitAreaFileName: filename,
    benefitAreaUploadId: null,
    benefitAreaUploadUrl: null,
    benefitAreaUploadErrors: null
  })
}

/**
 * Store upload errors in session (preserves uploadUrl for retry)
 */
function storeUploadErrors(request, errors) {
  updateSessionData(request, {
    benefitAreaUploadErrors: errors,
    benefitAreaUploadId: null,
    benefitAreaFileName: null
    // benefitAreaUploadUrl is intentionally preserved for retry
  })
}

class BenefitAreaController {
  _getViewData(request, additionalData = {}) {
    const sessionData = getSessionData(request)
    const { localKeyPrefix } = additionalData
    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions: {
        targetURL: ROUTES.GENERAL.HOME,
        conditionalRedirect: true
      },
      benefitAreaFileName:
        sessionData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME] || null,
      additionalData
    })
  }

  async get(request, h) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const sessionData = getSessionData(request)
    if (sessionData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]) {
      return navigateToProjectOverview(
        sessionData[PROJECT_PAYLOAD_FIELDS.SLUG],
        h
      )
    }
    const referenceNumber = request.params.referenceNumber || ''
    const errorCode = request.query.error

    const uploadErrors = getAndClearUploadErrors(request)

    try {
      const uploadSession = await initiateUploadSession(
        sessionData,
        referenceNumber,
        accessToken
      )

      if (!uploadSession.success) {
        const apiError = extractApiError(uploadSession)
        return h.view(
          PROJECT_VIEWS.BENEFIT_AREA,
          this._getViewData(request, {
            localKeyPrefix: projectBenefitAreaLocalKeyPrefix,
            errorCode: apiError?.errorCode,
            uploadErrors
          })
        )
      }

      const { uploadId, uploadUrl } = uploadSession.data.data
      storeUploadSession(request, uploadId, uploadUrl)

      return h.view(
        PROJECT_VIEWS.BENEFIT_AREA,
        this._getViewData(request, {
          localKeyPrefix: projectBenefitAreaLocalKeyPrefix,
          uploadUrl,
          errorCode,
          uploadErrors
        })
      )
    } catch (error) {
      request.logger.error({ error }, 'Failed to initiate file upload')
      return h.view(
        PROJECT_VIEWS.BENEFIT_AREA,
        this._getViewData(request, {
          localKeyPrefix: projectBenefitAreaLocalKeyPrefix,
          errorCode: 'UPLOAD_INITIATION_FAILED',
          uploadErrors
        })
      )
    }
  }

  _getBenefitAreaEditLink(referenceNumber) {
    return ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )
  }

  async uploadStatus(request, h) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const sessionData = getSessionData(request)
    const referenceNumber = request.params.referenceNumber || ''
    const uploadId = sessionData?.benefitAreaUploadId

    const benefitAreaUrl = this._getBenefitAreaEditLink(referenceNumber)
    const overviewUrl = ROUTES.PROJECT.OVERVIEW.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )
    const selfUrl = ROUTES.PROJECT.EDIT.BENEFIT_AREA_UPLOAD_STATUS.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )

    if (!uploadId) {
      return h.redirect(benefitAreaUrl)
    }

    try {
      const statusResponse = await getUploadStatus(uploadId, accessToken)
      const result = processStatusResponse(statusResponse)

      if (result?.success) {
        storeUploadSuccess(request, result.data.filename)
        request.logger.info({ uploadId }, 'Upload successful')
        request.metrics?.counter('proposalStepVisit', 1, {
          step: 'BENEFIT_AREA',
          result: 'submitted'
        })
        return h.redirect(overviewUrl)
      }

      if (result && !result.success) {
        storeUploadErrors(request, result.errors)
        request.logger.warn({ uploadId }, 'Upload failed')
        request.metrics?.counter('proposalStepVisit', 1, {
          step: 'BENEFIT_AREA',
          result: 'validation_error'
        })
        return h.redirect(benefitAreaUrl)
      }

      // Still PENDING - render processing page, browser will auto-refresh
      return h.view(
        PROJECT_VIEWS.BENEFIT_AREA_PROCESSING,
        this._getViewData(request, {
          localKeyPrefix: projectBenefitAreaLocalKeyPrefix,
          selfUrl
        })
      )
    } catch (error) {
      request.logger.error({ error, uploadId }, 'Failed to check upload status')
      storeUploadErrors(request, [
        { message: 'Failed to check upload status. Please try again.' }
      ])
      return h.redirect(benefitAreaUrl)
    }
  }

  async getDeleteHandler(request, h) {
    return h.view(
      PROJECT_VIEWS.BENEFIT_AREA_DELETE,
      this._getViewData(request, {
        localKeyPrefix: `${projectBenefitAreaLocalKeyPrefix}.delete`
      })
    )
  }

  async download(request, h) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const { referenceNumber } = request.params

    const result = await getBenefitAreaFileDownloadUrl(
      referenceNumber,
      accessToken
    )

    if (!result.success || !result.data?.downloadUrl) {
      request.logger.warn(
        { referenceNumber },
        'Failed to get benefit area file download URL'
      )
      return h.redirect(
        ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
      )
    }

    return h.redirect(result.data.downloadUrl)
  }

  async postDeleteHandler(request, h) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const referenceNumber = request.params.referenceNumber || ''

    try {
      const deleteResult = await deleteProject(referenceNumber, accessToken)

      if (!deleteResult.success) {
        request.logger.warn(
          { referenceNumber, error: deleteResult.data },
          'Failed to delete benefit area file'
        )

        const apiError = extractApiError(deleteResult)
        return h.view(
          PROJECT_VIEWS.BENEFIT_AREA_DELETE,
          this._getViewData(request, {
            localKeyPrefix: `${projectBenefitAreaLocalKeyPrefix}.delete`,
            errorCode: apiError?.errorCode,
            errorMessage:
              apiError?.message || 'Failed to delete benefit area file'
          })
        )
      }

      request.logger.info(
        { referenceNumber },
        'Benefit area file deleted successfully'
      )

      // Clear any upload session data
      updateSessionData(request, {
        benefitAreaUploadId: null,
        benefitAreaUploadUrl: null,
        benefitAreaUploadErrors: null,
        benefitAreaFileName: null,
        benefitAreaFileSize: null,
        benefitAreaContentType: null,
        benefitAreaFileS3Bucket: null,
        benefitAreaFileS3Key: null,
        benefitAreaFileDownloadUrl: null,
        benefitAreaFileDownloadExpiry: null
      })

      // Redirect to benefit area edit page after deletion
      const benefitAreaEditLink = this._getBenefitAreaEditLink(referenceNumber)
      return h.redirect(benefitAreaEditLink).takeover()
    } catch (error) {
      request.logger.error(
        { error, referenceNumber },
        'Error deleting benefit area file'
      )
      return h.view(
        PROJECT_VIEWS.BENEFIT_AREA_DELETE,
        this._getViewData(request, {
          localKeyPrefix: `${projectBenefitAreaLocalKeyPrefix}.delete`,
          errorCode: 'DELETE_FAILED',
          errorMessage:
            'An error occurred while deleting the file. Please try again.'
        })
      )
    }
  }
}

const controller = new BenefitAreaController()

export const benefitAreaController = {
  getHandler: (request, h) => controller.get(request, h),
  uploadStatusHandler: (request, h) => controller.uploadStatus(request, h),
  downloadHandler: (request, h) => controller.download(request, h),
  getDeleteHandler: (request, h) => controller.getDeleteHandler(request, h),
  postDeleteHandler: (request, h) => controller.postDeleteHandler(request, h)
}
