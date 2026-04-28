import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../../helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

const { apiRequest } = await import('../../helpers/api-client/index.js')
const {
  getUserProgrammeStatus,
  generateUserProgramme,
  getUserProgrammeFileUrl,
  getAdminProgrammeStatus,
  generateAdminProgramme,
  getAdminProgrammeFileUrl
} = await import('./programme-download-service.js')

describe('programme-download-service', () => {
  beforeEach(() => vi.clearAllMocks())

  const TOKEN = 'bearer-abc'

  describe('getUserProgrammeStatus', () => {
    test('calls GET /api/v1/downloads/programme/status with bearer token', async () => {
      apiRequest.mockResolvedValue({ success: true, data: { status: 'empty' } })

      await getUserProgrammeStatus(TOKEN)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/downloads/programme/status',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: `Bearer ${TOKEN}` }
        })
      )
    })

    test('returns the API response', async () => {
      const response = { success: true, data: { status: 'ready' } }
      apiRequest.mockResolvedValue(response)

      const result = await getUserProgrammeStatus(TOKEN)
      expect(result).toEqual(response)
    })
  })

  describe('generateUserProgramme', () => {
    test('calls POST /api/v1/downloads/programme/generate', async () => {
      apiRequest.mockResolvedValue({ success: true })

      await generateUserProgramme(TOKEN)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/downloads/programme/generate',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getUserProgrammeFileUrl', () => {
    test('calls GET /api/v1/downloads/programme/file/{type} with the type', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { downloadUrl: 'https://s3.example.com/x' }
      })

      await getUserProgrammeFileUrl(TOKEN, 'benefit-areas')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/downloads/programme/file/benefit-areas',
        expect.objectContaining({ method: 'GET' })
      )
    })

    test('interpolates the type correctly for moderations', async () => {
      apiRequest.mockResolvedValue({ success: true })
      await getUserProgrammeFileUrl(TOKEN, 'moderations')
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/downloads/programme/file/moderations',
        expect.anything()
      )
    })
  })

  describe('getAdminProgrammeStatus', () => {
    test('calls GET /api/v1/admin/downloads/programme/status', async () => {
      apiRequest.mockResolvedValue({ success: true })

      await getAdminProgrammeStatus(TOKEN)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/admin/downloads/programme/status',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('generateAdminProgramme', () => {
    test('calls POST /api/v1/admin/downloads/programme/generate', async () => {
      apiRequest.mockResolvedValue({ success: true })

      await generateAdminProgramme(TOKEN)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/admin/downloads/programme/generate',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getAdminProgrammeFileUrl', () => {
    test('calls GET /api/v1/admin/downloads/programme/file (no type param)', async () => {
      apiRequest.mockResolvedValue({ success: true })

      await getAdminProgrammeFileUrl(TOKEN)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/admin/downloads/programme/file',
        expect.objectContaining({ method: 'GET' })
      )
    })

    test('passes the bearer token in Authorization header', async () => {
      apiRequest.mockResolvedValue({ success: true })

      await getAdminProgrammeFileUrl('my-token')

      expect(apiRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer my-token' }
        })
      )
    })
  })
})
