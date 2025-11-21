import { describe, test, expect, beforeEach, vi } from 'vitest'
import { homeController } from './controller.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } = await import(
  '../../common/helpers/auth/session-manager.js'
)

describe('#homeController', () => {
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
      user: { id: 1, email: 'test@example.com' }
    })

    await homeController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('general/home/index', {
      pageTitle: 'common.pages.home.title',
      heading: 'common.pages.home.heading',
      user: { id: 1, email: 'test@example.com' }
    })
  })
})
