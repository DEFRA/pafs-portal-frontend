import { describe, test, expect, beforeEach, vi } from 'vitest'
import { submissionsActionsController } from './controller.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { PROJECT_STATUS } from '../../../../common/constants/projects.js'

vi.mock('../../../../common/services/project/project-service.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')

const { updateProjectStatus, resubmitProject } =
  await import('../../../../common/services/project/project-service.js')

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')

const TEST_REFERENCE_NUMBER = 'THC501E-000A-017A'
const TEST_ACCESS_TOKEN = 'test-access-token'
const MARK_FAILED_MSG = 'projects.failed_submissions.errors.mark_failed'
const RESEND_FAILED_MSG = 'projects.failed_submissions.errors.resend_failed'

let mockRequest
let mockH

beforeEach(() => {
  vi.clearAllMocks()

  mockRequest = {
    params: { referenceNumber: TEST_REFERENCE_NUMBER },
    server: {
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn()
      }
    },
    t: vi.fn((key) => key),
    yar: { flash: vi.fn() }
  }

  mockH = {
    redirect: vi.fn((url) => ({ redirect: url }))
  }

  getAuthSession.mockReturnValue({ accessToken: TEST_ACCESS_TOKEN })
})

describe('markInAimsPd — success path', () => {
  test('calls updateProjectStatus with correct args and flashes success', async () => {
    updateProjectStatus.mockResolvedValue({ success: true })
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(updateProjectStatus).toHaveBeenCalledWith(
      TEST_REFERENCE_NUMBER,
      PROJECT_STATUS.APPROVED,
      TEST_ACCESS_TOKEN
    )
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
      message: 'projects.failed_submissions.notifications.marked_in_aims_pd'
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('redirects to submissions on success', async () => {
    updateProjectStatus.mockResolvedValue({ success: true })
    const result = await submissionsActionsController.markInAimsPd(
      mockRequest,
      mockH
    )
    expect(result).toEqual({ redirect: ROUTES.ADMIN.SUBMISSIONS })
  })

  test('uses accessToken from auth session', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'bearer-xyz' })
    updateProjectStatus.mockResolvedValue({ success: true })
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(updateProjectStatus).toHaveBeenCalledWith(
      expect.any(String),
      PROJECT_STATUS.APPROVED,
      'bearer-xyz'
    )
  })

  test('handles null auth session gracefully', async () => {
    getAuthSession.mockReturnValue(null)
    updateProjectStatus.mockResolvedValue({ success: true })
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(updateProjectStatus).toHaveBeenCalledWith(
      TEST_REFERENCE_NUMBER,
      PROJECT_STATUS.APPROVED,
      undefined
    )
  })

  test('uses referenceNumber from request params', async () => {
    mockRequest.params = { referenceNumber: 'ABC123-000B-099C' }
    updateProjectStatus.mockResolvedValue({ success: true })
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(updateProjectStatus).toHaveBeenCalledWith(
      'ABC123-000B-099C',
      PROJECT_STATUS.APPROVED,
      TEST_ACCESS_TOKEN
    )
  })
})

describe('markInAimsPd — error path', () => {
  test('flashes error when API returns success: false', async () => {
    updateProjectStatus.mockResolvedValue({
      success: false,
      errors: ['Not found']
    })
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: MARK_FAILED_MSG
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('flashes error when API returns null', async () => {
    updateProjectStatus.mockResolvedValue(null)
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: MARK_FAILED_MSG
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('logs error and flashes error when updateProjectStatus throws', async () => {
    updateProjectStatus.mockRejectedValue(new Error('Network error'))
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        referenceNumber: TEST_REFERENCE_NUMBER
      }),
      'Failed to mark submission as received in AIMS PD'
    )
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: MARK_FAILED_MSG
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('does not flash success when API call fails', async () => {
    updateProjectStatus.mockRejectedValue(new Error('timeout'))
    await submissionsActionsController.markInAimsPd(mockRequest, mockH)
    const successCalls = mockRequest.yar.flash.mock.calls.filter(
      ([type]) => type === 'success'
    )
    expect(successCalls).toHaveLength(0)
  })
})

describe('resubmit', () => {
  test('calls resubmitProject with referenceNumber and accessToken', async () => {
    resubmitProject.mockResolvedValue({ success: true })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(resubmitProject).toHaveBeenCalledWith(
      TEST_REFERENCE_NUMBER,
      TEST_ACCESS_TOKEN
    )
  })

  test('flashes success and redirects on success', async () => {
    resubmitProject.mockResolvedValue({ success: true })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
      message: 'projects.failed_submissions.notifications.resubmitted'
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('flashes error when result.success is false', async () => {
    resubmitProject.mockResolvedValue({ success: false })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: RESEND_FAILED_MSG
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('flashes error when externalSubmission.success is false', async () => {
    resubmitProject.mockResolvedValue({
      success: true,
      data: { externalSubmission: { success: false } }
    })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: RESEND_FAILED_MSG
    })
  })

  test('logs error and flashes error when resubmitProject throws', async () => {
    resubmitProject.mockRejectedValue(new Error('Network error'))
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(Error),
        referenceNumber: TEST_REFERENCE_NUMBER
      }),
      'Failed to resubmit proposal to external system'
    )
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: RESEND_FAILED_MSG
    })
    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.SUBMISSIONS)
  })

  test('uses accessToken from auth session', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'admin-token' })
    resubmitProject.mockResolvedValue({ success: true })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(resubmitProject).toHaveBeenCalledWith(
      expect.any(String),
      'admin-token'
    )
  })

  test('handles null auth session gracefully', async () => {
    getAuthSession.mockReturnValue(null)
    resubmitProject.mockResolvedValue({ success: true })
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(resubmitProject).toHaveBeenCalledWith(
      TEST_REFERENCE_NUMBER,
      undefined
    )
  })

  test('flashes error when result is null', async () => {
    resubmitProject.mockResolvedValue(null)
    await submissionsActionsController.resubmit(mockRequest, mockH)
    expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
      message: RESEND_FAILED_MSG
    })
  })
})
