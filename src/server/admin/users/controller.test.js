import { describe, test, expect, beforeEach, vi } from 'vitest'
import { usersController } from './controller.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } =
  await import('../../common/helpers/auth/session-manager.js')

describe('Users Controller', () => {
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

  test('shows users page', async () => {
    getAuthSession.mockReturnValue({
      user: { id: 1, admin: true }
    })

    await usersController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('admin/users/index', {
      pageTitle: 'common.pages.admin.users.title',
      heading: 'common.pages.admin.users.heading',
      user: { id: 1, admin: true }
    })
  })
})
