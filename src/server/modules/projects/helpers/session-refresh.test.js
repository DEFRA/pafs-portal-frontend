import { refreshSessionFromBackend } from './session-refresh.js'
import * as projectService from '../../../common/services/project/project-service.js'
import * as editSession from './project-edit-session.js'

describe('refreshSessionFromBackend', () => {
  const mockRequest = {
    auth: { credentials: { accessToken: 'token-123' } },
    yar: { get: vi.fn() }
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should fetch from backend and update session if token and referenceNumber are present', async () => {
    vi.spyOn(projectService, 'getProjectProposalOverview').mockResolvedValue({
      success: true,
      data: { foo: 'bar' }
    })
    vi.spyOn(editSession, 'initializeEditSession').mockImplementation(() => {})

    await refreshSessionFromBackend(mockRequest, 'REF-001')

    expect(projectService.getProjectProposalOverview).toHaveBeenCalledWith(
      'REF-001',
      'token-123'
    )
    expect(editSession.initializeEditSession).toHaveBeenCalledWith(
      mockRequest,
      { foo: 'bar' }
    )
  })

  it('should use accessToken argument if provided', async () => {
    vi.spyOn(projectService, 'getProjectProposalOverview').mockResolvedValue({
      success: true,
      data: { foo: 'bar' }
    })
    vi.spyOn(editSession, 'initializeEditSession').mockImplementation(() => {})

    await refreshSessionFromBackend(mockRequest, 'REF-002', 'token-override')

    expect(projectService.getProjectProposalOverview).toHaveBeenCalledWith(
      'REF-002',
      'token-override'
    )
  })

  it('should not call backend if no token', async () => {
    const req = { auth: {}, yar: { get: vi.fn().mockReturnValue({}) } }
    const spy = vi.spyOn(projectService, 'getProjectProposalOverview')
    await refreshSessionFromBackend(req, 'REF-003')
    expect(spy).not.toHaveBeenCalled()
  })

  it('should not call backend if no referenceNumber', async () => {
    const spy = vi.spyOn(projectService, 'getProjectProposalOverview')
    await refreshSessionFromBackend(mockRequest, undefined)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should not update session if backendResult is not success', async () => {
    vi.spyOn(projectService, 'getProjectProposalOverview').mockResolvedValue({
      success: false
    })
    const sessionSpy = vi.spyOn(editSession, 'initializeEditSession')
    await refreshSessionFromBackend(mockRequest, 'REF-004')
    expect(sessionSpy).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    vi.spyOn(projectService, 'getProjectProposalOverview').mockRejectedValue(
      new Error('fail')
    )
    await expect(
      refreshSessionFromBackend(mockRequest, 'REF-005')
    ).resolves.toBeUndefined()
  })
})
