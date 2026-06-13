"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { 
  Download, 
  Building2, 
  Users, 
  BarChart2,
} from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"
import { formatCurrency } from "../../utils/calculations"

const GSTReports: React.FC = () => {
  const { invoices } = useApp()
  const [activeTab, setActiveTab] = useState<"b2b" | "b2c" | "hsn">("b2b")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  })

  // Filter invoices based on date range
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const d = new Date(inv.date).toISOString().split("T")[0]
      return d >= dateRange.start && d <= dateRange.end
    })
  }, [invoices, dateRange])

  // Data Aggregations
  const b2bData = useMemo(() => {
    return filteredInvoices.filter(inv => inv.customerGSTIN && inv.customerGSTIN.trim() !== "")
  }, [filteredInvoices])

  const b2cData = useMemo(() => {
    return filteredInvoices.filter(inv => !inv.customerGSTIN || inv.customerGSTIN.trim() === "")
  }, [filteredInvoices])

  const hsnSummary = useMemo(() => {
    const summary: Record<string, { hsn: string; description: string; qty: number; taxableValue: number; igst: number; cgst: number; sgst: number; total: number }> = {}
    
    filteredInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const hsn = item.hsnSac || "N/A"
        if (!summary[hsn]) {
          summary[hsn] = { 
            hsn, 
            description: item.name, 
            qty: 0, 
            taxableValue: 0, 
            igst: 0, 
            cgst: 0, 
            sgst: 0, 
            total: 0 
          }
        }
        
        const ratio = item.lineTotal / inv.subtotal || 1
        summary[hsn].qty += item.quantity
        summary[hsn].taxableValue += item.lineTotal
        summary[hsn].igst += (inv.gstBreakdown.igst * ratio)
        summary[hsn].cgst += (inv.gstBreakdown.cgst * ratio)
        summary[hsn].sgst += (inv.gstBreakdown.sgst * ratio)
        summary[hsn].total += (item.lineTotal + (inv.gstBreakdown.total * ratio))
      })
    })
    
    return Object.values(summary)
  }, [filteredInvoices])

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,"
    let fileName = `EzBill_GST_Report_${activeTab}_${dateRange.start}_to_${dateRange.end}.csv`

    if (activeTab === "b2b") {
      csvContent += "Invoice No,Date,Customer Name,GSTIN,Taxable Value,IGST,CGST,SGST,Total\n"
      b2bData.forEach(inv => {
        csvContent += `${inv.invoiceNumber},${new Date(inv.date).toLocaleDateString()},${inv.customerName},${inv.customerGSTIN},${inv.subtotal},${inv.gstBreakdown.igst},${inv.gstBreakdown.cgst},${inv.gstBreakdown.sgst},${inv.total}\n`
      })
    } else if (activeTab === "b2c") {
      csvContent += "Invoice No,Date,Customer Name,Taxable Value,IGST,CGST,SGST,Total\n"
      b2cData.forEach(inv => {
        csvContent += `${inv.invoiceNumber},${new Date(inv.date).toLocaleDateString()},${inv.customerName},${inv.subtotal},${inv.gstBreakdown.igst},${inv.gstBreakdown.cgst},${inv.gstBreakdown.sgst},${inv.total}\n`
      })
    } else {
      csvContent += "HSN/SAC,Qty,Taxable Value,IGST,CGST,SGST,Total\n"
      hsnSummary.forEach(h => {
        csvContent += `${h.hsn},${h.qty},${h.taxableValue},${h.igst},${h.cgst},${h.sgst},${h.total}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  return (
    <div className="pt-20 lg:pt-0 space-y-6 md:space-y-8">
      <motion.div 
        className="flex flex-col md:flex-row md:items-start justify-between gap-4"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            GST Compliance Reports
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            GSTR-1 & 3B ready reports for effortless tax filing
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white dark:bg-[#1A1A1D] rounded-xl border border-gray-200 dark:border-white/[0.04] p-1 shadow-sm">
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="bg-transparent border-none text-xs text-gray-600 dark:text-gray-300 focus:ring-0 p-2 focus:outline-none"
            />
            <span className="text-gray-400 px-1 text-xs">to</span>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="bg-transparent border-none text-xs text-gray-600 dark:text-gray-300 focus:ring-0 p-2 focus:outline-none"
            />
          </div>
          <Button onClick={exportToCSV} icon={Download} variant="accent" size="sm">
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#1A1A1D] rounded-xl p-1 w-full max-w-md">
        <button
          onClick={() => setActiveTab("b2b")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "b2b" ? "bg-white dark:bg-[#1A1A1D] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> B2B
        </button>
        <button
          onClick={() => setActiveTab("b2c")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "b2c" ? "bg-white dark:bg-[#1A1A1D] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> B2C
        </button>
        <button
          onClick={() => setActiveTab("hsn")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === "hsn" ? "bg-white dark:bg-[#1A1A1D] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> HSN Summary
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "b2b" && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.03]">
                  <th className="px-4 md:px-6 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Invoice / Customer</th>
                  <th className="px-4 md:px-6 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">GSTIN</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Taxable Value</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">IGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">CGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {b2bData.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No B2B transactions found in this period</td></tr>
                ) : (
                  b2bData.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/20 transition-colors duration-150">
                      <td className="px-4 md:px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white ez-mono">{inv.invoiceNumber}</span>
                          <span className="text-xs text-gray-400">{inv.customerName}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3.5 ez-mono text-xs text-gray-600 dark:text-gray-400">{inv.customerGSTIN}</td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm font-medium ez-number">{formatCurrency(inv.subtotal)}</td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm text-gray-500 ez-number">{formatCurrency(inv.gstBreakdown.igst)}</td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm text-gray-500 ez-number">{formatCurrency(inv.gstBreakdown.cgst)}</td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm text-gray-500 ez-number">{formatCurrency(inv.gstBreakdown.sgst)}</td>
                      <td className="px-4 md:px-6 py-3.5 text-right text-sm font-bold text-gray-900 dark:text-white ez-number">{formatCurrency(inv.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "b2c" && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.03]">
                  <th className="px-4 md:px-6 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Invoice / Customer</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Taxable Value</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">IGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">CGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]/50">
                {b2cData.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No B2C transactions found in this period</td></tr>
                ) : (
                  b2cData.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">{inv.invoiceNumber}</span>
                          <span className="text-xs text-gray-400">{inv.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(inv.subtotal)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(inv.gstBreakdown.igst)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(inv.gstBreakdown.cgst)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(inv.gstBreakdown.sgst)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(inv.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === "hsn" && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.03]">
                  <th className="px-4 md:px-6 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">HSN / SAC</th>
                  <th className="px-4 md:px-6 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Qty</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Taxable Value</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">IGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">CGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SGST</th>
                  <th className="px-4 md:px-6 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]/50">
                {hsnSummary.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">No HSN data found in this period</td></tr>
                ) : (
                  hsnSummary.map(row => (
                    <tr key={row.hsn} className="hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{row.hsn}</td>
                      <td className="px-6 py-4 text-sm">{row.qty}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium">{formatCurrency(row.taxableValue)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(row.igst)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(row.cgst)}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(row.sgst)}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(row.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

export default GSTReports
