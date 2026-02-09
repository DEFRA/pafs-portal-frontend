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
import { deleteProject } from '../../../common/services/project/project-service.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'

// Constants for polling configuration
const MAX_POLL_ATTEMPTS = 10
const POLL_INTERVAL_MS = 2000

const projectBenefitAreaLocalKeyPrefix = 'projects.project_benefit_area'

/**
 * Delay helper for synchronous polling
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
 * Check if status indicates completion
 */
function isUploadComplete(uploadStatus) {
  return (
    uploadStatus === UPLOAD_STATUS.READY ||
    uploadStatus === UPLOAD_STATUS.COMPLETE
  )
}

/**
 * Check if status indicates failure
 */
function isUploadFailed(uploadStatus) {
  return uploadStatus === UPLOAD_STATUS.FAILED
}

/**
 * Build failure result from rejection reason
 */
function buildFailureResult(rejectionReason) {
  const errors = rejectionReason
    ? [{ message: rejectionReason }]
    : [{ message: 'Upload failed' }]
  return { success: false, errors }
}

/**
 * Build timeout result
 */
function buildTimeoutResult() {
  return {
    success: false,
    timeout: true,
    errors: [{ message: 'Upload processing timeout - please try again' }]
  }
}

/**
 * Process single status check response
 */
function processStatusResponse(statusResponse) {
  if (!statusResponse.success || !statusResponse.data) {
    return null
  }
  const statusResponseData = statusResponse.data
  const { uploadStatus, rejectionReason } = statusResponseData.data

  if (isUploadComplete(uploadStatus)) {
    return { success: true, data: statusResponseData.data }
  }

  if (isUploadFailed(uploadStatus)) {
    return buildFailureResult(rejectionReason)
  }

  return null
}

/**
 * Execute single polling attempt
 */
async function executePollAttempt(uploadId, accessToken, attempt, logger) {
  try {
    logger.info({ uploadId, attempt }, 'Polling upload status')
    const statusResponse = await getUploadStatus(uploadId, accessToken)
    return processStatusResponse(statusResponse)
  } catch (error) {
    logger.error({ error, uploadId, attempt }, 'Error polling upload status')
    return null
  }
}

/**
 * Wait before next poll attempt
 */
async function waitBeforeNextPoll(attempt) {
  if (attempt < MAX_POLL_ATTEMPTS) {
    await delay(POLL_INTERVAL_MS)
  }
}

/**
 * Poll upload status synchronously
 */
async function pollUploadStatusSync(uploadId, accessToken, logger) {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    const result = await executePollAttempt(
      uploadId,
      accessToken,
      attempt,
      logger
    )

    if (result) {
      return result
    }

    await waitBeforeNextPoll(attempt)
  }

  return buildTimeoutResult()
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

  async uploadStatus(request, h) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const sessionData = getSessionData(request)
    const referenceNumber = request.params.referenceNumber || ''
    const uploadId = sessionData?.benefitAreaUploadId

    const benefitAreaUrl = ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )

    const overviewUrl = ROUTES.PROJECT.OVERVIEW.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )

    if (!uploadId) {
      return h.redirect(benefitAreaUrl)
    }

    try {
      request.logger.info({ uploadId }, 'Starting synchronous upload polling')

      const pollResult = await pollUploadStatusSync(
        uploadId,
        accessToken,
        request.logger
      )

      if (pollResult.success) {
        storeUploadSuccess(request, pollResult.data.filename)
        request.logger.info({ uploadId }, 'Upload successful')
        // Redirect to overview page on success
        return h.redirect(overviewUrl)
      } else {
        storeUploadErrors(request, pollResult.errors)
        request.logger.warn({ uploadId }, 'Upload failed')
        // Redirect back to benefit area page on error
        return h.redirect(benefitAreaUrl)
      }
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

      // Redirect to overview page
      return navigateToProjectOverview(referenceNumber, h)
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
  getDeleteHandler: (request, h) => controller.getDeleteHandler(request, h),
  postDeleteHandler: (request, h) => controller.postDeleteHandler(request, h)
}
