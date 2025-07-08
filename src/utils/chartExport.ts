import html2canvas from "html2canvas"

export const exportChartAsPNG = async (chartId: string, filename: string): Promise<void> => {
  try {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) {
      throw new Error("Chart element not found")
    }

    // Create canvas from the chart element
    const canvas = await html2canvas(chartElement, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#1F2937", // Match the dark theme
      width: chartElement.scrollWidth,
      height: chartElement.scrollHeight,
    })

    // Create download link
    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/png")

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Chart export error:", error)
    throw new Error("Failed to export chart as PNG")
  }
}

export const exportChartAsJPEG = async (chartId: string, filename: string, quality = 0.9): Promise<void> => {
  try {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) {
      throw new Error("Chart element not found")
    }

    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#1F2937",
      width: chartElement.scrollWidth,
      height: chartElement.scrollHeight,
    })

    const link = document.createElement("a")
    link.download = filename
    link.href = canvas.toDataURL("image/jpeg", quality)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error("Chart export error:", error)
    throw new Error("Failed to export chart as JPEG")
  }
}
