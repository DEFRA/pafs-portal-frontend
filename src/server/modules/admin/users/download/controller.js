import ExcelJS from 'exceljs'
import { getAccounts } from '../../../../common/services/accounts/accounts-service.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { format } from 'date-fns'
import { ACCOUNT_STATUS } from '../../../../common/constants/accounts.js'
import { API_LIMITS } from '../../../../common/constants/common.js'

/**
 * Download Users Controller
 * Generates Excel file with all users data regardless of status or pagination
 */
class DownloadUsersController {
  constructor(maxPageSize = API_LIMITS.MAX_ACCOUNTS_PAGE_SIZE) {
    this.maxPageSize = maxPageSize
  }

  async handler(request, h) {
    try {
      const session = getAuthSession(request)
      const accessToken = session?.accessToken
      const cacheService = createAccountsCacheService(request.server)

      // Fetch all active users (with pagination)
      const activeUsers = await this.fetchAllUsers({
        status: ACCOUNT_STATUS.ACTIVE,
        accessToken,
        cacheService
      })

      // Fetch all pending users (with pagination)
      const pendingUsers = await this.fetchAllUsers({
        status: ACCOUNT_STATUS.PENDING,
        accessToken,
        cacheService
      })

      // Combine all users
      const allUsers = [...activeUsers, ...pendingUsers]

      // Generate Excel file
      const buffer = await this.generateExcelFile(allUsers)

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')
      const filename = `users_export_${timestamp}.xlsx`

      // Return Excel file as download
      return h
        .response(buffer)
        .type(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header('Content-Disposition', `attachment; filename="${filename}"`)
    } catch (error) {
      request.server.logger.error(
        { error },
        'Error generating users Excel export'
      )
      return h.response({ error: 'Failed to generate Excel export' }).code(500)
    }
  }

  async fetchAllUsers({ status, accessToken, cacheService }) {
    const allUsers = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const result = await getAccounts({
        status,
        page,
        pageSize: this.maxPageSize,
        accessToken,
        cacheService
      })

      if (result.success && result.data?.data?.length > 0) {
        allUsers.push(...result.data.data)

        // Check if there are more pages
        const { total } = result.data.pagination || {}
        const fetchedCount = page * this.maxPageSize
        hasMore = total && fetchedCount < total
        page++
      } else {
        hasMore = false
      }
    }

    return allUsers
  }

  async generateExcelFile(users) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Users')

    // Define columns with headers
    worksheet.columns = [
      { header: 'User ID', key: 'userId', width: 15 },
      { header: 'User Email', key: 'email', width: 30 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Main Area', key: 'mainArea', width: 30 },
      { header: 'Additional Areas', key: 'additionalAreas', width: 40 },
      { header: 'Administrator?', key: 'isAdmin', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Disabled?', key: 'disabled', width: 12 },
      { header: 'Invitation Sent', key: 'invitationSent', width: 25 },
      { header: 'Account Creation', key: 'accountCreation', width: 25 },
      { header: 'Invitation Accepted', key: 'invitationAccepted', width: 25 },
      { header: 'Last Sign In', key: 'lastSignIn', width: 25 }
    ]

    // Style the header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B6623' } // Dark green background
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Add data rows
    users.forEach((user) => {
      const row = worksheet.addRow({
        userId: this.formatUserId(user.id || user.userId),
        email: user.email || '',
        lastName: user.lastName || '',
        firstName: user.firstName || '',
        mainArea: this.getMainArea(user.areas),
        additionalAreas: this.getAdditionalAreas(user.areas),
        isAdmin: user.admin ? 'Yes' : 'No',
        status: this.formatStatus(user.status),
        disabled: user.disabled ? 'Yes' : 'No',
        invitationSent: this.formatDateTime(user.invitationSentAt),
        accountCreation: this.formatDateTime(user.createdAt),
        invitationAccepted: this.formatDateTime(user.invitationAcceptedAt),
        lastSignIn: this.formatDateTime(user.lastSignIn)
      })

      // Apply alternating row colors for better readability
      const rowNumber = row.number
      if (rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' } // Light gray
        }
      }

      // Color code status column
      const statusCell = row.getCell('status')
      if (user.status === 'active' || user.status === 'approved') {
        statusCell.font = { color: { argb: 'FF006400' }, bold: true } // Dark green
      } else if (user.status === 'pending') {
        statusCell.font = { color: { argb: 'FFFF8C00' }, bold: true } // Dark orange
      }

      // Color code disabled column
      const disabledCell = row.getCell('disabled')
      if (user.disabled) {
        disabledCell.font = { color: { argb: 'FFDC143C' }, bold: true } // Crimson red
      }

      // Color code admin column
      const adminCell = row.getCell('isAdmin')
      if (user.admin) {
        adminCell.font = { color: { argb: 'FF4169E1' }, bold: true } // Royal blue
      }
    })

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
        // Align all cells
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }
      })
    })

    // Freeze the header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  }

  formatUserId(id) {
    if (!id) return ''
    // Decode the ID if it's encoded
    try {
      const decoded = decodeUserId(id)
      return decoded ? decoded.toString() : id.toString()
    } catch {
      return id.toString()
    }
  }

  getMainArea(areas) {
    if (!areas || !Array.isArray(areas) || areas.length === 0) return ''
    const mainArea = areas.find((area) => area.primary)
    return mainArea?.name || areas[0]?.name || ''
  }

  getAdditionalAreas(areas) {
    if (!areas || !Array.isArray(areas) || areas.length === 0) return ''
    const additionalAreas = areas.filter((area) => !area.primary)
    return additionalAreas.map((area) => area.name).join(' | ')
  }

  formatStatus(status) {
    if (!status) return ''
    if (status === ACCOUNT_STATUS.ACTIVE || status === ACCOUNT_STATUS.APPROVED)
      {return 'Active'}
    if (status === ACCOUNT_STATUS.PENDING) return 'Pending'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  formatDateTime(dateTime) {
    if (!dateTime) return ''
    try {
      return format(new Date(dateTime), 'dd/MM/yyyy HH:mm')
    } catch {
      return ''
    }
  }
}

const controller = new DownloadUsersController()

export const downloadUsersController = {
  handler: (request, h) => controller.handler(request, h)
}
