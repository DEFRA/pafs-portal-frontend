import { describe, test, expect, beforeEach, vi } from 'vitest'
import { archiveController } from './controller.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { updateProjectStatus } from '../../../../common/services/project/project-service.js'
import { PROJECT_STATUS } from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/project/project-service.js')

describe('ArchiveController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: { referenceNumber: 'REF123' },
      t: vi.fn((key) => key),
      server: {
        logger: {
          error: vi.fn(),
          warn: vi.fn()
        }
      }
    }

    mockH = {
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnThis(),
      view: vi.fn()
    }

    getAuthSession.mockReturnValue({
      accessToken: 'mock-token',
      user: { id: 'user-1' }
    })
  })

  describe('archiveHandler', () => {
    test('should call updateProjectStatus with archived status', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'REF123',
        PROJECT_STATUS.ARCHIVED,
        'mock-token'
      )
    })

    test('should redirect to confirmation page on success', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.ARCHIVE_CONFIRMATION.replace(
          '{referenceNumber}',
          'REF123'
        )
      )
    })

    test('should redirect to overview on API failure', async () => {
      updateProjectStatus.mockResolvedValue({
        success: false,
        errors: ['API error']
      })

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should log error on API failure', async () => {
      updateProjectStatus.mockResolvedValue({
        success: false,
        errors: ['API error']
      })

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceNumber: 'REF123',
          errors: ['API error']
        }),
        'Failed to archive project'
      )
    })

    test('should redirect to overview on exception', async () => {
      updateProjectStatus.mockRejectedValue(new Error('Network error'))

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should log error on exception', async () => {
      updateProjectStatus.mockRejectedValue(new Error('Network error'))

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Network error',
          referenceNumber: 'REF123'
        }),
        'Error archiving project'
      )
    })

    test('should handle missing accessToken', async () => {
      getAuthSession.mockReturnValue({})
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.archiveHandler(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'REF123',
        PROJECT_STATUS.ARCHIVED,
        undefined
      )
    })

    test('should handle missing logger gracefully', async () => {
      mockRequest.server = undefined
      updateProjectStatus.mockRejectedValue(new Error('error'))

      await expect(
        archiveController.archiveHandler(mockRequest, mockH)
      ).resolves.toBeDefined()
    })
  })

  describe('confirmationHandler', () => {
    test('should render confirmation view', () => {
      archiveController.confirmationHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/general/projects/archive/index',
        expect.objectContaining({
          pageTitle: 'projects.confirm_archive.title',
          referenceNumber: 'REF123'
        })
      )
    })

    test('should translate the page title', () => {
      archiveController.confirmationHandler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.confirm_archive.title'
      )
    })
  })

  describe('revertToDraftHandler', () => {
    test('should call updateProjectStatus with draft status', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'REF123',
        PROJECT_STATUS.DRAFT,
        'mock-token'
      )
    })

    test('should redirect to overview after success', async () => {
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
    })

    test('should redirect to overview even on API failure', async () => {
      updateProjectStatus.mockResolvedValue({
        success: false,
        errors: ['error']
      })

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
    })

    test('should log error on API failure', async () => {
      updateProjectStatus.mockResolvedValue({
        success: false,
        errors: ['revert error']
      })

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceNumber: 'REF123',
          errors: ['revert error']
        }),
        'Failed to revert project to draft'
      )
    })

    test('should redirect to overview on exception', async () => {
      updateProjectStatus.mockRejectedValue(new Error('Network failure'))

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF123')
      )
    })

    test('should log error on exception', async () => {
      updateProjectStatus.mockRejectedValue(new Error('Network failure'))

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Network failure',
          referenceNumber: 'REF123'
        }),
        'Error reverting project to draft'
      )
    })

    test('should handle missing accessToken', async () => {
      getAuthSession.mockReturnValue({})
      updateProjectStatus.mockResolvedValue({ success: true })

      await archiveController.revertToDraftHandler(mockRequest, mockH)

      expect(updateProjectStatus).toHaveBeenCalledWith(
        'REF123',
        PROJECT_STATUS.DRAFT,
        undefined
      )
    })

    test('should handle missing logger gracefully', async () => {
      mockRequest.server = undefined
      updateProjectStatus.mockRejectedValue(new Error('error'))

      await expect(
        archiveController.revertToDraftHandler(mockRequest, mockH)
      ).resolves.toBeDefined()
    })
  })
})
