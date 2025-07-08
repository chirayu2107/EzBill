"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useToast } from "../../hooks/useToast"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { BarChart3, Download, TrendingUp, FileSpreadsheet, ChevronDown } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"
import MonthlyChart from "./MonthlyChart"
import FinancialYearChart from "./FinancialYearChart"
import { exportToExcel } from "../../utils/excelExport"
import { exportChartAsPNG } from "../../utils/chartExport"

type ReportType = "monthly" | "financial-year"
type ViewType = "chart" | "table"

const Analytics: React.FC = () => {
  const { invoices } = useApp()
  const { toast } = useToast()

  const [reportType, setReportType] = useState<ReportType>("monthly")
  const [viewType, setViewType] = useState<ViewType>("chart")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedFY, setSelectedFY] = useState(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    return currentMonth >= 4 ? currentYear : currentYear - 1
  })

  // Get available months and financial years from invoices
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }, [invoices])

  const availableFYs = useMemo(() => {
    const fys = new Set<number>()
    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const fy = month >= 4 ? year : year - 1
      fys.add(fy)
    })
    return Array.from(fys).sort().reverse()
  }, [invoices])

  // Monthly data (daily breakdown)
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const dailyData: { [key: string]: { sales: number; invoices: number } } = {}

    // Initialize all days of the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      dailyData[dateKey] = { sales: 0, invoices: 0 }
    }

    // Populate with actual data
    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      if (invoiceDate >= startDate && invoiceDate <= endDate) {
        const dateKey = invoiceDate.toISOString().split("T")[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].sales += invoice.total
          dailyData[dateKey].invoices += 1
        }
      }
    })

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      day: new Date(date).getDate(),
      sales: data.sales,
      invoices: data.invoices,
      formattedDate: formatDate(new Date(date)),
    }))
  }, [invoices, selectedMonth])

  // Financial Year data (monthly breakdown)
  const financialYearData = useMemo(() => {
    const fyStart = new Date(selectedFY, 3, 1) // April 1st
    const fyEnd = new Date(selectedFY + 1, 2, 31) // March 31st

    const monthlyData: { [key: string]: { sales: number; invoices: number } } = {}

    // Initialize all months of the FY
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]

    months.forEach((_, index) => {
      const actualMonth = index < 9 ? index + 4 : index - 8
      const actualYear = index < 9 ? selectedFY : selectedFY + 1
      const monthKey = `${actualYear}-${String(actualMonth).padStart(2, "0")}`
      monthlyData[monthKey] = { sales: 0, invoices: 0 }
    })

    // Populate with actual data
    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      if (invoiceDate >= fyStart && invoiceDate <= fyEnd) {
        const year = invoiceDate.getFullYear()
        const month = invoiceDate.getMonth() + 1
        const monthKey = `${year}-${String(month).padStart(2, "0")}`
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].sales += invoice.total
          monthlyData[monthKey].invoices += 1
        }
      }
    })

    return months.map((monthName, index) => {
      const actualMonth = index < 9 ? index + 4 : index - 8
      const actualYear = index < 9 ? selectedFY : selectedFY + 1
      const monthKey = `${actualYear}-${String(actualMonth).padStart(2, "0")}`
      const data = monthlyData[monthKey]

      return {
        month: monthName,
        sales: data?.sales || 0,
        invoices: data?.invoices || 0,
        fullDate: new Date(actualYear, actualMonth - 1, 1),
      }
    })
  }, [invoices, selectedFY])

  const handleExportExcel = async () => {
    try {
      const filename =
        reportType === "monthly"
          ? `Monthly_Report_${selectedMonth}.xlsx`
          : `FY_Report_${selectedFY}-${selectedFY + 1}.xlsx`

      let worksheetData: any[]

      if (reportType === "monthly") {
        worksheetData = monthlyData.map((item) => ({
          Date: item.formattedDate,
          Day: item.day,
          Sales: item.sales,
          "Invoice Count": item.invoices,
          "Sales (Formatted)": formatCurrency(item.sales),
        }))
      } else {
        worksheetData = financialYearData.map((item) => ({
          Month: item.month,
          Sales: item.sales,
          "Invoice Count": item.invoices,
          "Sales (Formatted)": formatCurrency(item.sales),
        }))
      }

      await exportToExcel(worksheetData, filename, reportType === "monthly" ? "Daily Sales" : "Monthly Sales")
      toast.success(
        "Export Successful",
        `${reportType === "monthly" ? "Monthly" : "Financial Year"} report exported to Excel`,
      )
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Export Failed", "Failed to export data to Excel")
    }
  }

  const handleExportChart = async () => {
    try {
      const chartId = reportType === "monthly" ? "monthly-chart" : "fy-chart"
      const filename =
        reportType === "monthly" ? `Monthly_Chart_${selectedMonth}.png` : `FY_Chart_${selectedFY}-${selectedFY + 1}.png`

      await exportChartAsPNG(chartId, filename)
      toast.success("Chart Exported", "Chart saved as PNG image")
    } catch (error) {
      console.error("Chart export error:", error)
      toast.error("Export Failed", "Failed to export chart")
    }
  }

  const getTotalSales = () => {
    if (reportType === "monthly") {
      return monthlyData.reduce((sum, item) => sum + item.sales, 0)
    } else {
      return financialYearData.reduce((sum, item) => sum + item.sales, 0)
    }
  }

  const getTotalInvoices = () => {
    if (reportType === "monthly") {
      return monthlyData.reduce((sum, item) => sum + item.invoices, 0)
    } else {
      return financialYearData.reduce((sum, item) => sum + item.invoices, 0)
    }
  }

  const getAverageSales = () => {
    const data = reportType === "monthly" ? monthlyData : financialYearData
    const nonZeroData = data.filter((item) => item.sales > 0)
    return nonZeroData.length > 0 ? getTotalSales() / nonZeroData.length : 0
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        className="flex justify-between items-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Analytics</h1>
              <p className="text-gray-400 text-lg">Business insights and reports</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Report Type</label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="monthly">Monthly Report</option>
                <option value="financial-year">Financial Year Report</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              {reportType === "monthly" ? "Select Month" : "Select Financial Year"}
            </label>
            <div className="relative">
              {reportType === "monthly" ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {availableMonths.map((month) => {
                    const [year, monthNum] = month.split("-")
                    const monthName = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      },
                    )
                    return (
                      <option key={month} value={month}>
                        {monthName}
                      </option>
                    )
                  })}
                </select>
              ) : (
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(Number.parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {availableFYs.map((fy) => (
                    <option key={fy} value={fy}>
                      FY {fy}-{fy + 1}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">View Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType("chart")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === "chart" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewType("table")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewType === "table" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Export Options</label>
            <div className="flex gap-2">
              <Button
                onClick={handleExportExcel}
                icon={FileSpreadsheet}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Excel
              </Button>
              {viewType === "chart" && (
                <Button
                  onClick={handleExportChart}
                  icon={Download}
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  PNG
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(getTotalSales())}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-white">{getTotalInvoices()}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Average Sales</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(getAverageSales())}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Chart/Table Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {viewType === "chart" ? (
          <Card>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {reportType === "monthly"
                  ? `Daily Sales - ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                  : `Monthly Sales - FY ${selectedFY}-${selectedFY + 1}`}
              </h3>
              <p className="text-gray-400">
                {reportType === "monthly"
                  ? "Daily breakdown of sales and invoice count"
                  : "Monthly breakdown of sales and invoice count for the financial year"}
              </p>
            </div>

            {reportType === "monthly" ? (
              <MonthlyChart data={monthlyData} />
            ) : (
              <FinancialYearChart data={financialYearData} />
            )}
          </Card>
        ) : (
          <Card>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                {reportType === "monthly"
                  ? `Daily Sales Table - ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                  : `Monthly Sales Table - FY ${selectedFY}-${selectedFY + 1}`}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">
                      {reportType === "monthly" ? "Date" : "Month"}
                    </th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Sales Amount</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Invoice Count</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-semibold">Avg per Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {reportType === "monthly"
                    ? monthlyData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-3 px-4 text-white">{item.formattedDate}</td>
                          <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(item.sales)}</td>
                          <td className="py-3 px-4 text-right text-gray-300">{item.invoices}</td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                          </td>
                        </tr>
                      ))
                    : financialYearData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                          <td className="py-3 px-4 text-white">{item.month}</td>
                          <td className="py-3 px-4 text-right text-white font-medium">{formatCurrency(item.sales)}</td>
                          <td className="py-3 px-4 text-right text-gray-300">{item.invoices}</td>
                          <td className="py-3 px-4 text-right text-gray-300">
                            {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                          </td>
                        </tr>
                      ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-600 bg-gray-750">
                    <td className="py-3 px-4 text-white font-semibold">Total</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">{formatCurrency(getTotalSales())}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">{getTotalInvoices()}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">
                      {formatCurrency(getAverageSales())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default Analytics
