import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { getAuthSession } from '../../../../config/nunjucks/context/session-helper.js'
import { createAreasService } from '../../../common/services/areas/areas-service.js'
import { AREAS_RESPONSIBILITIES_MAP } from '../../../common/constants/common.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import {
  EXCEL_COLORS,
  EXCEL_DIMENSIONS,
  CELL_BORDER_STYLE
} from '../../../common/constants/excel-styles.js'

/**
 * Download RMA Controller
 * Handles admin download of all RMA (Risk Management Authority) data as Excel file
 * Includes columns: Identifier, Type, Name, Code, PSO Team, Area, End Date
 */
class DownloadRMAController {
  async handler(request, h) {
    try {
      request.server.logger.info('Starting RMA download')

      // Get access token from session
      const session = getAuthSession(request)
      const accessToken = session?.accessToken

      // Fetch all areas by type for parent lookups
      request.server.logger.info(
        'Fetching all areas by type for parent lookups'
      )
      const areasCache = await this.fetchAreasByType(request)

      // Fetch all RMA data
      const rmaData = await this.fetchAllRMAData({ accessToken, request })

      if (!rmaData || rmaData.length === 0) {
        request.server.logger.warn('No RMA data found for download')
        return h
          .response('No RMA data available')
          .code(statusCodes.notFound)
          .type('text/plain')
      }

      // Generate Excel file
      request.server.logger.info(
        `Generating Excel file with ${rmaData.length} RMA records`
      )
      const buffer = await this.generateExcelFile(rmaData, areasCache)

      // Generate timestamped filename
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')
      const filename = `rma_export_${timestamp}.xlsx`

      request.server.logger.info(
        { filename, recordCount: rmaData.length },
        'RMA download completed successfully'
      )

      return h
        .response(buffer)
        .code(statusCodes.ok)
        .type(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', buffer.length)
    } catch (error) {
      request.server.logger.error({ error }, 'Failed to generate RMA download')
      return h
        .response('Error generating RMA download')
        .code(statusCodes.internalServerError)
        .type('text/plain')
    }
  }

  /**
   * Fetch all RMA data from the backend API
   * Uses pagination to handle large datasets
   */
  async fetchAllRMAData({ accessToken, request }) {
    const areasService = createAreasService(request.server)
    let allRMAs = []
    let currentPage = 1
    let hasMorePages = true
    const pageSize = 100 // Fetch in batches of 100

    try {
      while (hasMorePages) {
        request.server.logger.debug({ page: currentPage }, 'Fetching RMA page')

        // Fetch RMA type areas only
        const result = await areasService.getAreasByList({
          search: '',
          type: AREAS_RESPONSIBILITIES_MAP.RMA,
          page: currentPage,
          pageSize,
          accessToken
        })

        if (result?.areas?.length > 0) {
          allRMAs = allRMAs.concat(result.areas)
          request.server.logger.debug(
            { pageRMAs: result.areas.length, totalSoFar: allRMAs.length },
            'Fetched RMA page'
          )
        }
        if (
          result?.pagination?.page < result?.pagination?.totalPages
        ) {
          currentPage++
        } else {
          hasMorePages = false
        }
      }

      request.server.logger.info(
        { totalRMAs: allRMAs.length },
        'Completed fetching all RMAs'
      )
      return allRMAs
    } catch (error) {
      request.server.logger.error({ error }, 'Error fetching RMA data')
      throw error
    }
  }

  /**
   * Fetch all areas grouped by type for parent lookups
   */
  async fetchAreasByType(request) {
    try {
      const areasService = createAreasService(request.server)
      const areasByType = await areasService.getAreasByType()
      return areasByType
    } catch (error) {
      request.server.logger.error({ error }, 'Error fetching areas by type')
      return {}
    }
  }

  /**
   * Define Excel worksheet columns for RMA export
   * Columns: Identifier, Type, Name, Code, PSO Team, Area, End Date
   */
  _defineWorksheetColumns(worksheet) {
    worksheet.columns = [
      { header: 'Identifier', key: 'identifier', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Name', key: 'name', width: 40 },
      { header: 'Code', key: 'code', width: 15 },
      { header: 'PSO Team', key: 'psoTeam', width: 40 },
      { header: 'Area', key: 'area', width: 30 },
      { header: 'End Date', key: 'endDate', width: 20 }
    ]
  }

  /**
   * Style the header row with bold white text on dark green background
   */
  _styleHeaderRow(worksheet) {
    const headerRow = worksheet.getRow(1)
    headerRow.font = {
      bold: true,
      color: { argb: EXCEL_COLORS.HEADER_TEXT },
      size: 11
    }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_COLORS.HEADER_BG }
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = EXCEL_DIMENSIONS.HEADER_HEIGHT
  }

  /**
   * Apply alternating row colors for better readability
   */
  _applyAlternatingRowColor(row) {
    if (row.number % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.ROW_ALT_BG }
      }
    }
  }

  /**
   * Format RMA data for Excel row
   * Need to fetch parent PSO and EA area names
   */
  _formatRMARowData(rma, areasCache) {
    // Get parent PSO area name from cache
    // API returns parent_id with underscore, not parentId
    const psoArea = areasCache[AREAS_RESPONSIBILITIES_MAP.PSO]?.find(
      (pso) => pso.id === (rma.parent_id || rma.parentId)
    )
    const psoName = psoArea?.name || ''

    // Get EA area name from PSO's parent
    const eaArea = areasCache[AREAS_RESPONSIBILITIES_MAP.EA]?.find(
      (ea) => ea.id === psoArea?.parent_id
    )
    const areaName = eaArea?.name || ''

    return {
      identifier: rma.identifier || '',
      type: rma.area_type || rma.areaType || 'RMA',
      name: rma.name || '',
      code: rma.sub_type || rma.subType || '', // Authority Code
      psoTeam: psoName,
      area: areaName,
      endDate: this.formatEndDate(rma.end_date || rma.endDate)
    }
  }

  /**
   * Add borders and alignment to all cells
   */
  _addBordersAndAlignment(worksheet) {
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = CELL_BORDER_STYLE
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' }
        }
      })
    })
  }

  /**
   * Generate Excel file from RMA data
   */
  async generateExcelFile(rmas, areasCache) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('RMA Export')

    this._defineWorksheetColumns(worksheet)
    this._styleHeaderRow(worksheet)

    // Add data rows
    rmas.forEach((rma) => {
      const rowData = this._formatRMARowData(rma, areasCache)
      const row = worksheet.addRow(rowData)
      this._applyAlternatingRowColor(row)
    })

    this._addBordersAndAlignment(worksheet)
    // Freeze the header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  }

  /**
   * Format end date in DD.MM.YYYY format
   * @param {string|Date} endDate - Date to format
   * @returns {string} Formatted date or empty string
   */
  formatEndDate(endDate) {
    if (!endDate) {
      return ''
    }
    try {
      return format(new Date(endDate), 'dd.MM.yyyy')
    } catch {
      return ''
    }
  }
}

const controller = new DownloadRMAController()

export const downloadRMAController = {
  handler: (request, h) => controller.handler(request, h)
}
