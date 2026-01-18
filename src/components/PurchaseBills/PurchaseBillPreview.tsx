"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { PurchaseBill } from "../../types"
import { useAuth } from "../../context/AuthContext"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { convertElementToPDF } from "../../utils/html-to-pdf"
import { X, Download, Printer } from "lucide-react"
import Button from "../UI/Button"
import { useToast } from "../../hooks/useToast"

interface PurchaseBillPreviewProps {
  bill: PurchaseBill
  onClose: () => void
  autoDownload?: boolean
}

const PurchaseBillPreview: React.FC<PurchaseBillPreviewProps> = ({ bill, onClose, autoDownload = false }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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
    toast.info("Generating PDF", "Creating bill PDF from preview...")

    try {
      const filename = `bill-${bill.billNumber}.pdf`
      const result = await convertElementToPDF(`bill-preview-${bill.id}`, filename)

      if (result.success) {
        toast.success("PDF Downloaded", "The bill has been downloaded successfully!")
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
    toast.info("Printing Bill", "Opening print dialog...")
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
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-1 md:p-4 z-50 ${autoDownload ? "pointer-events-none" : ""}`}
    >
      <div
        className={`bg-white rounded-lg md:rounded-xl shadow-2xl w-full max-w-6xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto ${autoDownload ? "opacity-0" : ""}`}
      >
        {/* Header Actions - Only show if not auto-downloading */}
        {!autoDownload && (
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 md:p-4 border-b border-gray-200 bg-gray-50 gap-2">
            <h2 className="text-base md:text-xl font-semibold text-gray-800">Purchase Bill Preview</h2>
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

        {/* Bill Content */}
        <div
          className="p-1 md:p-6 bg-white text-gray-900 text-[8px] md:text-sm leading-[9px] md:leading-normal font-medium"
          id={`bill-preview-${bill.id}`}
        >
          {/* Main Border */}
          <div className="border border-gray-600 md:border-gray-800 p-1 md:p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-1 md:mb-4 pb-1 md:pb-2 border-b border-gray-600 md:border-gray-800">
              <h1 className="text-[12px] md:text-2xl font-bold text-gray-900">PURCHASE BILL</h1>
              <div className="border border-gray-600 md:border-gray-800 px-1 md:px-3 py-0.5 md:py-1">
                <p className="text-[6px] md:text-sm font-bold whitespace-nowrap text-gray-900">
                  ORIGINAL FOR RECIPIENT
                </p>
              </div>
            </div>

            {/* Vendor (Sender) Details and Bill Info */}
            <div className="flex justify-between mb-1 md:mb-4 pb-1 md:pb-3 border-b border-gray-600 md:border-gray-800 gap-1 md:gap-3">
              <div className="flex gap-1 md:gap-3 flex-1">
                {/* Vendor Details */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[9px] md:text-base font-bold mb-0.5 md:mb-1 text-gray-900">
                    {bill.vendorName}
                  </h2>
                  <div className="text-[7px] md:text-sm space-y-0 md:space-y-0.5 leading-[8px] md:leading-normal text-gray-800">
                    <p className="break-words">{bill.vendorAddress}</p>
                    <p>State: {bill.vendorState}</p>
                    {bill.vendorGSTIN && <p>GSTIN: {bill.vendorGSTIN}</p>}
                    {bill.vendorPAN && <p>PAN: {bill.vendorPAN}</p>}
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="text-right text-[7px] md:text-sm flex-shrink-0 text-gray-800">
                <div className="mb-1 md:mb-2">
                  <p className="font-bold text-gray-900">Bill No.</p>
                  <p className="break-all">{bill.billNumber}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Bill Date</p>
                  <p>{formatDate(bill.date)}</p>
                </div>
              </div>
            </div>

            {/* BILL TO (User) Section */}
            <div className="mb-1 md:mb-4">
              <h3 className="text-[8px] md:text-sm font-bold mb-0.5 md:mb-1 text-gray-900">BILL TO</h3>
              <div className="text-[7px] md:text-sm leading-[8px] md:leading-normal text-gray-800">
                <h4 className="text-[9px] md:text-base font-bold mb-0.5 md:mb-1 break-words text-gray-900">
                  {user?.fullName || "My Business"}
                </h4>
                <p className="break-words">Address: {user?.address}</p>
                <p>State: {user?.state}</p>
                {user?.gstNumber && <p className="break-all">GSTIN: {user.gstNumber}</p>}
                {user?.panNumber && <p>PAN: {user.panNumber}</p>}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-1 md:mb-4">
              <table className="w-full border-collapse text-[6px] md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-center w-[8%] md:w-auto text-gray-900">
                      S.NO
                    </th>
                    <th className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 font-bold text-left w-[35%] md:w-auto text-gray-900">
                      ITEMS
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
                  {bill.items.map((item, index) => (
                    <tr key={item.id} className="bg-white">
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-900">
                        {index + 1}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 break-words text-gray-800 leading-[7px] md:leading-normal">
                        {item.name}
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                        {item.hsnSac || "-"}
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
                      {formatCurrency(bill.subtotal).replace("₹", "")}
                    </td>
                  </tr>

                  {/* GST Rows */}
                  {bill.gstBreakdown.isInterState ? (
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900"
                      >
                        IGST @ 18%
                      </td>
                      <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-right font-bold text-gray-900">
                        {formatCurrency(bill.gstBreakdown.igst).replace("₹", "")}
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
                          {formatCurrency(bill.gstBreakdown.cgst).replace("₹", "")}
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
                          {formatCurrency(bill.gstBreakdown.sgst).replace("₹", "")}
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
                      ₹{formatCurrency(bill.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tax Summary Table */}
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
                    {bill.gstBreakdown.isInterState ? (
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
                      {bill.items[0]?.hsnSac || "-"}
                    </td>
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                      {formatCurrency(bill.subtotal).replace("₹", "")}
                    </td>
                    {bill.gstBreakdown.isInterState ? (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          18%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(bill.gstBreakdown.igst).replace("₹", "")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(bill.gstBreakdown.cgst).replace("₹", "")}
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          9%
                        </td>
                        <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-800">
                          {formatCurrency(bill.gstBreakdown.sgst).replace("₹", "")}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-400 md:border-gray-800 py-1 md:py-2 px-0.5 md:px-2 text-center text-gray-900 font-semibold">
                      {formatCurrency(bill.gstBreakdown.total).replace("₹", "")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="mb-1 md:mb-4">
              <div className="border border-gray-400 md:border-gray-800 p-1 md:p-3 bg-gray-50">
                <p className="text-[7px] md:text-sm font-bold mb-0.5 md:mb-1 text-gray-900">Total Amount (in words)</p>
                <p className="text-[6px] md:text-sm italic break-words leading-[7px] md:leading-normal text-gray-800">
                  {convertToWords(bill.total)}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseBillPreview
