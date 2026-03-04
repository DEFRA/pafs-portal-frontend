import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { updateProjectStatus } from '../../../../common/services/project/project-service.js'
import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_STATUS,
  REFERENCE_NUMBER_PARAM
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

class ArchiveController {
  async archive(request, h) {
    const { referenceNumber } = request.params
    const session = getAuthSession(request)
    const accessToken = session?.accessToken

    try {
      const result = await updateProjectStatus(
        referenceNumber,
        PROJECT_STATUS.ARCHIVED,
        accessToken
      )

      if (!result.success) {
        request.server?.logger?.error(
          { referenceNumber, errors: result.errors },
          'Failed to archive project'
        )
        return h
          .redirect(
            ROUTES.PROJECT.OVERVIEW.replace(
              REFERENCE_NUMBER_PARAM,
              referenceNumber
            )
          )
          .takeover()
      }

      return h.redirect(
        ROUTES.PROJECT.ARCHIVE_CONFIRMATION.replace(
          REFERENCE_NUMBER_PARAM,
          referenceNumber
        )
      )
    } catch (error) {
      request.server?.logger?.error(
        { error: error.message, referenceNumber },
        'Error archiving project'
      )
      return h
        .redirect(
          ROUTES.PROJECT.OVERVIEW.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    }
  }

  archiveConfirmation(request, h) {
    const { referenceNumber } = request.params

    return h.view(PROJECT_VIEWS.ARCHIVE_CONFIRMATION, {
      pageTitle: request.t('projects.confirm_archive.title'),
      referenceNumber
    })
  }

  async revertToDraft(request, h) {
    const { referenceNumber } = request.params
    const session = getAuthSession(request)
    const accessToken = session?.accessToken

    try {
      const result = await updateProjectStatus(
        referenceNumber,
        PROJECT_STATUS.DRAFT,
        accessToken
      )

      if (!result.success) {
        request.server?.logger?.error(
          { referenceNumber, errors: result.errors },
          'Failed to revert project to draft'
        )
      }
    } catch (error) {
      request.server?.logger?.error(
        { error: error.message, referenceNumber },
        'Error reverting project to draft'
      )
    }

    return h.redirect(
      ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    )
  }
}

const controller = new ArchiveController()

export const archiveController = {
  archiveHandler: (request, h) => controller.archive(request, h),
  confirmationHandler: (request, h) =>
    controller.archiveConfirmation(request, h),
  revertToDraftHandler: (request, h) => controller.revertToDraft(request, h)
}
