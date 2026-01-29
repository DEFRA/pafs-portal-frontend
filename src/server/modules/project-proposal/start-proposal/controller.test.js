import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectProposalStartController } from './controller.js'

vi.mock('../../../common/helpers/auth/session-manager.js')

describe('#projectProposalStartController', () => {
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
    await projectProposalStartController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/project-proposal/start-proposal/index',
      {
        pageTitle: 'project-proposal.start_proposal.title',
        heading: 'project-proposal.start_proposal.heading'
      }
    )
  })
})
