"use client"

import type React from "react"
import { useRef, useState, useMemo } from "react"
import { X, Download, BookOpen, Calendar } from "lucide-react"
import type { Invoice, User } from "../../types"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface CustomerLedgerProps {
  customerName: string
  invoices: Invoice[]
  user: User | null
  onClose: () => void
}

interface LedgerRow {
  date: Date | null
  prefix: string // "To" | "By"
  particulars: string
  vchType: string
  vchNo: string | number
  debit: number | null
  credit: number | null
  isOpening?: boolean
  isClosing?: boolean
  isSubtotal?: boolean
  isGrandTotal?: boolean
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  })
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CustomerLedger: React.FC<CustomerLedgerProps> = ({ customerName, invoices, user, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  // Default date range: earliest invoice → today
  const earliest = useMemo(() => {
    if (!invoices.length) return new Date()
    return invoices.reduce((min, inv) => (inv.date < min ? inv.date : min), invoices[0].date)
  }, [invoices])

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(earliest)
    d.setDate(1) // start of that month
    return d.toISOString().split("T")[0]
  })
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split("T")[0])

  const filteredInvoices = useMemo(() => {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    to.setHours(23, 59, 59, 999)
    return invoices
      .filter((inv) => {
        const d = new Date(inv.date)
        return d >= from && d <= to
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [invoices, fromDate, toDate])

  // Build ledger rows
  const { rows, totalDebit, totalCredit, closingBalance } = useMemo(() => {
    const rows: LedgerRow[] = []

    // Opening balance = 0 (no prior balance recorded in EzBill, start fresh)
    const openingBalance = 0

    let totalDebit = openingBalance
    let totalCredit = 0

    // Opening Balance row
    rows.push({
      date: new Date(fromDate),
      prefix: "To",
      particulars: "Opening Balance",
      vchType: "",
      vchNo: "",
      debit: openingBalance,
      credit: null,
      isOpening: true,
    })

    // One debit row per invoice + one credit row if paid
    filteredInvoices.forEach((inv) => {
      const vchNo = inv.invoiceNumber.includes("-") ? inv.invoiceNumber.split("-")[1] : inv.invoiceNumber
      rows.push({
        date: new Date(inv.date),
        prefix: "To",
        particulars: "Sales",
        vchType: "Sales",
        vchNo,
        debit: inv.total,
        credit: null,
      })
      totalDebit += inv.total

      if (inv.status === "paid") {
        rows.push({
          date: new Date(inv.date),
          prefix: "By",
          particulars: "Cash",
          vchType: "Receipt",
          vchNo,
          debit: null,
          credit: inv.total,
        })
        totalCredit += inv.total
      }
    })

    const closingBalance = totalDebit - totalCredit

    return { rows, totalDebit, totalCredit, closingBalance }
  }, [filteredInvoices, fromDate])

  const fromDateObj = new Date(fromDate)
  const toDateObj = new Date(toDate)
  const dateRangeLabel = `${formatDateShort(fromDateObj)} to ${formatDateShort(toDateObj)}`

  const handleDownloadPDF = async () => {
    if (!printRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${customerName}_Ledger_${fromDate}_to_${toDate}.pdf`)
    } catch (err) {
      console.error("PDF generation failed:", err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4 px-2">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Ledger</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filteredInvoices.length} invoice(s) in range</span>
        </div>

        {/* Printable Ledger */}
        <div className="p-4 md:p-6 overflow-x-auto">
          <div
            ref={printRef}
            className="bg-white text-black font-sans min-w-[600px]"
            style={{ padding: "24px 32px", fontFamily: "Arial, sans-serif" }}
          >
            {/* Ledger Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              {user?.businessLogo && (
                <div style={{ width: "80px", height: "80px", flexShrink: 0, border: "1px solid #eee", padding: "4px" }}>
                  <img src={user.businessLogo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "20px", color: "#000", marginBottom: "4px", textTransform: "uppercase" }}>
                  {user?.fullName || "Your Business"}
                </div>
                <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.4", maxWidth: "500px" }}>
                  {user?.address && <div>{user.address}</div>}
                  {user?.state && <div>State: {user.state}</div>}
                  {user?.gstNumber && <div>GSTIN: {user.gstNumber}</div>}
                  {user?.panNumber && <div>PAN: {user.panNumber}</div>}
                  {user?.phoneNumber && <div>Mobile: {user.phoneNumber}</div>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px", color: "#666" }}>{user?.invoicePrefix || "UHP"}</div>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "10px" }}>Ledger Account</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{dateRangeLabel}</div>
              </div>
            </div>

            {/* Ledger Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                marginTop: "8px",
              }}
            >
              <thead>
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "right", fontSize: "10px", paddingBottom: "2px", color: "#555" }}
                  >
                    Page 1
                  </td>
                </tr>
                <tr style={{ borderTop: "1.5px solid #000", borderBottom: "1px solid #000" }}>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold", width: "80px" }}>Date</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Particulars</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold", width: "80px" }}>
                    Vch Type
                  </th>
                  <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: "bold", width: "60px" }}>
                    Vch No.
                  </th>
                  <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", width: "90px" }}>Debit</th>
                  <th style={{ textAlign: "right", padding: "4px 6px", fontWeight: "bold", width: "90px" }}>
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "3px 6px", verticalAlign: "top" }}>
                      {row.date ? formatDateShort(row.date) : ""}
                    </td>
                    <td style={{ padding: "3px 6px", verticalAlign: "top" }}>
                      <span style={{ marginRight: "4px" }}>{row.prefix}</span>
                      <strong>{row.particulars}</strong>
                    </td>
                    <td style={{ padding: "3px 6px", verticalAlign: "top" }}>
                      <strong>{row.vchType}</strong>
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "center", verticalAlign: "top" }}>{row.vchNo}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right", verticalAlign: "top" }}>
                      {row.debit !== null ? formatAmount(row.debit) : ""}
                    </td>
                    <td style={{ padding: "3px 6px", textAlign: "right", verticalAlign: "top" }}>
                      {row.credit !== null ? formatAmount(row.credit) : ""}
                    </td>
                  </tr>
                ))}

                {/* Subtotals row */}
                <tr style={{ borderTop: "1px solid #999" }}>
                  <td colSpan={4} style={{ padding: "4px 6px" }} />
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "normal" }}>
                    {formatAmount(totalDebit)}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "normal" }}>
                    {formatAmount(totalCredit)}
                  </td>
                </tr>

                {/* Closing Balance row */}
                <tr>
                  <td style={{ padding: "3px 6px" }} />
                  <td style={{ padding: "3px 6px" }}>
                    <span style={{ marginRight: "4px" }}>By</span>
                    <strong>Closing Balance</strong>
                  </td>
                  <td colSpan={2} style={{ padding: "3px 6px" }} />
                  <td style={{ padding: "3px 6px", textAlign: "right" }} />
                  <td style={{ padding: "3px 6px", textAlign: "right" }}>{formatAmount(closingBalance)}</td>
                </tr>

                {/* Grand Total row */}
                <tr style={{ borderTop: "1.5px solid #000", borderBottom: "2px solid #000" }}>
                  <td colSpan={4} style={{ padding: "4px 6px", fontWeight: "bold" }} />
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold" }}>
                    {formatAmount(totalDebit)}
                  </td>
                  <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: "bold" }}>
                    {formatAmount(totalDebit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerLedger
