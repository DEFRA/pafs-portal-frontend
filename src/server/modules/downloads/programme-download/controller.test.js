import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/downloads/programme-download-service.js')

const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')
const {
  getUserProgrammeStatus,
  generateUserProgramme,
  getUserProgrammeFileUrl,
  getAdminProgrammeStatus,
  generateAdminProgramme,
  getAdminProgrammeFileUrl
} =
  await import('../../../common/services/downloads/programme-download-service.js')
const {
  downloadGetController,
  downloadGenerateController,
  downloadPollController,
  downloadFileController
} = await import('./controller.js')

// ── shared mock helpers ───────────────────────────────────────────────────────

function makeSession(isAdmin = false) {
  return {
    accessToken: 'tok-123',
    user: { id: 1, firstName: 'Jo', lastName: 'Smith', admin: isAdmin }
  }
}

function makeRequest(overrides = {}) {
  return {
    t: vi.fn((key) => key),
    params: {},
    server: { logger: { warn: vi.fn(), error: vi.fn() } },
    yar: { flash: vi.fn().mockReturnValue([null]) },
    ...overrides
  }
}

function makeH() {
  const h = {
    _status: null,
    _body: null,
    view: vi.fn((tpl, ctx) => ({ template: tpl, context: ctx })),
    redirect: vi.fn((url) => ({ redirected: url })),
    response: vi.fn(function (body) {
      h._body = body
      return h
    }),
    code: vi.fn(function (s) {
      h._status = s
      return h
    })
  }
  return h
}

// ── downloadGetController ─────────────────────────────────────────────────────

describe('#downloadGetController', () => {
  beforeEach(() => vi.clearAllMocks())

  test('regular user: calls getUserProgrammeStatus and renders with isAdmin=false', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockResolvedValue({
      success: true,
      data: { status: 'empty', projectCounts: {} }
    })

    const request = makeRequest()
    const h = makeH()
    await downloadGetController.handler(request, h)

    expect(getUserProgrammeStatus).toHaveBeenCalledWith('tok-123')
    expect(getAdminProgrammeStatus).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(
      'modules/downloads/programme-download/index',
      expect.objectContaining({
        isAdmin: false,
        pageTitle: 'download.programme.title',
        heading: 'download.programme.heading',
        downloadStatus: { status: 'empty', projectCounts: {} }
      })
    )
  })

  test('admin user: calls getAdminProgrammeStatus and renders with isAdmin=true', async () => {
    getAuthSession.mockReturnValue(makeSession(true))
    getAdminProgrammeStatus.mockResolvedValue({
      success: true,
      data: { status: 'ready', projectCounts: {} }
    })

    const request = makeRequest()
    const h = makeH()
    await downloadGetController.handler(request, h)

    expect(getAdminProgrammeStatus).toHaveBeenCalledWith('tok-123')
    expect(getUserProgrammeStatus).not.toHaveBeenCalled()
    expect(h.view).toHaveBeenCalledWith(
      'modules/downloads/programme-download/index',
      expect.objectContaining({
        isAdmin: true,
        pageTitle: 'download.admin.title',
        heading: 'download.admin.heading'
      })
    )
  })

  test('renders with null downloadStatus when API returns unsuccessful', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockResolvedValue({ success: false })

    const request = makeRequest()
    const h = makeH()
    await downloadGetController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'modules/downloads/programme-download/index',
      expect.objectContaining({ downloadStatus: null })
    )
  })

  test('renders with null downloadStatus when API throws', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockRejectedValue(new Error('network error'))

    const request = makeRequest()
    const h = makeH()
    await downloadGetController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'modules/downloads/programme-download/index',
      expect.objectContaining({ downloadStatus: null })
    )
    expect(request.server.logger.warn).toHaveBeenCalled()
  })
})

// ── downloadGenerateController ────────────────────────────────────────────────

describe('#downloadGenerateController', () => {
  beforeEach(() => vi.clearAllMocks())

  test('regular user: calls generateUserProgramme and redirects to /download', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    generateUserProgramme.mockResolvedValue({ success: true })

    const request = makeRequest()
    const h = makeH()
    await downloadGenerateController.handler(request, h)

    expect(generateUserProgramme).toHaveBeenCalledWith('tok-123')
    expect(generateAdminProgramme).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })

  test('admin user: calls generateAdminProgramme and redirects to /download', async () => {
    getAuthSession.mockReturnValue(makeSession(true))
    generateAdminProgramme.mockResolvedValue({ success: true })

    const request = makeRequest()
    const h = makeH()
    await downloadGenerateController.handler(request, h)

    expect(generateAdminProgramme).toHaveBeenCalledWith('tok-123')
    expect(generateUserProgramme).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })

  test('flashes error and redirects when API returns unsuccessful', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    generateUserProgramme.mockResolvedValue({ success: false })

    const request = makeRequest()
    const h = makeH()
    await downloadGenerateController.handler(request, h)

    expect(request.yar.flash).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'error' })
    )
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })

  test('flashes error and redirects when API throws', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    generateUserProgramme.mockRejectedValue(new Error('boom'))

    const request = makeRequest()
    const h = makeH()
    await downloadGenerateController.handler(request, h)

    expect(request.yar.flash).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'error' })
    )
    expect(request.server.logger.error).toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })
})

// ── downloadPollController ────────────────────────────────────────────────────

describe('#downloadPollController', () => {
  beforeEach(() => vi.clearAllMocks())

  test('regular user: returns data from getUserProgrammeStatus', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockResolvedValue({
      success: true,
      data: { status: 'generating' }
    })

    const request = makeRequest()
    const h = makeH()
    await downloadPollController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ status: 'generating' })
    expect(h.code).toHaveBeenCalledWith(200)
  })

  test('admin user: returns data from getAdminProgrammeStatus', async () => {
    getAuthSession.mockReturnValue(makeSession(true))
    getAdminProgrammeStatus.mockResolvedValue({
      success: true,
      data: { status: 'ready' }
    })

    const request = makeRequest()
    const h = makeH()
    await downloadPollController.handler(request, h)

    expect(getAdminProgrammeStatus).toHaveBeenCalledWith('tok-123')
    expect(h.response).toHaveBeenCalledWith({ status: 'ready' })
  })

  test('returns { status: empty } when API returns unsuccessful', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockResolvedValue({ success: false })

    const request = makeRequest()
    const h = makeH()
    await downloadPollController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ status: 'empty' })
    expect(h.code).toHaveBeenCalledWith(200)
  })

  test('returns { status: empty } and warns when API throws', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeStatus.mockRejectedValue(new Error('timeout'))

    const request = makeRequest()
    const h = makeH()
    await downloadPollController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ status: 'empty' })
    expect(request.server.logger.warn).toHaveBeenCalled()
  })
})

// ── downloadFileController ────────────────────────────────────────────────────

describe('#downloadFileController', () => {
  beforeEach(() => vi.clearAllMocks())

  test('regular user: calls getUserProgrammeFileUrl with type and redirects', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeFileUrl.mockResolvedValue({
      success: true,
      data: { downloadUrl: 'https://s3.example.com/file.xlsx' }
    })

    const request = makeRequest({ params: { type: 'fcerm1' } })
    const h = makeH()
    await downloadFileController.handler(request, h)

    expect(getUserProgrammeFileUrl).toHaveBeenCalledWith('tok-123', 'fcerm1')
    expect(getAdminProgrammeFileUrl).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('https://s3.example.com/file.xlsx')
  })

  test('admin user: calls getAdminProgrammeFileUrl (ignores type param)', async () => {
    getAuthSession.mockReturnValue(makeSession(true))
    getAdminProgrammeFileUrl.mockResolvedValue({
      success: true,
      data: { downloadUrl: 'https://s3.example.com/admin.xlsx' }
    })

    const request = makeRequest({ params: { type: 'fcerm1' } })
    const h = makeH()
    await downloadFileController.handler(request, h)

    expect(getAdminProgrammeFileUrl).toHaveBeenCalledWith('tok-123')
    expect(getUserProgrammeFileUrl).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('https://s3.example.com/admin.xlsx')
  })

  test('flashes error and redirects to /download when URL is missing', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeFileUrl.mockResolvedValue({
      success: true,
      data: { downloadUrl: null }
    })

    const request = makeRequest({ params: { type: 'benefit-areas' } })
    const h = makeH()
    await downloadFileController.handler(request, h)

    expect(request.yar.flash).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'error' })
    )
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })

  test('flashes error and redirects when API throws', async () => {
    getAuthSession.mockReturnValue(makeSession(false))
    getUserProgrammeFileUrl.mockRejectedValue(new Error('s3 error'))

    const request = makeRequest({ params: { type: 'fcerm1' } })
    const h = makeH()
    await downloadFileController.handler(request, h)

    expect(request.yar.flash).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({ type: 'error' })
    )
    expect(request.server.logger.error).toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith('/download')
  })
})
