import { describe, test, expect, beforeEach, vi } from 'vitest'
import { downloadRMAController } from './controller.js'
import ExcelJS from 'exceljs'

vi.mock('../../../../config/nunjucks/context/session-helper.js')
vi.mock('../../../common/services/areas/areas-service.js')
vi.mock('../../../common/constants/common.js', () => ({
  AREAS_RESPONSIBILITIES_MAP: {
    AUTHORITY: 'Authority',
    RMA: 'RMA',
    PSO: 'PSO Area',
    EA: 'EA Area'
  }
}))

const { getAuthSession } =
  await import('../../../../config/nunjucks/context/session-helper.js')
const { createAreasService } =
  await import('../../../common/services/areas/areas-service.js')

describe('DownloadRMAController', () => {
  let mockRequest
  let mockH
  let mockAreasService

  beforeEach(() => {
    mockRequest = {
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          debug: vi.fn(),
          warn: vi.fn()
        }
      }
    }

    mockH = {
      response: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }

    mockAreasService = {
      getAreasByList: vi.fn(),
      getAreasByType: vi.fn()
    }

    getAuthSession.mockReturnValue({
      accessToken: 'test-token',
      user: { id: 1, email: 'admin@example.com' }
    })

    createAreasService.mockReturnValue(mockAreasService)

    vi.clearAllMocks()
  })

  describe('handler', () => {
    test('successfully generates RMA export with all data', async () => {
      const mockRMAs = [
        {
          id: '1',
          name: 'Bristol City Council',
          area_type: 'RMA',
          identifier: 'RMA001',
          sub_type: 'AUTH001',
          parent_id: '10',
          end_date: '2025-12-31'
        },
        {
          id: '2',
          name: 'Bath Council',
          area_type: 'RMA',
          identifier: 'RMA002',
          sub_type: 'AUTH002',
          parent_id: '10',
          end_date: null
        }
      ]

      const mockAreas = {
        RMA: mockRMAs,
        'PSO Area': [
          { id: '10', name: 'PSO West', parent_id: '20' },
          { id: '11', name: 'PSO East', parent_id: '21' }
        ],
        'EA Area': [
          { id: '20', name: 'Wessex' },
          { id: '21', name: 'Thames' }
        ],
        Authority: [
          { id: 'auth1', identifier: 'AUTH001', name: 'RMA' },
          { id: 'auth2', identifier: 'AUTH002', name: 'RMA' }
        ]
      }

      mockAreasService.getAreasByType.mockResolvedValue(mockAreas)
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: mockRMAs,
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalled()
      expect(mockH.code).toHaveBeenCalledWith(200)
      expect(mockH.type).toHaveBeenCalledWith(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      expect(mockH.header).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="rma_export_')
      )
      expect(mockH.header).toHaveBeenCalledWith(
        'Content-Length',
        expect.any(Number)
      )

      const buffer = mockH.response.mock.calls[0][0]
      expect(buffer).toBeInstanceOf(Buffer)

      // Verify Excel content
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet).toBeDefined()
      expect(worksheet.rowCount).toBe(3) // 1 header + 2 data rows

      // Check headers
      const headerRow = worksheet.getRow(1)
      expect(headerRow.getCell(1).value).toBe('Identifier')
      expect(headerRow.getCell(2).value).toBe('Type')
      expect(headerRow.getCell(3).value).toBe('Name')
      expect(headerRow.getCell(4).value).toBe('Code')
      expect(headerRow.getCell(5).value).toBe('PSO Team')
      expect(headerRow.getCell(6).value).toBe('Area')
      expect(headerRow.getCell(7).value).toBe('End Date')

      // Check first data row
      const dataRow1 = worksheet.getRow(2)
      expect(dataRow1.getCell(1).value).toBe('RMA001')
      expect(dataRow1.getCell(2).value).toBe('RMA')
      expect(dataRow1.getCell(3).value).toBe('Bristol City Council')
      expect(dataRow1.getCell(4).value).toBe('AUTH001')
      expect(dataRow1.getCell(5).value).toBe('PSO West')
      expect(dataRow1.getCell(6).value).toBe('Wessex')
      expect(dataRow1.getCell(7).value).toBe('31.12.2025')
    })

    test('handles no RMA data found', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        'No RMA data found for download'
      )
      expect(mockH.response).toHaveBeenCalledWith('No RMA data available')
      expect(mockH.code).toHaveBeenCalledWith(404)
      expect(mockH.type).toHaveBeenCalledWith('text/plain')
    })

    test('handles errors gracefully', async () => {
      const error = new Error('API Error')
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockRejectedValue(error)

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error },
        'Failed to generate RMA download'
      )
      expect(mockH.response).toHaveBeenCalledWith(
        'Error generating RMA download'
      )
      expect(mockH.code).toHaveBeenCalled()
      expect(mockH.type).toHaveBeenCalledWith('text/plain')
    })

    test('handles pagination for large datasets', async () => {
      const mockRMAsPage1 = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `RMA ${i + 1}`,
        area_type: 'RMA',
        identifier: `RMA${String(i + 1).padStart(3, '0')}`,
        parent_id: '10'
      }))

      const mockRMAsPage2 = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 101),
        name: `RMA ${i + 101}`,
        area_type: 'RMA',
        identifier: `RMA${String(i + 101).padStart(3, '0')}`,
        parent_id: '10'
      }))

      mockAreasService.getAreasByType.mockResolvedValue({
        'PSO Area': [{ id: '10', name: 'PSO West', parent_id: '20' }],
        'EA Area': [{ id: '20', name: 'Wessex' }],
        Authority: []
      })

      mockAreasService.getAreasByList
        .mockResolvedValueOnce({
          areas: mockRMAsPage1,
          pagination: { page: 1, totalPages: 2 }
        })
        .mockResolvedValueOnce({
          areas: mockRMAsPage2,
          pagination: { page: 2, totalPages: 2 }
        })

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockAreasService.getAreasByList).toHaveBeenCalledTimes(2)
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ totalRMAs: 150 }),
        'Completed fetching all RMAs'
      )

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet.rowCount).toBe(151) // 1 header + 150 data rows
    })
  })

  describe('_formatRMARowData', () => {
    test('formats RMA data with all parent relationships', async () => {
      const mockAreas = {
        RMA: [],
        'PSO Area': [{ id: '10', name: 'PSO West', parent_id: '20' }],
        'EA Area': [{ id: '20', name: 'Wessex' }],
        Authority: [{ id: 'auth1', identifier: 'AUTH001', name: 'RMA' }]
      }

      mockAreasService.getAreasByType.mockResolvedValue(mockAreas)
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Bristol Council',
            area_type: 'RMA',
            identifier: 'RMA001',
            sub_type: 'AUTH001',
            parent_id: '10',
            end_date: '2025-12-31'
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(5).value).toBe('PSO West') // PSO Team
      expect(dataRow.getCell(6).value).toBe('Wessex') // Area (EA)
    })

    test('handles missing parent relationships', async () => {
      const mockAreas = {
        RMA: [],
        'PSO Area': [],
        'EA Area': [],
        Authority: []
      }

      mockAreasService.getAreasByType.mockResolvedValue(mockAreas)
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Orphan RMA',
            area_type: 'RMA',
            identifier: 'RMA999',
            parent_id: '999'
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(5).value).toBe('') // PSO Team empty
      expect(dataRow.getCell(6).value).toBe('') // Area empty
    })

    test('handles camelCase field names', async () => {
      const mockAreas = {
        'PSO Area': [{ id: '10', name: 'PSO West', parent_id: '20' }],
        'EA Area': [{ id: '20', name: 'Wessex' }],
        Authority: [{ id: 'auth1', identifier: 'AUTH001', name: 'RMA' }]
      }

      mockAreasService.getAreasByType.mockResolvedValue(mockAreas)
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Test RMA',
            areaType: 'RMA',
            identifier: 'RMA001',
            subType: 'AUTH001',
            parentId: '10',
            endDate: '2025-12-31'
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      const dataRow = worksheet.getRow(2)
      expect(dataRow.getCell(1).value).toBe('RMA001')
      expect(dataRow.getCell(2).value).toBe('RMA')
      expect(dataRow.getCell(4).value).toBe('AUTH001')
      expect(dataRow.getCell(7).value).toBe('31.12.2025')
    })
  })

  describe('formatEndDate', () => {
    test('formats date correctly in DD.MM.YYYY format', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Test RMA',
            area_type: 'RMA',
            end_date: '2025-03-15'
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet.getRow(2).getCell(7).value).toBe('15.03.2025')
    })

    test('handles null end date', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Test RMA',
            area_type: 'RMA',
            end_date: null
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet.getRow(2).getCell(7).value).toBe('')
    })

    test('handles invalid date', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          {
            id: '1',
            name: 'Test RMA',
            area_type: 'RMA',
            end_date: 'invalid-date'
          }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet.getRow(2).getCell(7).value).toBe('')
    })
  })

  describe('Excel styling', () => {
    test('applies header styling', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [{ id: '1', name: 'Test RMA', area_type: 'RMA' }],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      const headerRow = worksheet.getRow(1)
      expect(headerRow.font.bold).toBe(true)
      expect(headerRow.font.color.argb).toBe('FFFFFFFF')
      expect(headerRow.fill.fgColor.argb).toBe('FF0B6623')
      expect(headerRow.height).toBe(25)
    })

    test('applies alternating row colors', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [
          { id: '1', name: 'RMA 1', area_type: 'RMA' },
          { id: '2', name: 'RMA 2', area_type: 'RMA' },
          { id: '3', name: 'RMA 3', area_type: 'RMA' }
        ],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      // Row 2 should have gray background (even row)
      const row2 = worksheet.getRow(2)
      expect(row2.fill.fgColor.argb).toBe('FFF5F5F5')

      // Row 3 should not have background (odd row)
      const row3 = worksheet.getRow(3)
      expect(row3.fill?.fgColor).toBeUndefined()

      // Row 4 should have gray background (even row)
      const row4 = worksheet.getRow(4)
      expect(row4.fill.fgColor.argb).toBe('FFF5F5F5')
    })

    test('applies borders to all cells', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [{ id: '1', name: 'Test RMA', area_type: 'RMA' }],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      const dataCell = worksheet.getRow(2).getCell(1)
      expect(dataCell.border.top.style).toBe('thin')
      expect(dataCell.border.left.style).toBe('thin')
      expect(dataCell.border.bottom.style).toBe('thin')
      expect(dataCell.border.right.style).toBe('thin')
    })

    test('freezes header row', async () => {
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [{ id: '1', name: 'Test RMA', area_type: 'RMA' }],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      const buffer = mockH.response.mock.calls[0][0]
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.getWorksheet('RMA Export')

      expect(worksheet.views[0].state).toBe('frozen')
      expect(worksheet.views[0].ySplit).toBe(1)
    })
  })

  describe('fetchAreasByType error handling', () => {
    test('returns empty object on error', async () => {
      const error = new Error('Areas API Error')
      mockAreasService.getAreasByType.mockRejectedValue(error)
      mockAreasService.getAreasByList.mockResolvedValue({
        areas: [{ id: '1', name: 'Test RMA', area_type: 'RMA' }],
        pagination: { page: 1, totalPages: 1 }
      })

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error },
        'Error fetching areas by type'
      )

      // Should still generate file with empty parent data
      const buffer = mockH.response.mock.calls[0][0]
      expect(buffer).toBeInstanceOf(Buffer)
    })
  })

  describe('fetchAllRMAData error handling', () => {
    test('throws error on API failure', async () => {
      const error = new Error('RMA API Error')
      mockAreasService.getAreasByType.mockResolvedValue({})
      mockAreasService.getAreasByList.mockRejectedValue(error)

      await downloadRMAController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error },
        'Failed to generate RMA download'
      )
      expect(mockH.code).toHaveBeenCalled()
      expect(mockH.response).toHaveBeenCalledWith(
        'Error generating RMA download'
      )
    })
  })
})
