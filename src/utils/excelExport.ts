import * as XLSX from "xlsx"

export const exportToExcel = async (data: any[], filename: string, sheetName = "Sheet1"): Promise<void> => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String(row[key] || "").length)) + 2,
    }))
    worksheet["!cols"] = colWidths

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Write the file
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error("Excel export error:", error)
    throw new Error("Failed to export to Excel")
  }
}

export const exportMultipleSheets = async (
  sheets: Array<{ data: any[]; name: string }>,
  filename: string,
): Promise<void> => {
  try {
    const workbook = XLSX.utils.book_new()

    sheets.forEach(({ data, name }) => {
      const worksheet = XLSX.utils.json_to_sheet(data)

      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...data.map((row) => String(row[key] || "").length)) + 2,
      }))
      worksheet["!cols"] = colWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, name)
    })

    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error("Multi-sheet Excel export error:", error)
    throw new Error("Failed to export to Excel")
  }
}
