import ExcelJS from 'exceljs'
import type { OvertimeEntry } from './db'

export async function exportToExcel(
  entries: OvertimeEntry[],
  rangeLabel: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Overtime Tracker'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Overtime', {
    pageSetup: { fitToPage: true, orientation: 'portrait' }
  })

  // Title row
  sheet.mergeCells('A1:D1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = `Overtime Report – ${rangeLabel}`
  titleCell.font = { bold: true, size: 14 }
  titleCell.alignment = { horizontal: 'center' }

  // Header row
  const headerRow = sheet.addRow(['Date', 'Day', 'Hours', 'Notes'])
  headerRow.font = { bold: true }
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
    cell.font = { bold: true, color: { argb: 'FFF8FAFC' } }
    cell.alignment = { horizontal: 'center' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF334155' } }
    }
  })

  // Data rows
  let totalHours = 0
  for (const entry of entries) {
    const date = new Date(entry.date + 'T00:00:00')
    const dayName = date.toLocaleDateString(undefined, { weekday: 'long' })
    const displayDate = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const row = sheet.addRow([displayDate, dayName, entry.hours, entry.note ?? ''])
    row.getCell(3).alignment = { horizontal: 'center' }
    row.getCell(1).alignment = { horizontal: 'center' }
    totalHours += entry.hours
  }

  // Totals row
  const totalRow = sheet.addRow(['', 'TOTAL', totalHours, ''])
  totalRow.font = { bold: true }
  totalRow.getCell(2).alignment = { horizontal: 'right' }
  totalRow.getCell(3).alignment = { horizontal: 'center' }
  totalRow.eachCell(cell => {
    cell.border = { top: { style: 'thin' } }
  })

  // Column widths
  sheet.getColumn(1).width = 14
  sheet.getColumn(2).width = 16
  sheet.getColumn(3).width = 10
  sheet.getColumn(4).width = 30

  // Download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `overtime-${rangeLabel.replace(/\s+/g, '-').toLowerCase()}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
