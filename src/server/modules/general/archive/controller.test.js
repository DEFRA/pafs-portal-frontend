import { describe, test, expect, beforeEach, vi } from 'vitest'
import { archiveController } from './controller.js'

vi.mock('../../../common/helpers/auth/session-manager.js')

const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('#archiveController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context }))
    }

    vi.clearAllMocks()
  })

  test('Should provide expected response', async () => {
    getAuthSession.mockReturnValue({
      user: { id: 1 }
    })

    await archiveController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/general/archive/index',
      expect.objectContaining({
        pageTitle: 'archive.title',
        heading: 'archive.heading',
        user: { id: 1 }
      })
    )
  })
})
