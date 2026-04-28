import {
  updateProjectStatus,
  resubmitProject
} from '../../../../common/services/project/project-service.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { PROJECT_STATUS } from '../../../../common/constants/projects.js'

export const submissionsActionsController = {
  /**
   * Mark a proposal as received in AIMS PD.
   * Transitions status from 'submitted' → 'approved', removing it from the
   * failed submissions list.
   */
  async markInAimsPd(request, h) {
    const referenceNumber = request.params?.referenceNumber
    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken

    try {
      const result = await updateProjectStatus(
        referenceNumber,
        PROJECT_STATUS.APPROVED,
        accessToken
      )

      if (!result?.success) {
        request.yar.flash('error', {
          message: request.t('projects.failed_submissions.errors.mark_failed')
        })
        return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
      }

      request.yar.flash('success', {
        message: request.t(
          'projects.failed_submissions.notifications.marked_in_aims_pd'
        )
      })
      return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
    } catch (error) {
      request.server.logger.error(
        { error, referenceNumber },
        'Failed to mark submission as received in AIMS PD'
      )
      request.yar.flash('error', {
        message: request.t('projects.failed_submissions.errors.mark_failed')
      })
      return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
    }
  },

  /**
   * Resend an already-submitted proposal to the external AIMS PD system.
   * Used by admins when the original submission to the external system failed.
   */
  async resubmit(request, h) {
    const referenceNumber = request.params?.referenceNumber
    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken

    try {
      const result = await resubmitProject(referenceNumber, accessToken)

      if (
        !result?.success ||
        result?.data?.externalSubmission?.success === false
      ) {
        request.yar.flash('error', {
          message: request.t('projects.failed_submissions.errors.resend_failed')
        })
        return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
      }

      request.yar.flash('success', {
        message: request.t(
          'projects.failed_submissions.notifications.resubmitted'
        )
      })
      return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
    } catch (error) {
      request.server.logger.error(
        { error, referenceNumber },
        'Failed to resubmit proposal to external system'
      )
      request.yar.flash('error', {
        message: request.t('projects.failed_submissions.errors.resend_failed')
      })
      return h.redirect(ROUTES.ADMIN.SUBMISSIONS)
    }
  }
}
