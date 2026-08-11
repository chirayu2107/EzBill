import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export const convertElementToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error("Element not found:", elementId)
      return { success: false, error: "Element not found" }
    }

    // Render high-quality canvas from element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    })

    const pdf = new jsPDF("p", "mm", "a4")
    const pdfPageWidthMm = 210
    const pdfPageHeightMm = 297 // Standard A4 height

    // Calculate canvas pixels per mm
    const pxPerMm = canvas.width / pdfPageWidthMm
    const maxPageHeightPx = pdfPageHeightMm * pxPerMm

    // Find all elements that should avoid page breaks
    const containerRect = element.getBoundingClientRect()
    const avoidNodes = element.querySelectorAll(
      '[style*="break-inside: avoid"], [style*="breakInside: avoid"], [style*="page-break-inside: avoid"], [style*="pageBreakInside: avoid"], .pdf-avoid-break, .invoice-footer-section, tr'
    )

    const avoidRanges: { top: number; bottom: number }[] = []
    avoidNodes.forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (rect.height <= 0) return

      const topRatio = (rect.top - containerRect.top) / containerRect.height
      const bottomRatio = (rect.bottom - containerRect.top) / containerRect.height
      const topPx = topRatio * canvas.height
      const bottomPx = bottomRatio * canvas.height

      // Only consider blocks that can fit on a single page
      if (bottomPx - topPx < maxPageHeightPx * 0.95) {
        avoidRanges.push({ top: topPx, bottom: bottomPx })
      }
    })

    // Calculate page split points
    const splitPoints: number[] = [0]
    let currentY = 0

    while (currentY + maxPageHeightPx < canvas.height - 5) {
      let targetY = currentY + maxPageHeightPx

      // Check if targetY cuts inside any avoid range
      const intersecting = avoidRanges.find(
        (r) => r.top < targetY && r.bottom > targetY
      )

      if (intersecting) {
        // Move split point up to top of element if space permits
        if (intersecting.top > currentY + 40) {
          targetY = Math.max(currentY + 40, intersecting.top - 2)
        }
      }

      splitPoints.push(targetY)
      currentY = targetY
    }

    splitPoints.push(canvas.height)

    // Slice canvas into separate PDF pages
    for (let i = 0; i < splitPoints.length - 1; i++) {
      const startY = splitPoints[i]
      const endY = splitPoints[i + 1]
      const sliceHeightPx = endY - startY

      if (sliceHeightPx <= 0) continue

      const pageCanvas = document.createElement("canvas")
      pageCanvas.width = canvas.width
      pageCanvas.height = sliceHeightPx

      const ctx = pageCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        )
      }

      const sliceHeightMm = (sliceHeightPx * pdfPageWidthMm) / canvas.width

      if (i > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        pdfPageWidthMm,
        sliceHeightMm
      )
    }

    // Save the PDF
    pdf.save(filename)
    return { success: true }
  } catch (error: any) {
    console.error("Error converting to PDF:", error)
    return { success: false, error: error.message }
  }
}
