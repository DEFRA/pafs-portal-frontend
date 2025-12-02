import { describe, test, expect, beforeEach, vi } from 'vitest'
import { downloadController } from './controller.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } = await import(
  '../../common/helpers/auth/session-manager.js'
)

describe('#downloadController', () => {
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

    await downloadController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('general/download/index', {
      pageTitle: 'common.pages.download.title',
      heading: 'common.pages.download.heading',
      user: { id: 1 }
    })
  })
})
