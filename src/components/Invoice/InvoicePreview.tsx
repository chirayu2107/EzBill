"use client"

import type React from "react"
import { useState } from "react"
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
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    toast.info("Generating PDF", "Please wait while we create your invoice PDF...")

    try {
      const result = await convertElementToPDF(`invoice-preview-${invoice.id}`, `invoice-${invoice.invoiceNumber}.pdf`)

      if (result.success) {
        toast.success("PDF Downloaded", "Your invoice has been downloaded successfully!")
      } else {
        toast.error("PDF Generation Failed", result.error || "Failed to generate PDF")
      }
    } catch (error: any) {
      toast.error("PDF Generation Failed", error.message || "An unexpected error occurred")
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Invoice Preview</h2>
          <div className="flex items-center gap-3">
            <Button onClick={handleDownloadPDF} icon={Download} variant="primary" size="sm" disabled={isGeneratingPDF}>
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
            <Button onClick={handlePrint} icon={Printer} variant="secondary" size="sm">
              Print
            </Button>
            <Button onClick={onClose} icon={X} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 bg-white text-gray-800" id={`invoice-preview-${invoice.id}`}>
          {/* Header */}
          <div className="border-2 border-gray-800 p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{user?.fullName || "Your Business"}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{user?.address}</p>
                  <p>State: {user?.state}</p>
                  {user?.gstNumber && <p>GSTIN: {user.gstNumber}</p>}
                  <p>PAN Number: {user?.panNumber}</p>
                  <p>Mobile: {user?.phoneNumber}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="border border-gray-800 px-4 py-2 mb-2">
                  <p className="text-sm font-bold">ORIGINAL FOR RECIPIENT</p>
                </div>
                <div className="text-sm">
                  <p>
                    <strong>Invoice No.</strong>
                  </p>
                  <p>{invoice.invoiceNumber}</p>
                  <p>
                    <strong>Invoice Date</strong>
                  </p>
                  <p>{formatDate(invoice.date)}</p>
                </div>
              </div>
            </div>

            {/* TAX INVOICE Title - moved inside the header box */}
            <div className="text-center border-t border-gray-800 pt-3">
              <h2 className="text-2xl font-bold text-gray-800">TAX INVOICE</h2>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">BILL TO</h3>
            <div className="text-sm">
              <p className="font-bold text-lg">{invoice.customerName}</p>
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
                  <th className="border border-gray-800 text-left py-2 px-3 text-sm font-bold">S.NO</th>
                  <th className="border border-gray-800 text-left py-2 px-3 text-sm font-bold">SERVICES</th>
                  <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold">HSN/SAC</th>
                  <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold">QTY</th>
                  <th className="border border-gray-800 text-right py-2 px-3 text-sm font-bold">RATE</th>
                  <th className="border border-gray-800 text-right py-2 px-3 text-sm font-bold">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-800 py-2 px-3 text-sm">{index + 1}</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm">{item.name}</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center">{item.hsnSac}</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-center">{item.quantity}</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-right">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                    Subtotal
                  </td>
                  <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                </tr>
                {invoice.gstBreakdown.isInterState ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      IGST @ 18%
                    </td>
                    <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                      {formatCurrency(invoice.gstBreakdown.igst)}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        CGST @ 9%
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        {formatCurrency(invoice.gstBreakdown.cgst)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        SGST @ 9%
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                        {formatCurrency(invoice.gstBreakdown.sgst)}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-gray-100">
                  <td colSpan={5} className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                    TOTAL
                  </td>
                  <td className="border border-gray-800 py-2 px-3 text-sm text-right font-bold">
                    {formatCurrency(invoice.total)}
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
                  <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold">HSN/SAC</th>
                  <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold">Taxable Value</th>
                  {invoice.gstBreakdown.isInterState ? (
                    <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold" colSpan={2}>
                      IGST
                    </th>
                  ) : (
                    <>
                      <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold" colSpan={2}>
                        CGST
                      </th>
                      <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold" colSpan={2}>
                        SGST
                      </th>
                    </>
                  )}
                  <th className="border border-gray-800 text-center py-2 px-3 text-sm font-bold">Total Tax</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 text-center py-1 px-3 text-xs"></th>
                  <th className="border border-gray-800 text-center py-1 px-3 text-xs"></th>
                  {invoice.gstBreakdown.isInterState ? (
                    <>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Rate</th>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Amount</th>
                    </>
                  ) : (
                    <>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Rate</th>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Amount</th>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Rate</th>
                      <th className="border border-gray-800 text-center py-1 px-3 text-xs">Amount</th>
                    </>
                  )}
                  <th className="border border-gray-800 text-center py-1 px-3 text-xs"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                    {invoice.items[0]?.hsnSac || "SAC300"}
                  </td>
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                  {invoice.gstBreakdown.isInterState ? (
                    <>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">18%</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                        {formatCurrency(invoice.gstBreakdown.igst)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">9%</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                        {formatCurrency(invoice.gstBreakdown.cgst)}
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">9%</td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                        {formatCurrency(invoice.gstBreakdown.sgst)}
                      </td>
                    </>
                  )}
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center">
                    {formatCurrency(invoice.gstBreakdown.total)}
                  </td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">Total</td>
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                    {formatCurrency(invoice.subtotal)}
                  </td>
                  {invoice.gstBreakdown.isInterState ? (
                    <>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                        {formatCurrency(invoice.gstBreakdown.igst)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                        {formatCurrency(invoice.gstBreakdown.cgst)}
                      </td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold"></td>
                      <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                        {formatCurrency(invoice.gstBreakdown.sgst)}
                      </td>
                    </>
                  )}
                  <td className="border border-gray-800 py-2 px-3 text-sm text-center font-bold">
                    {formatCurrency(invoice.gstBreakdown.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="mb-6">
            <div className="border border-gray-800 p-3">
              <p className="text-sm">
                <strong>Total Amount (in words)</strong>
              </p>
              <p className="text-sm italic">{convertToWords(invoice.total)}</p>
            </div>
          </div>

          {/* Footer Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-800 p-3">
              <p className="text-sm font-bold mb-2">Bank Details</p>
              <div className="text-xs space-y-1">
                <p>Name: {user?.bankName}</p>
                <p>IFSC: {user?.ifscCode}</p>
                <p>A/c No: {user?.accountNumber}</p>
              </div>
            </div>

            <div className="border border-gray-800 p-3">
              <p className="text-sm font-bold mb-2">Terms and Conditions</p>
              <div className="text-xs space-y-1">
                <p>1. All disputes are subject to {user?.state} jurisdiction only</p>
                <p>2. TDS Deduction will lie under Section 194C</p>
                <p>3. Payment to Contractor (1% or 2%)</p>
              </div>
            </div>

            <div className="border border-gray-800 p-3 text-center">
              <div className="h-16 mb-2"></div>
              <p className="text-sm font-bold">Authorised Signatory For</p>
              <p className="text-sm font-bold">{user?.fullName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoicePreview
