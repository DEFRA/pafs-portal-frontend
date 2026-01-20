import { describe, test, expect, beforeEach, vi } from 'vitest'
import { downloadUsersController } from './controller.js'
import ExcelJS from 'exceljs'

vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/security/encoder.js')

const { getAccounts } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')
const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { decodeUserId } =
  await import('../../../../common/helpers/security/encoder.js')

describe('DownloadUsersController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      server: {
        logger: {
          error: vi.fn(),
          debug: vi.fn()
        }
      },
      yar: {
        get: vi.fn()
      }
    }

    mockH = {
      response: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }

    // Mock session with access token
    getAuthSession.mockReturnValue({
      accessToken: 'test-token',
      user: { id: 1, email: 'admin@example.com' }
    })

    // Mock cache service
    const mockCacheService = {
      getListMetadata: vi.fn(),
      setListMetadata: vi.fn(),
      getAccountsByIds: vi.fn(),
      setAccounts: vi.fn()
    }
    createAccountsCacheService.mockReturnValue(mockCacheService)

    decodeUserId.mockImplementation((id) => {
      if (typeof id === 'string' && id.includes('.')) {
        const decoded = Buffer.from(id.split('.')[0], 'base64url').toString(
          'utf8'
        )
        return parseInt(decoded)
      }
      return parseInt(id)
    })
    vi.clearAllMocks()
  })

  describe('handler', () => {
    test('fetches both active and pending users with pagination', async () => {
      getAccounts.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await downloadUsersController.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          page: 1,
          pageSize: 10000,
          accessToken: 'test-token'
        })
      )

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          page: 1,
          pageSize: 10000,
          accessToken: 'test-token'
        })
      )
    })

    test('handles pagination for large datasets', async () => {
      // Mock first page with 10000 users (indicating more pages)
      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: Array(100).fill({
              id: '1',
              email: 'user@example.com',
              status: 'active',
              areas: []
            }),
            pagination: { total: 25000, page: 1, pageSize: 10000 }
          }
        })
        // Mock second page
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: Array(100).fill({
              id: '2',
              email: 'user2@example.com',
              status: 'active',
              areas: []
            }),
            pagination: { total: 25000, page: 2, pageSize: 10000 }
          }
        })
        // Mock third page (last page)
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: Array(50).fill({
              id: '3',
              email: 'user3@example.com',
              status: 'active',
              areas: []
            }),
            pagination: { total: 25000, page: 3, pageSize: 10000 }
          }
        })
        // Mock pending users (empty)
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      // Should have called getAccounts 4 times (3 for active, 1 for pending)
      expect(getAccounts).toHaveBeenCalledTimes(4)

      // Verify pagination calls
      expect(getAccounts).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ page: 1 })
      )
      expect(getAccounts).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ page: 2 })
      )
      expect(getAccounts).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ page: 3 })
      )
    })

    test('generates Excel file with correct headers', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          admin: false,
          status: 'active',
          disabled: false,
          areas: [{ id: 1, name: 'Area 1', primary: true }],
          createdAt: '2024-01-01T10:00:00Z',
          invitationSentAt: '2024-01-01T09:00:00Z',
          invitationAcceptedAt: '2024-01-02T10:00:00Z',
          lastSignIn: '2024-01-10T14:30:00Z'
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockUsers, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith(expect.any(Buffer))
      expect(mockH.type).toHaveBeenCalledWith(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(mockH.header).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="users_export_')
      )
    })

    test('combines active and pending users', async () => {
      const activeUsers = [
        { id: '1', email: 'active@example.com', status: 'active', areas: [] }
      ]
      const pendingUsers = [
        { id: '2', email: 'pending@example.com', status: 'pending', areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: activeUsers,
            pagination: { total: 1, page: 1, pageSize: 100 }
          }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: pendingUsers,
            pagination: { total: 1, page: 1, pageSize: 100 }
          }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      expect(buffer).toBeInstanceOf(Buffer)

      // Verify Excel contains both users
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.rowCount).toBe(3) // Header + 2 data rows
    })

    test('handles empty user list', async () => {
      getAccounts.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await downloadUsersController.handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith(expect.any(Buffer))
    })

    test('handles error gracefully', async () => {
      getAccounts.mockRejectedValue(new Error('API Error'))

      await downloadUsersController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Failed to generate Excel export'
      })
      expect(mockH.code).toHaveBeenCalledWith(500)
    })

    test('generates filename with timestamp', async () => {
      getAccounts.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await downloadUsersController.handler(mockRequest, mockH)

      const headerCall = mockH.header.mock.calls[0]
      expect(headerCall[1]).toMatch(
        /users_export_\d{4}-\d{2}-\d{2}_\d{6}\.xlsx/
      )
    })
  })

  describe('generateExcelFile', () => {
    test('formats user data correctly', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          admin: true,
          status: 'active',
          disabled: false,
          areas: [
            { id: 1, name: 'Main Area', primary: true },
            { id: 2, name: 'Additional Area 1', primary: false },
            { id: 3, name: 'Additional Area 2', primary: false }
          ],
          createdAt: '2024-01-15T10:30:00Z',
          invitationSentAt: '2024-01-15T09:00:00Z',
          invitationAcceptedAt: '2024-01-16T11:00:00Z',
          lastSignIn: '2024-01-20T14:45:00Z'
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: mockUsers, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(1).value).toBe('1') // User ID (formatted as string)
      expect(dataRow.getCell(2).value).toBe('test@example.com')
      expect(dataRow.getCell(3).value).toBe('Smith')
      expect(dataRow.getCell(4).value).toBe('Jane')
      expect(dataRow.getCell(5).value).toBe('Main Area')
      expect(dataRow.getCell(6).value).toBe(
        'Additional Area 1 | Additional Area 2'
      )
      expect(dataRow.getCell(7).value).toBe('Yes')
      expect(dataRow.getCell(8).value).toBe('Active')
      expect(dataRow.getCell(9).value).toBe('No')
    })

    test('formats status correctly - maps approved to Active', async () => {
      const users = [
        { id: '1', email: 'test1@example.com', status: 'approved', areas: [] },
        { id: '2', email: 'test2@example.com', status: 'active', areas: [] },
        { id: '3', email: 'test3@example.com', status: 'pending', areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 3 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(8).value).toBe('Active')
      expect(worksheet.getRow(3).getCell(8).value).toBe('Active')
      expect(worksheet.getRow(4).getCell(8).value).toBe('Pending')
    })

    test('handles users with no areas', async () => {
      const users = [
        { id: '1', email: 'test@example.com', status: 'active', areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(5).value).toBe('')
      expect(worksheet.getRow(2).getCell(6).value).toBe('')
    })

    test('handles missing date fields', async () => {
      const users = [
        {
          id: '1',
          email: 'test@example.com',
          status: 'pending',
          areas: [],
          createdAt: '2024-01-01T10:00:00Z'
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(10).value).toBe('') // invitationSent
      expect(dataRow.getCell(12).value).toBe('') // invitationAccepted
      expect(dataRow.getCell(13).value).toBe('') // lastSignIn
    })

    test('applies header styling', async () => {
      getAccounts.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const headerRow = worksheet.getRow(1)
      expect(headerRow.font.bold).toBe(true)
      expect(headerRow.font.color.argb).toBe('FFFFFFFF')
      expect(headerRow.fill.fgColor.argb).toBe('FF0B6623')
    })

    test('freezes header row', async () => {
      getAccounts.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.views[0].state).toBe('frozen')
      expect(worksheet.views[0].ySplit).toBe(1)
    })

    test('applies styling to disabled users', async () => {
      const users = [
        {
          id: '1',
          email: 'disabled@example.com',
          status: 'active',
          disabled: true,
          areas: []
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const disabledCell = worksheet.getRow(2).getCell(9)
      expect(disabledCell.value).toBe('Yes')
      expect(disabledCell.font.color.argb).toBe('FFDC143C') // Crimson red
      expect(disabledCell.font.bold).toBe(true)
    })

    test('applies styling to admin users', async () => {
      const users = [
        {
          id: '1',
          email: 'admin@example.com',
          status: 'active',
          admin: true,
          areas: []
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const adminCell = worksheet.getRow(2).getCell(7)
      expect(adminCell.value).toBe('Yes')
      expect(adminCell.font.color.argb).toBe('FF4169E1') // Royal blue
      expect(adminCell.font.bold).toBe(true)
    })

    test('handles unknown status values', async () => {
      const users = [
        { id: '1', email: 'test@example.com', status: 'suspended', areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(8).value).toBe('Suspended')
    })

    test('handles decodeUserId error gracefully', async () => {
      decodeUserId.mockImplementation(() => {
        throw new Error('Decode error')
      })

      const users = [
        {
          id: 'invalid-id',
          email: 'test@example.com',
          status: 'active',
          areas: []
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(1).value).toBe('invalid-id')
    })

    test('handles invalid date format gracefully', async () => {
      const users = [
        {
          id: '1',
          email: 'test@example.com',
          status: 'active',
          areas: [],
          createdAt: 'invalid-date',
          invitationSentAt: 'not-a-date'
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(10).value).toBe('') // invitationSent
      expect(dataRow.getCell(11).value).toBe('') // accountCreation
    })

    test('handles empty or null user id', async () => {
      const users = [
        { id: null, email: 'test1@example.com', status: 'active', areas: [] },
        { id: '', email: 'test2@example.com', status: 'active', areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 2 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(1).value).toBe('')
      expect(worksheet.getRow(3).getCell(1).value).toBe('')
    })

    test('handles empty status', async () => {
      const users = [
        { id: '1', email: 'test@example.com', status: '', areas: [] },
        { id: '2', email: 'test2@example.com', status: null, areas: [] }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 2 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(8).value).toBe('')
      expect(worksheet.getRow(3).getCell(8).value).toBe('')
    })

    test('handles areas without primary flag', async () => {
      const users = [
        {
          id: '1',
          email: 'test@example.com',
          status: 'active',
          areas: [
            { id: 1, name: 'Area 1', primary: false },
            { id: 2, name: 'Area 2', primary: false }
          ]
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      // Should use first area as main area when no primary
      expect(worksheet.getRow(2).getCell(5).value).toBe('Area 1')
      // Should list both as additional areas
      expect(worksheet.getRow(2).getCell(6).value).toBe('Area 1 | Area 2')
    })

    test('handles areas with undefined name in first area', async () => {
      const users = [
        {
          id: '1',
          email: 'test@example.com',
          status: 'active',
          areas: [
            { id: 1, primary: false }, // No name property
            { id: 2, name: 'Area 2', primary: false }
          ]
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      // Should fallback to empty string when area name is undefined
      expect(worksheet.getRow(2).getCell(5).value).toBe('')
    })

    test('handles decodeUserId returning falsy value', async () => {
      decodeUserId.mockReturnValue(null)

      const users = [
        {
          id: 'encoded-id',
          email: 'test@example.com',
          status: 'active',
          areas: []
        }
      ]

      getAccounts
        .mockResolvedValueOnce({
          success: true,
          data: { data: users, pagination: { total: 1 } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

      await downloadUsersController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('Users')

      expect(worksheet.getRow(2).getCell(1).value).toBe('encoded-id')
    })
  })
})
