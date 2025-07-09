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
      // Dynamic import to avoid SSR issues
      const XLSX = await import("xlsx")
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

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)

      // Auto-size columns
      const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...worksheetData.map((row) => String(row[key] || "").length)) + 2,
      }))
      worksheet["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, reportType === "monthly" ? "Daily Sales" : "Monthly Sales")

      // Write file
      XLSX.writeFile(workbook, filename)

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
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default
      const chartId = reportType === "monthly" ? "monthly-chart" : "fy-chart"
      const filename =
        reportType === "monthly" ? `Monthly_Chart_${selectedMonth}.png` : `FY_Chart_${selectedFY}-${selectedFY + 1}.png`

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="pt-24 md:pt-0">
      <motion.div
        className="max-w-7xl mx-auto space-y-6 md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
          <div>
            <div className="flex items-center gap-3 md:gap-4 mb-2">
              <div className="p-2 md:p-3 bg-blue-500/10 rounded-xl">
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white">Analytics</h1>
                <p className="text-gray-400 text-base md:text-lg">Business insights and reports</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls - Mobile: 2x2 Grid, Desktop: Original 4 columns */}
        <motion.div variants={itemVariants}>
          {/* Mobile Layout (2x2 Grid) */}
          <div className="block md:hidden space-y-3">
            {/* First Row: Report Type and Select Month/FY */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300">Report Type</label>
                  <div className="relative">
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as ReportType)}
                      className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="financial-year">Financial Year</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300">
                    {reportType === "monthly" ? "Select Month" : "Select FY"}
                  </label>
                  <div className="relative">
                    {reportType === "monthly" ? (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs"
                      >
                        {availableMonths.length > 0 ? (
                          availableMonths.map((month) => {
                            const [year, monthNum] = month.split("-")
                            const monthName = new Date(
                              Number.parseInt(year),
                              Number.parseInt(monthNum) - 1,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })
                            return (
                              <option key={month} value={month}>
                                {monthName}
                              </option>
                            )
                          })
                        ) : (
                          <option value={selectedMonth}>
                            {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })}
                          </option>
                        )}
                      </select>
                    ) : (
                      <select
                        value={selectedFY}
                        onChange={(e) => setSelectedFY(Number.parseInt(e.target.value))}
                        className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-xs"
                      >
                        {availableFYs.length > 0 ? (
                          availableFYs.map((fy) => (
                            <option key={fy} value={fy}>
                              FY {fy}-{fy + 1}
                            </option>
                          ))
                        ) : (
                          <option value={selectedFY}>
                            FY {selectedFY}-{selectedFY + 1}
                          </option>
                        )}
                      </select>
                    )}
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Second Row: View Type and Export Options */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300">View Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewType("chart")}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        viewType === "chart" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Chart
                    </button>
                    <button
                      onClick={() => setViewType("table")}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        viewType === "table" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300">Export Options</label>
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={handleExportExcel}
                      icon={FileSpreadsheet}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 text-xs py-1.5 px-2"
                    >
                      Excel
                    </Button>
                    {viewType === "chart" && (
                      <Button
                        onClick={handleExportChart}
                        icon={Download}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-xs py-1.5 px-2"
                      >
                        PNG
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Desktop Layout (Original 4 columns) */}
          <div className="hidden md:grid md:grid-cols-4 gap-6">
            <Card>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Report Type</label>
                <div className="relative">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
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
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                    >
                      {availableMonths.length > 0 ? (
                        availableMonths.map((month) => {
                          const [year, monthNum] = month.split("-")
                          const monthName = new Date(
                            Number.parseInt(year),
                            Number.parseInt(monthNum) - 1,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })
                          return (
                            <option key={month} value={month}>
                              {monthName}
                            </option>
                          )
                        })
                      ) : (
                        <option value={selectedMonth}>
                          {new Date(selectedMonth + "-01").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                          })}
                        </option>
                      )}
                    </select>
                  ) : (
                    <select
                      value={selectedFY}
                      onChange={(e) => setSelectedFY(Number.parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                    >
                      {availableFYs.length > 0 ? (
                        availableFYs.map((fy) => (
                          <option key={fy} value={fy}>
                            FY {fy}-{fy + 1}
                          </option>
                        ))
                      ) : (
                        <option value={selectedFY}>
                          FY {selectedFY}-{selectedFY + 1}
                        </option>
                      )}
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                  >
                    Excel
                  </Button>
                  {viewType === "chart" && (
                    <Button
                      onClick={handleExportChart}
                      icon={Download}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      PNG
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Summary Cards - Mobile: Single Row, Desktop: Original Layout */}
        <motion.div variants={itemVariants}>
          {/* Mobile Layout (Single Row) */}
          <div className="grid grid-cols-3 gap-2 md:hidden">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20 p-3">
              <div className="flex flex-col items-center gap-2">
                <div className="text-center min-w-0 flex-1">
                  <p className="text-green-400 text-xs font-medium">Total Sales</p>
                  <p className="text-sm font-bold text-white truncate">{formatCurrency(getTotalSales())}</p>
                </div>
                <div className="p-1.5 bg-green-500/10 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20 p-3">
              <div className="flex flex-col items-center gap-2">
                <div className="text-center min-w-0 flex-1">
                  <p className="text-blue-400 text-xs font-medium">Total Invoices</p>
                  <p className="text-sm font-bold text-white">{getTotalInvoices()}</p>
                </div>
                <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0">
                  <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20 p-3">
              <div className="flex flex-col items-center gap-2">
                <div className="text-center min-w-0 flex-1">
                  <p className="text-purple-400 text-xs font-medium">Average Sales</p>
                  <p className="text-sm font-bold text-white truncate">{formatCurrency(getAverageSales())}</p>
                </div>
                <div className="p-1.5 bg-purple-500/10 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-3 h-3 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Desktop Layout (Original) */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-green-400 text-sm font-medium">Total Sales</p>
                  <p className="text-2xl font-bold text-white truncate">{formatCurrency(getTotalSales())}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border-blue-500/20">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-blue-400 text-sm font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{getTotalInvoices()}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-purple-400 text-sm font-medium">Average Sales</p>
                  <p className="text-2xl font-bold text-white truncate">{formatCurrency(getAverageSales())}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Chart/Table Content - Mobile Optimized Charts/Tables */}
        <motion.div variants={itemVariants}>
          {viewType === "chart" ? (
            <Card>
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  {reportType === "monthly"
                    ? `Daily Sales - ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                    : `Monthly Sales - FY ${selectedFY}-${selectedFY + 1}`}
                </h3>
                <p className="text-gray-400 text-sm md:text-base">
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
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                  {reportType === "monthly"
                    ? `Daily Sales Table - ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                    : `Monthly Sales Table - FY ${selectedFY}-${selectedFY + 1}`}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-2 md:px-4 text-gray-300 font-semibold text-sm">
                        {reportType === "monthly" ? "Date" : "Month"}
                      </th>
                      <th className="text-right py-3 px-2 md:px-4 text-gray-300 font-semibold text-sm">Sales Amount</th>
                      <th className="text-right py-3 px-2 md:px-4 text-gray-300 font-semibold text-sm">
                        Invoice Count
                      </th>
                      <th className="text-right py-3 px-2 md:px-4 text-gray-300 font-semibold text-sm">
                        Avg per Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportType === "monthly"
                      ? monthlyData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="py-3 px-2 md:px-4 text-white text-sm">{item.formattedDate}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-white font-medium text-sm">
                              {formatCurrency(item.sales)}
                            </td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-300 text-sm">{item.invoices}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-300 text-sm">
                              {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                            </td>
                          </tr>
                        ))
                      : financialYearData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="py-3 px-2 md:px-4 text-white text-sm">{item.month}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-white font-medium text-sm">
                              {formatCurrency(item.sales)}
                            </td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-300 text-sm">{item.invoices}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-300 text-sm">
                              {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-600 bg-gray-750">
                      <td className="py-3 px-2 md:px-4 text-white font-semibold text-sm">Total</td>
                      <td className="py-3 px-2 md:px-4 text-right text-white font-semibold text-sm">
                        {formatCurrency(getTotalSales())}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-right text-white font-semibold text-sm">
                        {getTotalInvoices()}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-right text-white font-semibold text-sm">
                        {formatCurrency(getAverageSales())}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Analytics
