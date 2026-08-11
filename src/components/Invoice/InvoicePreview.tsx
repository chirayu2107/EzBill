"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import type { Invoice } from "../../types"
import { useAuth } from "../../context/AuthContext"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { calculateGlassInvoiceTotals, formatGlassSizeInches, calculateMMtoSqms } from "../../utils/glassCalculations"
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

  // ── Mobile scaling logic ──
  const INVOICE_WIDTH = 680
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(undefined)

  const updateScale = useCallback(() => {
    if (!wrapperRef.current || !contentRef.current) return
    const containerWidth = wrapperRef.current.offsetWidth
    if (containerWidth < INVOICE_WIDTH) {
      const s = containerWidth / INVOICE_WIDTH
      setScale(s)
      setWrapperHeight(contentRef.current.scrollHeight * s)
    } else {
      setScale(1)
      setWrapperHeight(undefined)
    }
  }, [])

  useEffect(() => {
    updateScale()
    window.addEventListener("resize", updateScale)
    // Also update after a short delay to catch render completion
    const timer = setTimeout(updateScale, 100)
    return () => {
      window.removeEventListener("resize", updateScale)
      clearTimeout(timer)
    }
  }, [updateScale])

  // Delay backdrop-close so the tap that opened the modal doesn't instantly close it
  const [backdropReady, setBackdropReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setBackdropReady(true), 300)
    return () => clearTimeout(t)
  }, [])

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

    return isValidBase64
  }

  // Shared cell style helpers
  const thStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: "1px solid #374151",
    padding: "8px 10px",
    fontWeight: 700,
    fontSize: "13px",
    color: "#111827",
    backgroundColor: "#f3f4f6",
    ...extra,
  })

  const tdStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    border: "1px solid #374151",
    padding: "7px 10px",
    fontSize: "13px",
    color: "#1f2937",
    backgroundColor: "#ffffff",
    ...extra,
  })

  const tdAltStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    ...tdStyle(extra),
    backgroundColor: "#f9fafb",
  })

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto z-50 ${autoDownload ? "pointer-events-none" : ""}`}
      onClick={!autoDownload && backdropReady ? onClose : undefined}
    >
      <div 
        className={`w-full max-w-4xl bg-white dark:bg-[#1a1a1d] rounded-xl shadow-2xl overflow-hidden border border-gray-200/80 dark:border-white/[0.06] transition-colors ${autoDownload ? "opacity-0" : ""}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top action bar (no-print) ── */}
        {!autoDownload && (
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-4 py-3 bg-gray-50 dark:bg-[#141416] border-b border-gray-200 dark:border-white/[0.06] transition-colors">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Invoice Preview</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={handleDownloadPDF} icon={Download} variant="primary" size="sm" disabled={isGeneratingPDF} className={`flex-1 sm:flex-none ${isGeneratingPDF ? "opacity-75" : ""}`}>
                {isGeneratingPDF ? "Generating..." : "Download"}
              </Button>
              <Button onClick={handlePrint} icon={Printer} variant="secondary" size="sm" className="flex-1 sm:flex-none">Print</Button>
              <Button onClick={onClose} icon={X} variant="secondary" size="sm" className="flex-1 sm:flex-none">Close</Button>
            </div>
          </div>
        )}

        {/* ── Invoice Paper Scroll Container ── */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-50/50 dark:bg-[#121214]">
          <div ref={wrapperRef} style={{ width: "100%", overflow: scale < 1 ? "hidden" : undefined, height: wrapperHeight }}>
            <div
              ref={contentRef}
              className="invoice-print-content"
              id={`invoice-preview-${invoice.id}`}
              style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "14px", lineHeight: "1.5", color: "#111827", backgroundColor: "#fff", ...(scale < 1 ? { width: "680px", maxWidth: "none", transformOrigin: "top left", transform: `scale(${scale})` } : {}) }}
            >
              <div style={{ padding: "28px 32px" }}>
            <div style={{ border: "1px solid #1f2937", padding: "16px" }}>

              {/* Header: TAX INVOICE + ORIGINAL FOR RECIPIENT */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #1f2937" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#111827" }}>TAX INVOICE</h1>
                <div style={{ border: "1px solid #1f2937", padding: "4px 10px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", color: "#111827" }}>ORIGINAL FOR RECIPIENT</p>
                </div>
              </div>

              {/* Business info row */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid #1f2937", gap: "12px" }}>
                <div style={{ display: "flex", gap: "12px", flex: 1 }}>
                  {/* Logo / initials */}
                  <div style={{ width: 48, height: 48, minWidth: 48, border: "1px solid #374151", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", overflow: "hidden", flexShrink: 0 }}>
                    {user?.businessLogo ? (
                      <img src={user.businessLogo} alt="Logo" className="invoice-logo-img" style={{ width: 48, height: 48, objectFit: "cover", display: "block" }} />
                    ) : (
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{getInitials(user?.fullName || "B")}</span>
                    )}
                  </div>
                  {/* Business details */}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "3px", color: "#111827" }}>{user?.fullName || "Your Business"}</p>
                    <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
                      {user?.address && <p style={{ margin: 0 }}>{user.address}</p>}
                      {user?.state && <p style={{ margin: 0 }}>State: {user.state}</p>}
                      {user?.gstNumber && <p style={{ margin: 0 }}>GSTIN: {user.gstNumber}</p>}
                      {user?.panNumber && <p style={{ margin: 0 }}>PAN: {user.panNumber}</p>}
                      {user?.phoneNumber && <p style={{ margin: 0 }}>Mobile: {user.phoneNumber}</p>}
                    </div>
                  </div>
                </div>
                {/* Invoice details */}
                <div style={{ textAlign: "right", fontSize: "13px", color: "#374151", flexShrink: 0 }}>
                  <div style={{ marginBottom: "8px" }}>
                    <p style={{ fontWeight: 700, margin: 0, color: "#111827" }}>Invoice No.</p>
                    <p style={{ margin: 0 }}>{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, color: "#111827" }}>Invoice Date</p>
                    <p style={{ margin: 0 }}>{formatDate(invoice.date)}</p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", marginBottom: "4px", letterSpacing: "0.05em" }}>BILL TO</p>
                <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", color: "#111827" }}>{invoice.customerName}</p>
                <div style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6" }}>
                  {invoice.customerAddress && <p style={{ margin: 0 }}>Address: {invoice.customerAddress}</p>}
                  {invoice.customerState && <p style={{ margin: 0 }}>State: {invoice.customerState}</p>}
                  {invoice.customerGSTIN && <p style={{ margin: 0 }}>GSTIN: {invoice.customerGSTIN}</p>}
                  {invoice.customerPAN && <p style={{ margin: 0 }}>PAN: {invoice.customerPAN}</p>}
                </div>
              </div>

              {/* Items Table Section */}
              {invoice.invoiceType === "glass" && invoice.glassData ? (() => {
                const glassTotals = calculateGlassInvoiceTotals(invoice.glassData)
                let itemCounter = 1
                const bdr = "1px solid #000"
                const bdrDash = "1px dashed #999"
                const mono = "'Courier New', Courier, monospace"
                const gstRate = invoice.gst && invoice.subtotal ? Math.round((invoice.gst / (invoice.subtotal - (invoice.discountAmount || 0))) * 100) || 18 : 18
                const halfGst = gstRate / 2

                return (
                  <div style={{ marginBottom: "16px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "Arial, sans-serif", tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "3%" }} />   {/* Sr */}
                        <col style={{ width: "3%" }} />   {/* ItNo */}
                        <col style={{ width: "13%" }} />  {/* SIZE (actual) */}
                        <col style={{ width: "4%" }} />   {/* PCS */}
                        <col style={{ width: "8%" }} />   {/* SQMS (actual) */}
                        <col style={{ width: "13%" }} />  {/* SIZE (charged) */}
                        <col style={{ width: "8%" }} />   {/* SQMS (charged) */}
                        <col style={{ width: "7%" }} />   {/* RATE/SQMS */}
                        <col style={{ width: "10%" }} />  {/* GLASS AMOUNT */}
                        <col style={{ width: "5%" }} />   {/* GRINDING RATE */}
                        <col style={{ width: "7%" }} />   {/* GRINDING AMOUNT */}
                        <col style={{ width: "7%" }} />   {/* OTHER CHARGES */}
                        <col style={{ width: "12%" }} />  {/* TOTAL AMOUNT */}
                      </colgroup>
                      <thead>
                        <tr style={{ borderTop: bdr, borderBottom: bdr }}>
                          <th colSpan={5} style={{ borderRight: bdr, padding: "5px 4px", fontWeight: 700, textAlign: "center", fontSize: "10px" }}>&lt; --- PARTICULARS OF GLASS  -- &gt;</th>
                          <th colSpan={2} style={{ borderRight: bdr, padding: "5px 4px", fontWeight: 700, textAlign: "center", fontSize: "10px" }}>&lt; -- CHARGED -- &gt;</th>
                          <th rowSpan={2} style={{ borderRight: bdr, padding: "5px 2px", fontWeight: 700, textAlign: "center", fontSize: "10px", verticalAlign: "middle" }}>RATE/<br />SQMS</th>
                          <th rowSpan={2} style={{ borderRight: bdr, padding: "5px 2px", fontWeight: 700, textAlign: "center", fontSize: "10px", verticalAlign: "middle" }}>GLASS<br />AMOUNT</th>
                          <th colSpan={2} style={{ borderRight: bdr, padding: "5px 4px", fontWeight: 700, textAlign: "center", fontSize: "10px" }}>&lt; GRINDING &gt;</th>
                          <th rowSpan={2} style={{ borderRight: bdr, padding: "5px 2px", fontWeight: 700, textAlign: "center", fontSize: "10px", verticalAlign: "middle" }}>OTHER<br />CHARGES</th>
                          <th rowSpan={2} style={{ padding: "5px 2px", fontWeight: 700, textAlign: "center", fontSize: "10px", verticalAlign: "middle" }}>TOTAL<br />AMOUNT</th>
                        </tr>
                        <tr style={{ borderBottom: bdr }}>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>Sr</th>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>ItNo</th>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>SIZE</th>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>PCS</th>
                          <th style={{ borderRight: bdr, padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>SQMS</th>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>SIZE</th>
                          <th style={{ borderRight: bdr, padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>SQMS</th>
                          <th style={{ padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>RATE</th>
                          <th style={{ borderRight: bdr, padding: "3px 2px", fontWeight: 700, textAlign: "center", fontSize: "9px" }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.glassData.groups.map((group) => {
                          const groupTotal = glassTotals.groupTotals.find(gt => gt.groupId === group.id)
                          return (
                            <React.Fragment key={group.id}>
                              {/* Group Header */}
                              <tr>
                                <td colSpan={13} style={{ padding: "6px 2px 3px", fontWeight: 800, fontSize: "11.5px", textTransform: "uppercase", borderBottom: bdrDash }}>
                                  {group.specification}
                                </td>
                              </tr>

                              {/* Items */}
                              {group.items.map((item) => {
                                const sr = itemCounter++
                                const actualSqms = item.actualSqms || calculateMMtoSqms(item.actualWidth, item.actualHeight, item.pcs)
                                const chargedSqms = item.chargedSqms || calculateMMtoSqms(item.chargedWidth, item.chargedHeight, item.pcs)
                                const glassAmt = item.glassAmount || Number((chargedSqms * item.ratePerSqm).toFixed(2))
                                const totalAmt = item.lineTotal || glassAmt
                                const inchStr = item.actualInches || formatGlassSizeInches(item.actualWidth, item.actualHeight)

                                return (
                                  <React.Fragment key={item.id}>
                                    {/* Main data row */}
                                    <tr>
                                      <td style={{ padding: "3px 2px", textAlign: "center", verticalAlign: "top" }}>{sr}</td>
                                      <td style={{ padding: "3px 2px", textAlign: "center", verticalAlign: "top" }}>{sr}</td>
                                      <td style={{ padding: "3px 2px", verticalAlign: "top", fontFamily: mono, whiteSpace: "nowrap" }}>{item.actualWidth} &nbsp;X&nbsp; {item.actualHeight}</td>
                                      <td style={{ padding: "3px 2px", textAlign: "center", verticalAlign: "top" }}>{item.pcs}</td>
                                      <td style={{ padding: "3px 4px", textAlign: "right", verticalAlign: "top", fontFamily: mono, borderRight: bdrDash }}>{actualSqms.toFixed(4)}</td>
                                      <td style={{ padding: "3px 2px", verticalAlign: "top", fontFamily: mono, whiteSpace: "nowrap" }}>{item.chargedWidth || item.actualWidth} &nbsp;X&nbsp; {item.chargedHeight || item.actualHeight}</td>
                                      <td style={{ padding: "3px 4px", textAlign: "right", verticalAlign: "top", fontFamily: mono, borderRight: bdrDash }}>{chargedSqms.toFixed(4)}</td>
                                      <td style={{ padding: "3px 4px", textAlign: "right", verticalAlign: "top", fontFamily: mono }}>{item.ratePerSqm ? item.ratePerSqm.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}</td>
                                      <td style={{ padding: "3px 6px", textAlign: "right", verticalAlign: "top", fontFamily: mono, borderRight: bdrDash }}>{glassAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                      <td style={{ padding: "3px 2px", verticalAlign: "top" }}></td>
                                      <td style={{ padding: "3px 2px", verticalAlign: "top" }}></td>
                                      <td style={{ padding: "3px 2px", verticalAlign: "top" }}></td>
                                      <td style={{ padding: "3px 6px", textAlign: "right", verticalAlign: "top", fontFamily: mono }}>{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    {/* Second row: inches + notes */}
                                    <tr>
                                      <td></td>
                                      <td></td>
                                      <td style={{ padding: "0 2px 4px", fontSize: "9.5px", color: "#333" }}>{inchStr}</td>
                                      <td></td>
                                      <td style={{ padding: "0 4px 4px", fontSize: "9.5px", color: "#333", borderRight: bdrDash }}>{item.drgHolesNotes || ""}</td>
                                      <td colSpan={2} style={{ padding: "0 2px 4px", fontSize: "9.5px", color: "#333", borderRight: bdrDash }}>{item.chargedRefNotes || "Ref.-"}</td>
                                      <td colSpan={6}></td>
                                    </tr>
                                  </React.Fragment>
                                )
                              })}

                              {/* Sub Total */}
                              <tr style={{ borderTop: bdrDash, borderBottom: bdrDash }}>
                                <td colSpan={2} style={{ padding: "4px 2px", textAlign: "right", fontStyle: "italic", fontWeight: 700 }}>Sub Total</td>
                                <td></td>
                                <td style={{ padding: "4px 2px", textAlign: "center", fontWeight: 700 }}>{groupTotal?.pcs || 0}</td>
                                <td style={{ padding: "4px 4px", textAlign: "right", fontFamily: mono, fontWeight: 700, borderRight: bdrDash }}>{groupTotal?.actualSqms?.toFixed(4) || "0.0000"}</td>
                                <td></td>
                                <td style={{ padding: "4px 4px", textAlign: "right", fontFamily: mono, fontWeight: 700, borderRight: bdrDash }}>{groupTotal?.chargedSqms?.toFixed(4) || "0.0000"}</td>
                                <td></td>
                                <td style={{ padding: "4px 6px", textAlign: "right", fontFamily: mono, fontWeight: 700, borderRight: bdrDash }}>{groupTotal?.glassAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}</td>
                                <td colSpan={3}></td>
                                <td style={{ padding: "4px 6px", textAlign: "right", fontFamily: mono, fontWeight: 700 }}>{groupTotal?.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}</td>
                              </tr>
                            </React.Fragment>
                          )
                        })}

                        {/* GRAND TOTAL */}
                        <tr style={{ borderTop: bdr, borderBottom: bdr }}>
                          <td colSpan={3} style={{ padding: "5px 2px", fontWeight: 900, fontSize: "11.5px" }}>TOTAL</td>
                          <td style={{ padding: "5px 2px", textAlign: "center", fontWeight: 900 }}>{glassTotals.totalPcs}</td>
                          <td style={{ padding: "5px 4px", textAlign: "right", fontFamily: mono, fontWeight: 900, borderRight: bdrDash }}>{glassTotals.totalActualSqms.toFixed(4)}</td>
                          <td></td>
                          <td style={{ padding: "5px 4px", textAlign: "right", fontFamily: mono, fontWeight: 900, borderRight: bdrDash }}>{glassTotals.totalChargedSqms.toFixed(4)}</td>
                          <td></td>
                          <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: mono, fontWeight: 900, borderRight: bdrDash }}>{glassTotals.totalGlassAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td colSpan={3}></td>
                          <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: mono, fontWeight: 900, fontSize: "11.5px" }}>{glassTotals.totalGlassAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bottom charges section - right-aligned like the reference */}
                    <table className="pdf-avoid-break" style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "Arial, sans-serif", marginTop: "12px", borderTop: bdr, pageBreakInside: "avoid", breakInside: "avoid" }}>
                      <tbody>
                        {invoice.glassData.holeChargesCount ? (
                          <tr>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>HOLE CHARGES {invoice.glassData.holeChargesCount} NOS @</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, width: "120px" }}>{glassTotals.holeChargesAmount ? glassTotals.holeChargesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}</td>
                          </tr>
                        ) : null}
                        {invoice.glassData.cutoutChargesCount ? (
                          <tr>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>CUTOUT CHARGES {invoice.glassData.cutoutChargesCount} NOS @</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, width: "120px" }}>{glassTotals.cutoutChargesAmount ? glassTotals.cutoutChargesAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}</td>
                          </tr>
                        ) : null}
                        {glassTotals.adminCharge > 0 ? (
                          <tr>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ADMIN CHARGE</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, width: "120px" }}>{glassTotals.adminCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ) : null}
                        {glassTotals.assuranceChargeAmount > 0 ? (
                          <tr>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ASSURANCE CHARGES ON Rs {Math.round(glassTotals.totalGlassAmount)} @{invoice.glassData.assuranceChargeRate || 1.5} %</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, width: "120px" }}>{glassTotals.assuranceChargeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ) : null}
                        <tr style={{ borderTop: bdrDash }}>
                          <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 900, fontSize: "11.5px" }}>ASSESSABLE VALUE</td>
                          <td style={{ padding: "5px 8px", textAlign: "right", fontFamily: mono, fontWeight: 900, fontSize: "11.5px", width: "120px" }}>{glassTotals.assessableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {invoice.gstBreakdown.isInterState ? (
                          <tr>
                            <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ADD IGST @ {gstRate}.00 % of Rs.{glassTotals.assessableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, fontWeight: 600, width: "120px" }}>{invoice.gstBreakdown.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ADD SGST @ {halfGst}.00 % of Rs.{glassTotals.assessableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, fontWeight: 600, width: "120px" }}>{invoice.gstBreakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 600 }}>ADD CGST @{halfGst}.00 % of Rs.{glassTotals.assessableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: "4px 8px", textAlign: "right", fontFamily: mono, fontWeight: 600, width: "120px" }}>{invoice.gstBreakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </>
                        )}
                        <tr style={{ borderTop: bdr, borderBottom: bdr }}>
                          <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: 900, fontSize: "12.5px" }}>TOTAL AMOUNT DEBITED (IN RUPEES)</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: mono, fontWeight: 900, fontSize: "12.5px", width: "120px" }}>{invoice.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )
              })() : (
                /* Standard Invoice Items Table */
                <>
                  <div style={{ marginBottom: "14px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle({ textAlign: "center", width: "5%" })}>S.NO</th>
                          <th style={thStyle({ textAlign: "left", width: "28%" })}>SERVICES</th>
                          <th style={thStyle({ textAlign: "center", width: "12%" })}>HSN/SAC</th>
                          <th style={thStyle({ textAlign: "center", width: "8%" })}>QTY</th>
                          <th style={thStyle({ textAlign: "center", width: "8%" })}>UNIT</th>
                          <th style={thStyle({ textAlign: "right", width: "12%" })}>RATE</th>
                          <th style={thStyle({ textAlign: "right", width: "10%" })}>DISC</th>
                          <th style={thStyle({ textAlign: "right", width: "17%" })}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.map((item, index) => (
                          <tr key={item.id}>
                            <td style={tdStyle({ textAlign: "center" })}>{index + 1}</td>
                            <td style={tdStyle()}>{item.name}</td>
                            <td style={tdStyle({ textAlign: "center" })}>{item.hsnSac || "–"}</td>
                            <td style={tdStyle({ textAlign: "center" })}>{item.quantity}</td>
                            <td style={tdStyle({ textAlign: "center" })}>{item.unit || "pcs"}</td>
                            <td style={tdStyle({ textAlign: "right" })}>{formatCurrency(item.rate).replace("₹", "")}</td>
                            <td style={tdStyle({ textAlign: "right" })}>{item.discount ? `${item.discount}%` : "–"}</td>
                            <td style={tdStyle({ textAlign: "right", fontWeight: 600 })}>{formatCurrency(item.lineTotal).replace("₹", "")}</td>
                          </tr>
                        ))}

                        {/* Subtotal */}
                        <tr>
                          <td colSpan={7} style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>Subtotal</td>
                          <td style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>{formatCurrency(invoice.subtotal).replace("₹", "")}</td>
                        </tr>

                        {/* Overall Discount */}
                        {invoice.discountAmount && invoice.discountAmount > 0 ? (
                          <tr>
                            <td colSpan={7} style={tdAltStyle({ textAlign: "right", fontWeight: 700, color: "#1d4ed8" })}>
                              Overall Discount {invoice.discountType === "percentage" ? `(${invoice.discountValue}%)` : ""}
                            </td>
                            <td style={tdAltStyle({ textAlign: "right", fontWeight: 700, color: "#1d4ed8" })}>
                              -{formatCurrency(invoice.discountAmount).replace("₹", "")}
                            </td>
                          </tr>
                        ) : null}

                        {/* GST */}
                        {invoice.gstBreakdown.isInterState ? (
                          <tr>
                            <td colSpan={7} style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>IGST @ 18%</td>
                            <td style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>{formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}</td>
                          </tr>
                        ) : (
                          <>
                            <tr>
                              <td colSpan={7} style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>CGST @ 9%</td>
                              <td style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>{formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}</td>
                            </tr>
                            <tr>
                              <td colSpan={7} style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>SGST @ 9%</td>
                              <td style={tdAltStyle({ textAlign: "right", fontWeight: 700 })}>{formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}</td>
                            </tr>
                          </>
                        )}

                        {/* Total */}
                        <tr>
                          <td colSpan={7} style={{ ...tdAltStyle({ textAlign: "right", fontWeight: 700 }), backgroundColor: "#e5e7eb" }}>TOTAL</td>
                          <td style={{ ...tdAltStyle({ textAlign: "right", fontWeight: 700 }), backgroundColor: "#e5e7eb" }}>
                            ₹{formatCurrency(invoice.total).replace("₹", "")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tax summary table */}
                  <div className="pdf-avoid-break" style={{ marginBottom: "14px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle({ textAlign: "center" })}>HSN/SAC</th>
                          <th style={thStyle({ textAlign: "center" })}>Taxable Value</th>
                          {invoice.gstBreakdown.isInterState ? (
                            <>
                              <th style={thStyle({ textAlign: "center" })}>IGST Rate</th>
                              <th style={thStyle({ textAlign: "center" })}>IGST Amount</th>
                            </>
                          ) : (
                            <>
                              <th style={thStyle({ textAlign: "center" })}>CGST Rate</th>
                              <th style={thStyle({ textAlign: "center" })}>CGST Amount</th>
                              <th style={thStyle({ textAlign: "center" })}>SGST Rate</th>
                              <th style={thStyle({ textAlign: "center" })}>SGST Amount</th>
                            </>
                          )}
                          <th style={thStyle({ textAlign: "center" })}>Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={tdStyle({ textAlign: "center" })}>{invoice.items[0]?.hsnSac || "–"}</td>
                          <td style={tdStyle({ textAlign: "center" })}>{formatCurrency(invoice.subtotal - (invoice.discountAmount || 0)).replace("₹", "")}</td>
                          {invoice.gstBreakdown.isInterState ? (
                            <>
                              <td style={tdStyle({ textAlign: "center" })}>18%</td>
                              <td style={tdStyle({ textAlign: "center" })}>{formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}</td>
                            </>
                          ) : (
                            <>
                              <td style={tdStyle({ textAlign: "center" })}>9%</td>
                              <td style={tdStyle({ textAlign: "center" })}>{formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}</td>
                              <td style={tdStyle({ textAlign: "center" })}>9%</td>
                              <td style={tdStyle({ textAlign: "center" })}>{formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}</td>
                            </>
                          )}
                          <td style={tdStyle({ textAlign: "center", fontWeight: 600 })}>{formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}</td>
                        </tr>
                        <tr>
                          <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>Total</td>
                          <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>{formatCurrency(invoice.subtotal - (invoice.discountAmount || 0)).replace("₹", "")}</td>
                          {invoice.gstBreakdown.isInterState ? (
                            <>
                              <td style={{ ...tdAltStyle({ textAlign: "center" }), backgroundColor: "#f3f4f6" }}></td>
                              <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>{formatCurrency(invoice.gstBreakdown.igst).replace("₹", "")}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ ...tdAltStyle({ textAlign: "center" }), backgroundColor: "#f3f4f6" }}></td>
                              <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>{formatCurrency(invoice.gstBreakdown.cgst).replace("₹", "")}</td>
                              <td style={{ ...tdAltStyle({ textAlign: "center" }), backgroundColor: "#f3f4f6" }}></td>
                              <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>{formatCurrency(invoice.gstBreakdown.sgst).replace("₹", "")}</td>
                            </>
                          )}
                          <td style={{ ...tdAltStyle({ textAlign: "center", fontWeight: 700 }), backgroundColor: "#f3f4f6" }}>{formatCurrency(invoice.gstBreakdown.total).replace("₹", "")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Amount in words */}
              <div className="pdf-avoid-break" style={{ marginBottom: "14px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                <div style={{ border: "1px solid #374151", padding: "10px 14px", backgroundColor: "#f9fafb" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px", color: "#111827" }}>Total Amount (in words)</p>
                  <p style={{ fontSize: "13px", fontStyle: "italic", color: "#374151", margin: 0 }}>{convertToWords(invoice.total)}</p>
                </div>
              </div>

              {/* Footer: Bank | Terms | Signature */}
              <div className="pdf-avoid-break invoice-footer-section" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                {/* Bank Details */}
                <div style={{ border: "1px solid #374151", padding: "10px 12px", backgroundColor: "#f9fafb" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", color: "#111827" }}>Bank Details</p>
                  <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7" }}>
                    <p style={{ margin: 0 }}>Name: {user?.bankName || "Bank Name"}</p>
                    <p style={{ margin: 0 }}>IFSC: {user?.ifscCode || "IFSC Code"}</p>
                    <p style={{ margin: 0 }}>A/c No: {user?.accountNumber || "Account Number"}</p>
                  </div>
                </div>
                {/* Terms */}
                <div style={{ border: "1px solid #374151", padding: "10px 12px", backgroundColor: "#f9fafb" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", color: "#111827" }}>Terms and Conditions</p>
                  <div style={{ fontSize: "12px", color: "#374151", lineHeight: "1.7" }}>
                    <p style={{ margin: 0 }}>1. All disputes arising out of this transaction shall be subject to the exclusive jurisdiction of courts in {user?.state || "jurisdiction"}.</p>
                    <p style={{ margin: 0 }}>2. TDS Deduction will lie under Section 194C</p>
                    <p style={{ margin: 0 }}>3. Payment to Contractor (1% or 2%)</p>
                  </div>
                </div>
                {/* Signature */}
                <div style={{ border: "1px solid #374151", padding: "10px 12px", backgroundColor: "#f9fafb", textAlign: "center" }}>
                  {isValidSignature(user?.signature) && !signatureError ? (
                    <div style={{ marginBottom: "8px" }}>
                      <img
                        src={user?.signature || ""}
                        alt="Digital Signature"
                        className="invoice-signature-img"
                        style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain", margin: "0 auto", display: "block" }}
                        onError={handleSignatureError}
                        onLoad={() => setSignatureError(false)}
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                        {user?.signature && signatureError ? "Signature Error" : "Digital Signature"}
                      </span>
                    </div>
                  )}
                  <p style={{ fontWeight: 700, fontSize: "13px", margin: 0, color: "#111827" }}>Authorised Signatory For</p>
                  <p style={{ fontWeight: 700, fontSize: "13px", margin: 0, color: "#111827" }}>{user?.fullName || "Your Business"}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default InvoicePreview
