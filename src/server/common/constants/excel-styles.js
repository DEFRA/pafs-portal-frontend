/**
 * Excel styling constants
 * Used for generating styled Excel exports
 */

export const EXCEL_COLORS = {
  HEADER_BG: 'FF0B6623', // Dark green
  HEADER_TEXT: 'FFFFFFFF', // White
  ROW_ALT_BG: 'FFF5F5F5', // Light gray
  BORDER: 'FFCCCCCC' // Light gray
}

export const EXCEL_DIMENSIONS = {
  HEADER_HEIGHT: 25
}

export const CELL_BORDER_STYLE = {
  top: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
  left: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
  bottom: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
  right: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } }
}
