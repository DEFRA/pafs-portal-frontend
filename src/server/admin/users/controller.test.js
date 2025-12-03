import { describe, test, expect, beforeEach, vi } from 'vitest'
import { usersController } from './controller.js'

describe('Users Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {}

    mockH = {
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  test('redirects to pending users page', async () => {
    await usersController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
  })
})
