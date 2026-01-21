"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Invoice } from "../../types"
import { useAuth } from "../../context/AuthContext"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { convertElementToPDF } from "../../utils/html-to-pdf"
import { X, Download, Printer } from "lucide-react"
import Button from "../UI/Button"
import { useToast } from "../../hooks/useToast"

interface InvoicePreviewProps {
  invoice: Invoice
  onClose: () => void
  autoDownload?: boolean
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose, autoDownload = false }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [signatureError, setSignatureError] = useState(false)

  // Auto-download functionality
  useEffect(() => {
    if (autoDownload) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        handleDownloadPDF()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [autoDownload])

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    toast.info("Generating PDF", "Creating your invoice PDF from preview...")

    try {
      const filename = `invoice-${invoice.invoiceNumber}.pdf`
      const result = await convertElementToPDF(`invoice-preview-${invoice.id}`, filename)

      if (result.success) {
        toast.success("PDF Downloaded", "Your invoice has been downloaded successfully!")
        if (autoDownload) {
          // Close the preview after successful download
          setTimeout(() => {
            onClose()
          }, 1000)
        }
      } else {
        throw new Error(result.error || "Failed to generate PDF")
      }
    } catch (error: any) {
      console.error("PDF generation error:", error)
      toast.error("PDF Generation Failed", error.message || "Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePrint = () => {
    toast.info("Printing Invoice", "Opening print dialog...")
    window.print()
  }

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

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Handle signature image error
  const handleSignatureError = () => {
    console.error("Signature image failed to load")
    setSignatureError(true)
  }

  // Check if signature is valid base64
  const isValidSignature = (signature?: string) => {
    if (!signature) return false

    // Check if it's a valid base64 data URL
    const base64Pattern = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/i
    const isValidBase64 = base64Pattern.test(signature)

    console.log("Signature validation:", {
      exists: !!signature,
      length: signature.length,
      startsWithData: signature.startsWith("data:"),
      isValidBase64,
      preview: signature.substring(0, 50) + "...",
    })

    return isValidBase64
  }

  // Create signature image style with proper typing
  const signatureImageStyle: React.CSSProperties = {
    filter: "contrast(1.2)",
    imageRendering: "crisp-edges",
    // Use type assertion for webkit-specific property
    ...({
      WebkitImageRendering: "crisp-edges",
    } as any),
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 md:p-4 z-50 ${autoDownload ? "pointer-events-none" : ""}`}
    >
      <div
        className={`bg-white rounded-lg md:rounded-xl shadow-2xl w-full max-w-6xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto ${autoDownload ? "opacity-0" : ""}`}
      >
        {/* Header Actions - Only show if not auto-downloading */}
        {!autoDownload && (
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 md:p-4 border-b border-gray-200 bg-gray-50 gap-2">
            <h2 className="text-base md:text-xl font-semibold text-gray-800">Invoice Preview</h2>
            <div className="flex items-center gap-1 md:gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDownloadPDF}
                icon={Download}
                variant="primary"
                size="sm"
                disabled={isGeneratingPDF}
                className={`flex-1 sm:flex-none text-xs md:text-sm px-2 md:px-4 py-1 md:py-2 ${isGeneratingPDF ? "opacity-75" : ""}`}
              >
                {isGeneratingPDF ? "Generating..." : "Download"}
              </Button>
              <Button
                onClick={handlePrint}
                icon={Printer}
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
              >
                Print
              </Button>
              <Button
                onClick={onClose}
                icon={X}
                variant="secondary"
                size="sm"
                className="text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
              >
                <span className="hidden sm:inline">Close</span>
              </Button>
            </div>
          </div>
        )}

        {/* Invoice Content - Optimized for Mobile Clarity */}
        <div
          className="invoice-print-content p-1 md:p-6 bg-white text-gray-900 text-[8px] md:text-sm leading-[9px] md:leading-normal font-medium"
          id={`invoice-preview-${invoice.id}`}
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          }}
        >
          {/* Main Border - Thinner on mobile */}
          <div className="border border-gray-600 md:border-gray-800 p-1 md:p-4">
            {/* Header with TAX INVOICE and ORIGINAL FOR RECIPIENT */}
            <div className="flex justify-between items-center mb-1 md:mb-4 pb-1 md:pb-2 border-b border-gray-600 md:border-gray-800">
              <h1 className="text-[12px] md:text-2xl font-bold text-gray-900">TAX INVOICE</h1>
              <div className="border border-gray-600 md:border-gray-800 px-1 md:px-3 py-0.5 md:py-1">
                <p className="text-[6px] md:text-sm font-bold whitespace-nowrap text-gray-900">
                  ORIGINAL FOR RECIPIENT
                </p>
              </div>
            </div>

            {/* Business Details and Invoice Info */}
            <div className="flex justify-between mb-1 md:mb-4 pb-1 md:pb-3 border-b border-gray-600 md:border-gray-800 gap-1 md:gap-3">
              <div className="flex gap-1 md:gap-3 flex-1">
                {/* Logo or Initials Box */}
                <div className="border border-gray-600 md:border-gray-800 w-6 h-6 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0 bg-gray-50 overflow-hidden">
                  {user?.businessLogo ? (
                    <img 
                      src={user.businessLogo} 
                      alt="Business Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[8px] md:text-lg font-bold text-gray-900">
                      {getInitials(user?.fullName || "Business")}
                    </span>
                  )}
                </div>

                {/* Business Details */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[9px] md:text-base font-bold mb-0.5 md:mb-1 text-gray-900">
                    {user?.fullName || "Your Business"}
                  </h2>
                  <div className="text-[7px] md:text-sm space-y-0 md:space-y-0.5 leading-[8px] md:leading-normal text-gray-800">
                    <p className="break-words">{user?.address}</p>
                    <p>State: {user?.state}</p>
                    {user?.gstNumber && <p>GSTIN: {user.gstNumber}</p>}
                    <p>PAN: {user?.panNumber}</p>
                    <p>Mobile: {user?.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right text-[7px] md:text-sm flex-shrink-0 text-gray-800">
                <div className="mb-1 md:mb-2">
                  <p className="font-bold text-gray-900">Invoice No.</p>
                  <p className="break-all">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Invoice Date</p>
                  <p>{formatDate(invoice.date)}</p>
                </div>
              </div>
            </div>

            {/* BILL TO Section */}
            <div className="mb-1 md:mb-4">
              <h3 className="text-[8px] md:text-sm font-bold mb-0.5 md:mb-1 text-gray-900">BILL TO</h3>
              <div className="text-[7px] md:text-sm leading-[8px] md:leading-normal text-gray-800">
                <h4 className="text-[9px] md:text-base font-bold mb-0.5 md:mb-1 break-words text-gray-900">
                  {invoice.customerName}
                </h4>
                <p className="break-words">Address: {invoice.customerAddress}</p>
                <p>State: {invoice.customerState}</p>
                {invoice.customerGSTIN && <p className="break-all">GSTIN: {invoice.customerGSTIN}</p>}
                {invoice.customerPAN && <p>PAN: {invoice.customerPAN}</p>}
              </div>
            </div>

            {/* Items Table - Clear and Readable on Mobile */}
            <div className="mb-1 md:mb-4">
              <table className="w-full border-collapse text-[6px] md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[8%] md:w-auto text-gray-900">
                      S.NO
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-left w-[35%] md:w-auto text-gray-900">
                      SERVICES
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[12%] md:w-auto text-gray-900">
                      HSN/SAC
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[8%] md:w-auto text-gray-900">
                      QTY
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-right w-[15%] md:w-auto text-gray-900">
                      RATE
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-right w-[22%] md:w-auto text-gray-900">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="bg-white">
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-900">
                        {index + 1}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 break-words text-gray-800 leading-[7px] md:leading-normal">
                        {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                        {item.hsnSac || " "}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right text-gray-800">
                        {formatCurrency(item.rate).replace("₹", "")}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right text-gray-900 font-semibold">
                        {formatCurrency(item.lineTotal).replace("₹", "")}
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr className="bg-gray-50">
                    <td
                      colSpan={5}
                      className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                    >
                      Subtotal
                    </td>
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                  </tr>

                  {/* GST Rows */}
                  {invoice.gstBreakdown.isInterState ? (
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                      >
                        IGST @ 18%
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                        {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr className="bg-gray-50">
                        <td
                          colSpan={5}
                          className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                        >
                          CGST @ 9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td
                          colSpan={5}
                          className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                        >
                          SGST @ 9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Total Row */}
                  <tr className="bg-gray-200">
                    <td
                      colSpan={5}
                      className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                    >
                      TOTAL
                    </td>
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                      ₹{formatCurrency(invoice.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Summary Table - Simplified for Mobile */}
            <div className="mb-1 md:mb-4">
              <table className="w-full border-collapse text-[6px] md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[15%] md:w-auto text-gray-900">
                      HSN/SAC
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[20%] md:w-auto text-gray-900">
                      Taxable Value
                    </th>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[15%] md:w-auto text-gray-900">
                          IGST Rate
                        </th>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[25%] md:w-auto text-gray-900">
                          IGST Amount
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[12%] md:w-auto text-gray-900">
                          CGST Rate
                        </th>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[15%] md:w-auto text-gray-900">
                          CGST Amount
                        </th>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[12%] md:w-auto text-gray-900">
                          SGST Rate
                        </th>
                        <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[14%] md:w-auto text-gray-900">
                          SGST Amount
                        </th>
                      </>
                    )}
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[25%] md:w-auto text-gray-900">
                      Total Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                      {invoice.items[0]?.hsnSac || " "}
                    </td>
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          18%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-900 font-semibold">
                      {formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                      Total
                    </td>
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900"></td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                          {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900"></td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900"></td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center font-bold text-gray-900">
                      {formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words - Clear and Readable */}
            <div className="mb-1 md:mb-4">
              <div className="border border-gray-400 md:border-gray-800 p-1 md:p-3 bg-gray-50">
                <p className="text-[7px] md:text-sm font-bold mb-0.5 md:mb-1 text-gray-900">Total Amount (in words)</p>
                <p className="text-[6px] md:text-sm italic break-words leading-[7px] md:leading-normal text-gray-800">
                  {convertToWords(invoice.total)}
                </p>
              </div>
            </div>

            {/* Footer Section - Clear and Organized */}
            <div className="grid grid-cols-3 gap-0.5 md:gap-3">
              <div className="border border-gray-400 md:border-gray-800 p-1 md:p-3 bg-gray-50">
                <p className="text-[7px] md:text-sm font-bold mb-0.5 md:mb-2 text-gray-900">Bank Details</p>
                <div className="text-[6px] md:text-xs space-y-0 md:space-y-0.5 leading-[7px] md:leading-normal text-gray-800">
                  <p className="break-words">Name: {user?.bankName || "Bank Name"}</p>
                  <p>IFSC: {user?.ifscCode || "IFSC Code"}</p>
                  <p className="break-words">A/c No: {user?.accountNumber || "Account Number"}</p>
                </div>
              </div>

              <div className="border border-gray-400 md:border-gray-800 p-1 md:p-3 bg-gray-50">
                <p className="text-[7px] md:text-sm font-bold mb-0.5 md:mb-2 text-gray-900">Terms and Conditions</p>
                <div className="text-[6px] md:text-xs space-y-0 md:space-y-0.5 leading-[7px] md:leading-normal text-gray-800">
                  <p className="break-words">
                    1. All disputes arising out of this transaction shall be subject to the exclusive jurisdiction of courts in {user?.state || "jurisdiction"}.
                  </p>
                  <p>2. TDS Deduction will lie under Section 194C</p>
                  <p>3. Payment to Contractor (1% or 2%)</p>
                </div>
              </div>

              <div className="border border-gray-400 md:border-gray-800 p-1 md:p-3 text-center bg-gray-50">
                {/* Digital Signature - Clear Display */}
                {isValidSignature(user?.signature) && !signatureError ? (
                  <div className="mb-0.5 md:mb-3">
                    <img
                      src={user?.signature || "/placeholder.svg"}
                      alt="Digital Signature"
                      className="max-h-4 md:max-h-20 max-w-full object-contain mx-auto mb-0.5 md:mb-1"
                      style={signatureImageStyle}
                      onError={handleSignatureError}
                      onLoad={() => {
                        console.log("Signature loaded successfully in invoice preview")
                        setSignatureError(false)
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="h-4 md:h-10 mb-0.5 md:mb-2 flex items-center justify-center">
                    {user?.signature && signatureError ? (
                      <span className="text-[6px] md:text-xs text-red-500 italic">Signature Error</span>
                    ) : (
                      <span className="text-[6px] md:text-xs text-gray-500 italic">
                        {user?.signature ? "Loading..." : "Digital Signature"}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[7px] md:text-sm font-bold text-gray-900">Authorised Signatory For</p>
                <p className="text-[6px] md:text-sm font-bold break-words text-gray-900">
                  {user?.fullName || "Your Business"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicePreview
