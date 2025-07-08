import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export const convertElementToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error("Element not found:", elementId)
      return { success: false, error: "Element not found" }
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    })

    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    const pdf = new jsPDF("p", "mm", "a4")
    let position = 0

    // Add the first page
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save the PDF
    pdf.save(filename)
    return { success: true }
  } catch (error: any) {
    console.error("Error converting to PDF:", error)
    return { success: false, error: error.message }
  }
}
