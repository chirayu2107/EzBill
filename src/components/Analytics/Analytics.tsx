"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useTheme } from "../../context/ThemeContext"
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
  const { theme } = useTheme()
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

    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      dailyData[dateKey] = { sales: 0, invoices: 0 }
    }

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
    const fyStart = new Date(selectedFY, 3, 1)
    const fyEnd = new Date(selectedFY + 1, 2, 31)

    const monthlyData: { [key: string]: { sales: number; invoices: number } } = {}

    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    months.forEach((_, index) => {
      const actualMonth = index < 9 ? index + 4 : index - 8
      const actualYear = index < 9 ? selectedFY : selectedFY + 1
      const monthKey = `${actualYear}-${String(actualMonth).padStart(2, "0")}`
      monthlyData[monthKey] = { sales: 0, invoices: 0 }
    })

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

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)

      const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
        wch: Math.max(key.length, ...worksheetData.map((row) => String(row[key] || "").length)) + 2,
      }))
      worksheet["!cols"] = colWidths

      XLSX.utils.book_append_sheet(workbook, worksheet, reportType === "monthly" ? "Daily Sales" : "Monthly Sales")
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
      const html2canvas = (await import("html2canvas")).default
      const chartId = reportType === "monthly" ? "monthly-chart" : "fy-chart"
      const filename =
        reportType === "monthly" ? `Monthly_Chart_${selectedMonth}.png` : `FY_Chart_${selectedFY}-${selectedFY + 1}.png`

      const chartElement = document.getElementById(chartId)
      if (!chartElement) {
        throw new Error("Chart element not found")
      }

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
        width: chartElement.scrollWidth,
        height: chartElement.scrollHeight,
      })

      const link = document.createElement("a")
      link.download = filename
      link.href = canvas.toDataURL("image/png")

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
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 8, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  const selectClasses = "w-full px-3.5 py-2.5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/40 appearance-none transition-all shadow-sm"

  return (
    <div className="pt-20 lg:pt-0">
      <motion.div
        className="max-w-7xl mx-auto space-y-6 md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ PAGE HEADER ═══ */}
        <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Business insights and reports</p>
          </div>
        </motion.div>

        {/* ═══ CONTROLS ═══ */}
        <motion.div variants={itemVariants}>
          {/* Mobile Layout (2x2 Grid) */}
          <div className="block md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Report Type</label>
                  <div className="relative">
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as ReportType)}
                      className={`${selectClasses} text-xs py-1.5`}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="financial-year">Financial Year</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </Card>

              <Card padding="sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                    {reportType === "monthly" ? "Select Month" : "Select FY"}
                  </label>
                  <div className="relative">
                    {reportType === "monthly" ? (
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className={`${selectClasses} text-xs py-1.5`}
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
                        className={`${selectClasses} text-xs py-1.5`}
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

            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">View Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewType("chart")}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        viewType === "chart" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Chart
                    </button>
                    <button
                      onClick={() => setViewType("table")}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        viewType === "table" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </Card>

              <Card padding="sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Export</label>
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={handleExportExcel}
                      icon={FileSpreadsheet}
                      size="sm"
                      variant="accent"
                      className="w-full text-xs py-1.5 px-2"
                    >
                      Excel
                    </Button>
                    {viewType === "chart" && (
                      <Button
                        onClick={handleExportChart}
                        icon={Download}
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs py-1.5 px-2"
                      >
                        PNG
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Desktop Layout — inline toolbar */}
          <div className="hidden md:flex items-end gap-4 bg-white dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-gray-800/50 p-4 shadow-sm">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Report Type</label>
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className={selectClasses}
                >
                  <option value="monthly">Monthly Report</option>
                  <option value="financial-year">Financial Year Report</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                {reportType === "monthly" ? "Select Month" : "Select Financial Year"}
              </label>
              <div className="relative">
                {reportType === "monthly" ? (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={selectClasses}
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
                    className={selectClasses}
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">View Type</label>
              <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => setViewType("chart")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewType === "chart" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setViewType("table")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewType === "table" ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExportExcel} icon={FileSpreadsheet} size="sm" variant="accent" className="text-xs">Excel</Button>
              {viewType === "chart" && (
                <Button onClick={handleExportChart} icon={Download} size="sm" variant="secondary" className="text-xs">PNG</Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ SUMMARY STATS ═══ */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Sales</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">{formatCurrency(getTotalSales())}</p>
            </div>

            <div className="rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Invoices</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">{getTotalInvoices()}</p>
            </div>

            <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avg Sales</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight truncate">{formatCurrency(getAverageSales())}</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ CHART / TABLE ═══ */}
        <motion.div variants={itemVariants}>
          {viewType === "chart" ? (
            <Card>
              <div className="mb-4 md:mb-6">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                  {reportType === "monthly" ? "Daily Breakdown" : "Monthly Breakdown"}
                </span>
                <h3 className="text-lg md:text-xl font-bold tracking-heading text-gray-900 dark:text-white mb-1">
                  {reportType === "monthly"
                    ? `Sales — ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                    : `Sales — FY ${selectedFY}-${selectedFY + 1}`}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
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
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                  {reportType === "monthly" ? "Daily Data" : "Monthly Data"}
                </span>
                <h3 className="text-lg md:text-xl font-bold tracking-heading text-gray-900 dark:text-white">
                  {reportType === "monthly"
                    ? `Sales Table — ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                    : `Sales Table — FY ${selectedFY}-${selectedFY + 1}`}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-3 px-2 md:px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {reportType === "monthly" ? "Date" : "Month"}
                      </th>
                      <th className="text-right py-3 px-2 md:px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sales Amount</th>
                      <th className="text-right py-3 px-2 md:px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Invoice Count</th>
                      <th className="text-right py-3 px-2 md:px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Avg per Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportType === "monthly"
                      ? monthlyData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3 px-2 md:px-4 text-gray-900 dark:text-white text-sm">{item.formattedDate}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-900 dark:text-white font-medium text-sm ez-number">
                              {formatCurrency(item.sales)}
                            </td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-500 dark:text-gray-400 text-sm ez-number">{item.invoices}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-500 dark:text-gray-400 text-sm ez-number">
                              {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                            </td>
                          </tr>
                        ))
                      : financialYearData.map((item, index) => (
                          <tr key={index} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3 px-2 md:px-4 text-gray-900 dark:text-white text-sm">{item.month}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-900 dark:text-white font-medium text-sm ez-number">
                              {formatCurrency(item.sales)}
                            </td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-500 dark:text-gray-400 text-sm ez-number">{item.invoices}</td>
                            <td className="py-3 px-2 md:px-4 text-right text-gray-500 dark:text-gray-400 text-sm ez-number">
                              {item.invoices > 0 ? formatCurrency(item.sales / item.invoices) : formatCurrency(0)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                      <td className="py-3 px-2 md:px-4 text-gray-900 dark:text-white font-semibold text-sm">Total</td>
                      <td className="py-3 px-2 md:px-4 text-right text-gray-900 dark:text-white font-bold text-sm ez-number">
                        {formatCurrency(getTotalSales())}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-right text-gray-900 dark:text-white font-bold text-sm ez-number">
                        {getTotalInvoices()}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-right text-gray-900 dark:text-white font-bold text-sm ez-number">
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
