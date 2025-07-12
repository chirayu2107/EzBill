import jsPDF from "jspdf"
import type { Invoice, User } from "../types"
import { formatCurrency, formatDate } from "./calculations"

export const generateInvoicePDF = (invoice: Invoice, user?: User | null) => {
  const pdf = new jsPDF()

  // Set font
  pdf.setFont("helvetica")

  // Main border around entire invoice - thinner
  pdf.setLineWidth(0.3)
  pdf.rect(10, 10, 190, 280)

  // Header section with thinner border
  pdf.setLineWidth(0.2)
  pdf.rect(15, 15, 180, 35)

  // TAX INVOICE title - centered
  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  const pageWidth = 210
  const textWidth = pdf.getTextWidth("TAX INVOICE")
  const centerX = (pageWidth - textWidth) / 2
  pdf.text("TAX INVOICE", centerX, 25)

  // ORIGINAL FOR RECIPIENT box - properly aligned and thinner border
  pdf.setLineWidth(0.2)
  pdf.rect(145, 18, 45, 8)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  const recipientText = "ORIGINAL FOR RECIPIENT"
  const recipientWidth = pdf.getTextWidth(recipientText)
  const recipientCenterX = 145 + (45 - recipientWidth) / 2
  pdf.text(recipientText, recipientCenterX, 23)

  // Business section with thinner borders
  pdf.setLineWidth(0.2)

  // Logo/Initial box - thinner border
  pdf.rect(20, 32, 12, 12)
  pdf.setFontSize(12)
  pdf.setFont("helvetica", "bold")
  const initial = user?.fullName?.charAt(0) || "B"
  pdf.text(initial, 24, 40)

  // Business Details (Right of logo)
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text(user?.fullName || "Your Business", 37, 37)

  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  let yPos = 41
  if (user?.address) {
    pdf.text(user.address, 37, yPos)
    yPos += 3
  }
  if (user?.state) {
    pdf.text(`State: ${user.state}`, 37, yPos)
    yPos += 3
  }
  if (user?.gstNumber) {
    pdf.text(`GSTIN: ${user.gstNumber}`, 37, yPos)
    yPos += 3
  }
  if (user?.panNumber) {
    pdf.text(`PAN Number: ${user.panNumber}`, 37, yPos)
    yPos += 3
  }
  if (user?.phoneNumber) {
    pdf.text(`Mobile: ${user.phoneNumber}`, 37, yPos)
  }

  // Line after business information - thinner
  pdf.setLineWidth(0.2)
  pdf.line(15, 52, 195, 52)

  // Invoice Details (Right side)
  pdf.setFontSize(9)
  pdf.setFont("helvetica", "bold")
  pdf.text("Invoice No.", 145, 37)
  pdf.setFont("helvetica", "normal")
  pdf.text(invoice.invoiceNumber, 145, 41)

  pdf.setFont("helvetica", "bold")
  pdf.text("Invoice Date", 145, 45)
  pdf.setFont("helvetica", "normal")
  pdf.text(formatDate(invoice.date), 145, 49)

  // BILL TO Section
  const billToY = 60
  pdf.setFontSize(11)
  pdf.setFont("helvetica", "bold")
  pdf.text("BILL TO", 20, billToY)

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "bold")
  pdf.text(invoice.customerName, 20, billToY + 6)

  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  let customerY = billToY + 12
  pdf.text(`Address: ${invoice.customerAddress}`, 20, customerY)
  customerY += 3
  pdf.text(`State: ${invoice.customerState}`, 20, customerY)
  customerY += 3
  if (invoice.customerGSTIN) {
    pdf.text(`GSTIN: ${invoice.customerGSTIN}`, 20, customerY)
    customerY += 3
  }
  if (invoice.customerPAN) {
    pdf.text(`PAN Number: ${invoice.customerPAN}`, 20, customerY)
  }

  // Items Table - centered and with thinner borders
  const tableStartY = 95
  const tableWidth = 170
  const tableStartX = (pageWidth - tableWidth) / 2

  // Table Headers with light grey background
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.setLineWidth(0.2)

  // Header background - light grey
  pdf.setFillColor(240, 240, 240)
  pdf.rect(tableStartX, tableStartY, tableWidth, 7, "F")
  pdf.rect(tableStartX, tableStartY, tableWidth, 7)

  // Column widths
  const colWidths = [15, 60, 25, 15, 25, 30]
  let currentX = tableStartX

  // Header texts centered in columns
  const headers = ["S.NO", "SERVICES", "HSN/SAC", "QTY", "RATE", "AMOUNT"]
  headers.forEach((header, index) => {
    const headerWidth = pdf.getTextWidth(header)
    const centerHeaderX = currentX + (colWidths[index] - headerWidth) / 2
    pdf.text(header, centerHeaderX, tableStartY + 5)

    // Vertical lines
    if (index < headers.length - 1) {
      pdf.line(currentX + colWidths[index], tableStartY, currentX + colWidths[index], tableStartY + 7)
    }
    currentX += colWidths[index]
  })

  // Items rows
  let itemY = tableStartY + 7
  pdf.setFont("helvetica", "normal")
  invoice.items.forEach((item, index) => {
    pdf.rect(tableStartX, itemY, tableWidth, 7)

    currentX = tableStartX
    // S.NO
    pdf.text((index + 1).toString(), currentX + 7, itemY + 5)
    currentX += colWidths[0]

    // SERVICES
    pdf.text(item.name.substring(0, 25), currentX + 2, itemY + 5)
    currentX += colWidths[1]

    // HSN/SAC
    const hsnText = item.hsnSac || " "
    const hsnWidth = pdf.getTextWidth(hsnText)
    pdf.text(hsnText, currentX + (colWidths[2] - hsnWidth) / 2, itemY + 5)
    currentX += colWidths[2]

    // QTY
    const qtyText = item.quantity.toString()
    const qtyWidth = pdf.getTextWidth(qtyText)
    pdf.text(qtyText, currentX + (colWidths[3] - qtyWidth) / 2, itemY + 5)
    currentX += colWidths[3]

    // RATE
    const rateText = formatCurrency(item.rate).replace("₹", "")
    pdf.text(rateText, currentX + colWidths[4] - pdf.getTextWidth(rateText) - 2, itemY + 5)
    currentX += colWidths[4]

    // AMOUNT
    const amountText = formatCurrency(item.lineTotal).replace("₹", "")
    pdf.text(amountText, currentX + colWidths[5] - pdf.getTextWidth(amountText) - 2, itemY + 5)

    // Vertical lines for each row
    currentX = tableStartX
    headers.forEach((_, index) => {
      if (index < headers.length - 1) {
        pdf.line(currentX + colWidths[index], itemY, currentX + colWidths[index], itemY + 7)
      }
      currentX += colWidths[index]
    })

    itemY += 7
  })

  // Subtotal row
  pdf.rect(tableStartX, itemY, tableWidth, 7)
  pdf.setFont("helvetica", "bold")
  pdf.text("Subtotal", tableStartX + tableWidth - 60, itemY + 5)
  const subtotalText = formatCurrency(invoice.subtotal).replace("₹", "")
  pdf.text(subtotalText, tableStartX + tableWidth - pdf.getTextWidth(subtotalText) - 2, itemY + 5)
  itemY += 7

  // GST rows
  if (invoice.gstBreakdown.isInterState) {
    pdf.rect(tableStartX, itemY, tableWidth, 7)
    pdf.text("IGST @ 18%", tableStartX + tableWidth - 60, itemY + 5)
    const igstText = formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")
    pdf.text(igstText, tableStartX + tableWidth - pdf.getTextWidth(igstText) - 2, itemY + 5)
    itemY += 7
  } else {
    // CGST
    pdf.rect(tableStartX, itemY, tableWidth, 7)
    pdf.text("CGST @ 9%", tableStartX + tableWidth - 60, itemY + 5)
    const cgstText = formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")
    pdf.text(cgstText, tableStartX + tableWidth - pdf.getTextWidth(cgstText) - 2, itemY + 5)
    itemY += 7

    // SGST
    pdf.rect(tableStartX, itemY, tableWidth, 7)
    pdf.text("SGST @ 9%", tableStartX + tableWidth - 60, itemY + 5)
    const sgstText = formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")
    pdf.text(sgstText, tableStartX + tableWidth - pdf.getTextWidth(sgstText) - 2, itemY + 5)
    itemY += 7
  }

  // Total row with light grey background
  pdf.setFillColor(240, 240, 240)
  pdf.rect(tableStartX, itemY, tableWidth, 7, "F")
  pdf.rect(tableStartX, itemY, tableWidth, 7)
  pdf.setFont("helvetica", "bold")
  pdf.text("TOTAL", tableStartX + tableWidth - 60, itemY + 5)
  const totalText = "₹" + formatCurrency(invoice.total).replace("₹", "")
  pdf.text(totalText, tableStartX + tableWidth - pdf.getTextWidth(totalText) - 2, itemY + 5)
  itemY += 15

  // Tax Summary Table - centered with light grey headers
  const taxTableY = itemY
  const taxTableWidth = 170
  const taxTableX = (pageWidth - taxTableWidth) / 2

  // Tax table headers with light grey background
  pdf.setFillColor(240, 240, 240)
  pdf.rect(taxTableX, taxTableY, taxTableWidth, 7, "F")
  pdf.rect(taxTableX, taxTableY, taxTableWidth, 7)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)

  if (invoice.gstBreakdown.isInterState) {
    // IGST headers
    const taxColWidths = [30, 40, 30, 30, 40]
    let taxCurrentX = taxTableX
    const taxHeaders = ["HSN/SAC", "Taxable Value", "IGST Rate", "IGST Amount", "Total Tax"]

    taxHeaders.forEach((header, index) => {
      const headerWidth = pdf.getTextWidth(header)
      const centerHeaderX = taxCurrentX + (taxColWidths[index] - headerWidth) / 2
      pdf.text(header, centerHeaderX, taxTableY + 5)

      if (index < taxHeaders.length - 1) {
        pdf.line(taxCurrentX + taxColWidths[index], taxTableY, taxCurrentX + taxColWidths[index], taxTableY + 7)
      }
      taxCurrentX += taxColWidths[index]
    })
  } else {
    // CGST + SGST headers
    const taxColWidths = [25, 35, 25, 25, 25, 25, 35]
    let taxCurrentX = taxTableX
    const taxHeaders = ["HSN/SAC", "Taxable Value", "CGST Rate", "CGST Amount", "SGST Rate", "SGST Amount", "Total Tax"]

    taxHeaders.forEach((header, index) => {
      const headerWidth = pdf.getTextWidth(header)
      const centerHeaderX = taxCurrentX + (taxColWidths[index] - headerWidth) / 2
      pdf.text(header, centerHeaderX, taxTableY + 5)

      if (index < taxHeaders.length - 1) {
        pdf.line(taxCurrentX + taxColWidths[index], taxTableY, taxCurrentX + taxColWidths[index], taxTableY + 7)
      }
      taxCurrentX += taxColWidths[index]
    })
  }

  // Tax table data
  const dataY = taxTableY + 7
  pdf.rect(taxTableX, dataY, taxTableWidth, 7)
  pdf.setFont("helvetica", "normal")

  if (invoice.gstBreakdown.isInterState) {
    const taxColWidths = [30, 40, 30, 30, 40]
    let taxCurrentX = taxTableX

    // HSN/SAC
    const hsnText = invoice.items[0]?.hsnSac || " "
    pdf.text(hsnText, taxCurrentX + (taxColWidths[0] - pdf.getTextWidth(hsnText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[0]

    // Taxable Value
    const taxableText = formatCurrency(invoice.subtotal).replace("₹", "")
    pdf.text(taxableText, taxCurrentX + (taxColWidths[1] - pdf.getTextWidth(taxableText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[1]

    // IGST Rate
    pdf.text("18%", taxCurrentX + (taxColWidths[2] - pdf.getTextWidth("18%")) / 2, dataY + 5)
    taxCurrentX += taxColWidths[2]

    // IGST Amount
    const igstText = formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")
    pdf.text(igstText, taxCurrentX + (taxColWidths[3] - pdf.getTextWidth(igstText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[3]

    // Total Tax
    const totalTaxText = formatCurrency(invoice.gstBreakdown.total).replace("₹", "")
    pdf.text(totalTaxText, taxCurrentX + (taxColWidths[4] - pdf.getTextWidth(totalTaxText)) / 2, dataY + 5)
  } else {
    const taxColWidths = [25, 35, 25, 25, 25, 25, 35]
    let taxCurrentX = taxTableX

    // HSN/SAC
    const hsnText = invoice.items[0]?.hsnSac || " "
    pdf.text(hsnText, taxCurrentX + (taxColWidths[0] - pdf.getTextWidth(hsnText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[0]

    // Taxable Value
    const taxableText = formatCurrency(invoice.subtotal).replace("₹", "")
    pdf.text(taxableText, taxCurrentX + (taxColWidths[1] - pdf.getTextWidth(taxableText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[1]

    // CGST Rate
    pdf.text("9%", taxCurrentX + (taxColWidths[2] - pdf.getTextWidth("9%")) / 2, dataY + 5)
    taxCurrentX += taxColWidths[2]

    // CGST Amount
    const cgstText = formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")
    pdf.text(cgstText, taxCurrentX + (taxColWidths[3] - pdf.getTextWidth(cgstText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[3]

    // SGST Rate
    pdf.text("9%", taxCurrentX + (taxColWidths[4] - pdf.getTextWidth("9%")) / 2, dataY + 5)
    taxCurrentX += taxColWidths[4]

    // SGST Amount
    const sgstText = formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")
    pdf.text(sgstText, taxCurrentX + (taxColWidths[5] - pdf.getTextWidth(sgstText)) / 2, dataY + 5)
    taxCurrentX += taxColWidths[5]

    // Total Tax
    const totalTaxText = formatCurrency(invoice.gstBreakdown.total).replace("₹", "")
    pdf.text(totalTaxText, taxCurrentX + (taxColWidths[6] - pdf.getTextWidth(totalTaxText)) / 2, dataY + 5)
  }

  // Total row for tax table with light grey background
  const totalRowY = dataY + 7
  pdf.setFillColor(240, 240, 240)
  pdf.rect(taxTableX, totalRowY, taxTableWidth, 7, "F")
  pdf.rect(taxTableX, totalRowY, taxTableWidth, 7)
  pdf.setFont("helvetica", "bold")
  pdf.text("Total", taxTableX + 10, totalRowY + 5)

  // Amount in Words
  const wordsY = totalRowY + 20
  pdf.setLineWidth(0.2)
  pdf.rect(20, wordsY, 170, 12)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.text("Total Amount (in words)", 22, wordsY + 5)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)

  const convertToWords = (amount: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    const convertHundreds = (num: number): string => {
      let result = ""
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " Hundred "
        num %= 100
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + " "
        num %= 10
      } else if (num >= 10) {
        result += teens[num - 10] + " "
        return result
      }
      if (num > 0) {
        result += ones[num] + " "
      }
      return result
    }

    if (amount === 0) return "Zero Rupees Only"

    let result = ""
    const crores = Math.floor(amount / 10000000)
    const lakhs = Math.floor((amount % 10000000) / 100000)
    const thousands = Math.floor((amount % 100000) / 1000)
    const hundreds = amount % 1000

    if (crores > 0) result += convertHundreds(crores) + "Crore "
    if (lakhs > 0) result += convertHundreds(lakhs) + "Lakh "
    if (thousands > 0) result += convertHundreds(thousands) + "Thousand "
    if (hundreds > 0) result += convertHundreds(hundreds)

    return result.trim() + " Rupees Only"
  }

  pdf.text(convertToWords(invoice.total), 22, wordsY + 9)

  // Footer - Bank Details, Terms, Signature with thinner borders
  const footerY = wordsY + 20
  pdf.setLineWidth(0.2)

  // Bank Details
  pdf.rect(20, footerY, 55, 20)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.text("Bank Details", 22, footerY + 5)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text(`Name: ${user?.bankName || "Bank Name"}`, 22, footerY + 9)
  pdf.text(`IFSC: ${user?.ifscCode || "IFSC Code"}`, 22, footerY + 12)
  pdf.text(`A/c No: ${user?.accountNumber || "Account Number"}`, 22, footerY + 15)

  // Terms and Conditions
  pdf.rect(75, footerY, 55, 20)
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("Terms and Conditions", 77, footerY + 5)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6)
  pdf.text(`1. All disputes are subject to ${user?.state || "jurisdiction"}`, 77, footerY + 9)
  pdf.text("   jurisdiction only", 77, footerY + 11)
  pdf.text("2. TDS Deduction will lie under Section 194C", 77, footerY + 13)
  pdf.text("3. Payment to Contractor (1% or 2%)", 77, footerY + 15)

  // Signature section
  pdf.rect(130, footerY, 60, 20)

  // Try to add signature image if available
  if (user?.signature && isValidBase64Image(user.signature)) {
    try {
      // Add signature image to PDF
      const signatureFormat = getImageFormat(user.signature)
      if (signatureFormat) {
        pdf.addImage(
          user.signature,
          signatureFormat,
          135, // x position
          footerY + 2, // y position
          25, // width
          8, // height
          undefined,
          "FAST",
        )
      }
    } catch (error) {
      console.error("Error adding signature to PDF:", error)
      // Fallback to text if image fails
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "italic")
      pdf.text("Digital Signature", 140, footerY + 8)
    }
  }

  pdf.setFontSize(8)
  pdf.setFont("helvetica", "bold")
  pdf.text("Authorised Signatory For", 140, footerY + 16)
  pdf.text(user?.fullName || "Your Business", 140, footerY + 19)

  // Save PDF
  pdf.save(`invoice-${invoice.invoiceNumber}.pdf`)
}

// Helper function to validate base64 image
const isValidBase64Image = (base64String: string): boolean => {
  if (!base64String) return false
  const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/i
  return base64Pattern.test(base64String)
}

// Helper function to get image format from base64 string
const getImageFormat = (base64String: string): string | null => {
  const match = base64String.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/i)
  if (match) {
    const format = match[1].toLowerCase()
    return format === "jpg" ? "JPEG" : format.toUpperCase()
  }
  return null
}
