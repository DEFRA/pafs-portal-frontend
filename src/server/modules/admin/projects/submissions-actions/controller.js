import {
  markProjectSubmittedToPol,
  resubmitProject
} from '../../../../common/services/project/project-service.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../../common/constants/routes.js'

const handleAction = async (
  request,
  h,
  { run, successTitle, successMessage, errorMessage, logMessage }
) => {
  const referenceNumber = request.params?.referenceNumber
  const authSession = getAuthSession(request)
  const accessToken = authSession?.accessToken

  try {
    const failed = await run(referenceNumber, accessToken)
    if (failed) {
      request.yar.flash('error', { message: request.t(errorMessage) })
      return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
    }
    request.yar.flash('success', {
      title: request.t(successTitle),
      message: request.t(successMessage)
    })
    return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
  } catch (error) {
    request.server.logger.error({ error, referenceNumber }, logMessage)
    request.yar.flash('error', { message: request.t(errorMessage) })
    return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
  }
}

export const submissionsActionsController = {
  /**
   * Mark a proposal as received in AIMS PD.
   * Stamps submitted_to_pol — no status change.
   */
  markInAimsPd(request, h) {
    return handleAction(request, h, {
      run: async (referenceNumber, accessToken) => {
        const result = await markProjectSubmittedToPol(
          referenceNumber,
          accessToken
        )
        return !result?.success
      },
      successTitle:
        'projects.failed_submissions.notifications.marked_in_aims_pd_title',
      successMessage:
        'projects.failed_submissions.notifications.marked_in_aims_pd',
      errorMessage: 'projects.failed_submissions.errors.mark_failed',
      logMessage: 'Failed to mark submission as received in AIMS PD'
    })
  },

  /**
   * Resend an already-submitted proposal to the external AIMS PD system.
   * Used by admins when the original submission to the external system failed.
   */
  resubmit(request, h) {
    return handleAction(request, h, {
      run: async (referenceNumber, accessToken) => {
        const result = await resubmitProject(referenceNumber, accessToken)
        return (
          !result?.success ||
          result?.data?.externalSubmission?.success === false
        )
      },
      successTitle:
        'projects.failed_submissions.notifications.resubmitted_title',
      successMessage: 'projects.failed_submissions.notifications.resubmitted',
      errorMessage: 'projects.failed_submissions.errors.resend_failed',
      logMessage: 'Failed to resubmit proposal to external system'
    })
  }
}
