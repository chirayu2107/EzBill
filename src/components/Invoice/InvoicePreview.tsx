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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${autoDownload ? "pointer-events-none" : ""}`}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto ${autoDownload ? "opacity-0" : ""}`}
      >
        {/* Header Actions - Only show if not auto-downloading */}
        {!autoDownload && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDownloadPDF}
                icon={Download}
                variant="primary"
                size="sm"
                disabled={isGeneratingPDF}
                className={isGeneratingPDF ? "opacity-75" : ""}
              >
                {isGeneratingPDF ? "Generating..." : "Download"}
              </Button>
              <Button onClick={handlePrint} icon={Printer} variant="secondary" size="sm">
                Print
              </Button>
              <Button onClick={onClose} icon={X} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Invoice Content */}
        <div className="p-8 bg-white text-gray-800" id={`invoice-preview-${invoice.id}`}>
          {/* Main Border */}
          <div className="border-2 border-gray-800 p-6">
            {/* Header with TAX INVOICE and ORIGINAL FOR RECIPIENT */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-800">
              <h1 className="text-2xl font-bold">TAX INVOICE</h1>
              <div className="border border-gray-800 px-4 py-2">
                <p className="text-sm font-bold">ORIGINAL FOR RECIPIENT</p>
              </div>
            </div>

            {/* Business Details and Invoice Info */}
            <div className="flex justify-between mb-6 pb-4 border-b border-gray-800">
              <div className="flex gap-4">
                {/* Initials Box */}
                <div className="border border-gray-800 w-16 h-16 flex items-center justify-center">
                  <span className="text-xl font-bold">{getInitials(user?.fullName || "Business")}</span>
                </div>

                {/* Business Details */}
                <div className="text-sm">
                  <h2 className="text-lg font-bold mb-1">{user?.fullName || "Your Business"}</h2>
                  <p>{user?.address}</p>
                  <p>State: {user?.state}</p>
                  {user?.gstNumber && <p>GSTIN: {user.gstNumber}</p>}
                  <p>PAN Number: {user?.panNumber}</p>
                  <p>Mobile: {user?.phoneNumber}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right text-sm">
                <div className="mb-3">
                  <p className="font-bold">Invoice No.</p>
                  <p>{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="font-bold">Invoice Date</p>
                  <p>{formatDate(invoice.date)}</p>
                </div>
              </div>
            </div>

            {/* BILL TO Section */}
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-2">BILL TO</h3>
              <div className="text-sm">
                <h4 className="text-lg font-bold mb-1">{invoice.customerName}</h4>
                <p>Address: {invoice.customerAddress}</p>
                <p>State: {invoice.customerState}</p>
                {invoice.customerGSTIN && <p>GSTIN: {invoice.customerGSTIN}</p>}
                {invoice.customerPAN && <p>PAN Number: {invoice.customerPAN}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center w-16">S.NO</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-left">SERVICES</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center w-24">HSN/SAC</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center w-16">QTY</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-right w-24">RATE</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-right w-28">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">{index + 1}</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm">{item.name}</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                        {item.hsnSac || "SAC300"}
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">{item.quantity}</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-right">
                        {formatCurrency(item.rate).replace("₹", "")}
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-right">
                        {formatCurrency(item.lineTotal).replace("₹", "")}
                      </td>
                    </tr>
                  ))}

                  {/* Subtotal Row */}
                  <tr>
                    <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      Subtotal
                    </td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                  </tr>

                  {/* GST Rows */}
                  {invoice.gstBreakdown.isInterState ? (
                    <tr>
                      <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        IGST @ 18%
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                          CGST @ 9%
                        </td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                          SGST @ 9%
                        </td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Total Row */}
                  <tr className="bg-gray-100">
                    <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      TOTAL
                    </td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      ₹{formatCurrency(invoice.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Summary Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center">HSN/SAC</th>
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center">Taxable Value</th>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center" colSpan={2}>
                          IGST
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center" colSpan={2}>
                          CGST
                        </th>
                        <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center" colSpan={2}>
                          SGST
                        </th>
                      </>
                    )}
                    <th className="border border-gray-800 py-2 px-3 text-sm font-bold text-center">Total Tax</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 py-1 px-3 text-xs"></th>
                    <th className="border border-gray-800 py-1 px-3 text-xs"></th>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Rate</th>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Rate</th>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Amount</th>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Rate</th>
                        <th className="border border-gray-800 py-1 px-3 text-xs">Amount</th>
                      </>
                    )}
                    <th className="border border-gray-800 py-1 px-3 text-xs"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                      {invoice.items[0]?.hsnSac || "SAC300"}
                    </td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">18%</td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                          {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">9%</td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">9%</td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                      {formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">Total</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                      {formatCurrency(invoice.subtotal).replace("₹", "")}
                    </td>
                    {invoice.gstBreakdown.isInterState ? (
                      <>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                          {formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                          {formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                        <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                          {formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                      {formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="mb-6">
              <div className="border border-gray-800 p-3">
                <p className="text-sm font-bold mb-1">Total Amount (in words)</p>
                <p className="text-sm italic">{convertToWords(invoice.total)}</p>
              </div>
            </div>

            {/* Footer Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-gray-800 p-3">
                <p className="text-sm font-bold mb-2">Bank Details</p>
                <div className="text-xs space-y-1">
                  <p>Name: {user?.bankName || "Bank Name"}</p>
                  <p>IFSC: {user?.ifscCode || "IFSC Code"}</p>
                  <p>A/c No: {user?.accountNumber || "Account Number"}</p>
                </div>
              </div>

              <div className="border border-gray-800 p-3">
                <p className="text-sm font-bold mb-2">Terms and Conditions</p>
                <div className="text-xs space-y-1">
                  <p>1. All disputes are subject to {user?.state || "jurisdiction"} jurisdiction only</p>
                  <p>2. TDS Deduction will lie under Section 194C</p>
                  <p>3. Payment to Contractor (1% or 2%)</p>
                </div>
              </div>

              <div className="border border-gray-800 p-3 text-center">
                {/* Digital Signature with Enhanced Error Handling */}
                {isValidSignature(user?.signature) && !signatureError ? (
                  <div className="mb-2">
                    <img
                      src={user?.signature || "/placeholder.svg"}
                      alt="Digital Signature"
                      className="max-h-12 max-w-full object-contain mx-auto mb-1"
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
                  <div className="h-12 mb-2 flex items-center justify-center">
                    {user?.signature && signatureError ? (
                      <span className="text-xs text-red-500 italic">Signature Error</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        {user?.signature ? "Loading Signature..." : "Digital Signature"}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm font-bold">Authorised Signatory For</p>
                <p className="text-sm font-bold">{user?.fullName || "Your Business"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicePreview
