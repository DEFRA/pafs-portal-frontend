import { describe, test, expect, beforeEach, vi } from 'vitest'
import { submissionsActionsController } from './controller.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { PROJECT_STATUS } from '../../../../common/constants/projects.js'

vi.mock('../../../../common/services/project/project-service.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')

const { updateProjectStatus } =
  await import('../../../../common/services/project/project-service.js')

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')

describe('submissionsActionsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: { referenceNumber: 'THC501E-000A-017A' },
      server: {
        logger: {
          error: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn()
        }
      },
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn()
      }
    }

    mockH = {
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    getAuthSession.mockReturnValue({ accessToken: 'test-access-token' })
  })

  describe('markInAimsPd', () => {
    test('should update project status to approved and flash success on success', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'THC501E-000A-017A',
        PROJECT_STATUS.APPROVED,
        'test-access-token'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        message: 'projects.failed_submissions.notifications.marked_in_aims_pd'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
    })

    test('should redirect to submissions on success', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      const result = await submissionsActionsController.markInAimsPd(
        mockRequest,
        mockH
      )

      expect(result).toEqual({ redirect: ROUTES.ADMIN.SUBMISSIONS })
    })

    test('should flash error and redirect when API returns success: false', async () => {
      updateProjectStatus.mockResolvedValue({
        success: false,
        errors: ['Not found']
      })

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'projects.failed_submissions.errors.mark_failed'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
    })

    test('should flash error and redirect when API returns null', async () => {
      updateProjectStatus.mockResolvedValue(null)

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'projects.failed_submissions.errors.mark_failed'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
    })

    test('should flash error and redirect when updateProjectStatus throws', async () => {
      updateProjectStatus.mockRejectedValue(new Error('Network error'))

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          referenceNumber: 'THC501E-000A-017A'
        }),
        'Failed to mark submission as received in AIMS PD'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'projects.failed_submissions.errors.mark_failed'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
    })

    test('should use accessToken from auth session', async () => {
      getAuthSession.mockReturnValue({ accessToken: 'bearer-xyz' })
      updateProjectStatus.mockResolvedValue({ success: true })

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        expect.any(String),
        PROJECT_STATUS.APPROVED,
        'bearer-xyz'
      )
    })

    test('should handle null auth session gracefully', async () => {
      getAuthSession.mockReturnValue(null)
      updateProjectStatus.mockResolvedValue({ success: true })

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'THC501E-000A-017A',
        PROJECT_STATUS.APPROVED,
        undefined
      )
    })

    test('should use referenceNumber from request params', async () => {
      mockRequest.params = { referenceNumber: 'ABC123-000B-099C' }
      updateProjectStatus.mockResolvedValue({ success: true })

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'ABC123-000B-099C',
        PROJECT_STATUS.APPROVED,
        'test-access-token'
      )
    })

    test('should not flash success when API call fails', async () => {
      updateProjectStatus.mockRejectedValue(new Error('timeout'))

      await submissionsActionsController.markInAimsPd(mockRequest, mockH)

      const successCalls = mockRequest.yar.flash.mock.calls.filter(
        ([type]) => type === 'success'
      )
      expect(successCalls).toHaveLength(0)
    })
  })
})
