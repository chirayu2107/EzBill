"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useTheme } from "../../context/ThemeContext"
import { useToast } from "../../hooks/useToast"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { BarChart3, Download, TrendingUp, FileSpreadsheet, ChevronDown, ArrowUpRight, ArrowDownRight, Calendar, SlidersHorizontal, MoreVertical } from "lucide-react"
import Card from "../UI/Card"
import MonthlyChart from "./MonthlyChart"
import FinancialYearChart from "./FinancialYearChart"

type ReportType = "monthly" | "financial-year"
type ViewType = "chart" | "table"

const Sparkline: React.FC<{ data: number[]; color?: string; gradientId: string }> = ({ data, color = "#2563eb", gradientId }) => {
  const { strokePath, fillPath, lastPt } = useMemo(() => {
    if (!data || data.length < 2) return { strokePath: "", fillPath: "", lastPt: undefined }
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min === 0 ? 1 : max - min
    const width = 96
    const height = 32
    const pts = data.map((val, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - 2 - ((val - min) / range) * (height - 6)
      return { x, y }
    })

    let stroke = `M ${pts[0].x},${pts[0].y}`
    let curves = ""
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const prev = pts[i - 1] || p0
      const next = pts[i + 2] || p1

      const cp1x = p0.x + (p1.x - prev.x) * 0.18
      const cp1y = p0.y + (p1.y - prev.y) * 0.18
      const cp2x = p1.x - (next.x - p0.x) * 0.18
      const cp2y = p1.y - (next.y - p0.y) * 0.18

      curves += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`
    }
    stroke += curves
    const fill = `M ${pts[0].x},${height} L ${pts[0].x},${pts[0].y}${curves} L ${pts[pts.length - 1].x},${height} Z`

    return { strokePath: stroke, fillPath: fill, lastPt: pts[pts.length - 1] }
  }, [data])

  if (!data || data.length < 2) {
    return (
      <div className="w-24 h-8 flex items-center justify-center">
        <span className="text-[10px] text-gray-300 dark:text-gray-650">---</span>
      </div>
    )
  }

  const glowFilterId = `${gradientId}-glow`

  return (
    <svg width="96" height="32" className="overflow-visible opacity-90 group-hover:opacity-100 transition-opacity">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
        <filter id={glowFilterId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor={color} floodOpacity="0.2" />
        </filter>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path d={strokePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowFilterId})`} />
      {lastPt && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="3"
          fill={color}
          stroke="#fff"
          strokeWidth="1.2"
        />
      )}
    </svg>
  )
}

const Analytics: React.FC = () => {
  const { invoices } = useApp()
  const { theme } = useTheme()
  const { toast } = useToast()

  const [reportType, setReportType] = useState<ReportType>("monthly")
  const [viewType, setViewType] = useState<ViewType>("chart")
  const [activeMetric, setActiveMetric] = useState<"sales" | "invoices">("sales")
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

  // State for filters and context menus
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false)
  const [activeCardMenu, setActiveCardMenu] = useState<"revenue" | "invoices" | "avg" | null>(null)

  // Get available months and financial years from invoices (unfiltered to keep options constant)
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    // Always include current month
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    months.add(currentMonthKey)

    invoices.forEach((invoice) => {
      const date = new Date(invoice.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      months.add(monthKey)
    })
    return Array.from(months).sort().reverse()
  }, [invoices])

  const availableFYs = useMemo(() => {
    const fys = new Set<number>()
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentFY = currentMonth >= 4 ? currentYear : currentYear - 1

    // Always include current financial year and the previous one
    fys.add(currentFY)
    fys.add(currentFY - 1)

    invoices.forEach((invoice) => {
      if (!invoice.date) return
      const date = invoice.date instanceof Date ? invoice.date : new Date(invoice.date)
      if (isNaN(date.getTime())) return
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const fy = month >= 4 ? year : year - 1
      fys.add(fy)
    })
    return Array.from(fys).sort().reverse()
  }, [invoices])

  // Get unique clients for client filter option
  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    invoices.forEach((invoice) => {
      if (invoice.customerName) {
        clients.add(invoice.customerName)
      }
    })
    return Array.from(clients).sort()
  }, [invoices])

  // Base filtered invoices matching the active filters
  const baseFilteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false
      }
      if (clientFilter !== "all" && inv.customerName !== clientFilter) {
        return false
      }
      return true
    })
  }, [invoices, statusFilter, clientFilter])

  // Monthly data (daily breakdown)
  const monthlyData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const prevYear = month === 1 ? year - 1 : year
    const prevMonth = month === 1 ? 12 : month - 1
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = new Date(prevYear, prevMonth, 0)

    const dailyData: { [key: string]: { sales: number; invoices: number } } = {}
    const prevDailyData: { [day: number]: { sales: number; invoices: number } } = {}

    for (let day = 1; day <= endDate.getDate(); day++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      dailyData[dateKey] = { sales: 0, invoices: 0 }
    }

    for (let day = 1; day <= prevEndDate.getDate(); day++) {
      prevDailyData[day] = { sales: 0, invoices: 0 }
    }

    baseFilteredInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      if (invoiceDate >= startDate && invoiceDate <= endDate) {
        const dateKey = invoiceDate.toISOString().split("T")[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].sales += invoice.total
          dailyData[dateKey].invoices += 1
        }
      } else if (invoiceDate >= prevStartDate && invoiceDate <= prevEndDate) {
        const day = invoiceDate.getDate()
        if (prevDailyData[day]) {
          prevDailyData[day].sales += invoice.total
          prevDailyData[day].invoices += 1
        }
      }
    })

    return Object.entries(dailyData).map(([date, data]) => {
      const dayNum = new Date(date).getDate()
      return {
        date,
        day: dayNum,
        sales: data.sales,
        invoices: data.invoices,
        prevSales: prevDailyData[dayNum]?.sales || 0,
        prevInvoices: prevDailyData[dayNum]?.invoices || 0,
        formattedDate: formatDate(new Date(date)),
      }
    })
  }, [baseFilteredInvoices, selectedMonth])

  // Financial Year data (monthly breakdown)
  const financialYearData = useMemo(() => {
    const fyStart = new Date(selectedFY, 3, 1)
    const fyEnd = new Date(selectedFY + 1, 2, 31)

    const prevFYStart = new Date(selectedFY - 1, 3, 1)
    const prevFYEnd = new Date(selectedFY, 2, 31)

    const monthlyData: { [key: string]: { sales: number; invoices: number } } = {}
    const prevMonthlyData: { [key: string]: { sales: number; invoices: number } } = {}

    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
    months.forEach((_, index) => {
      const actualMonth = index < 9 ? index + 4 : index - 8
      const actualYear = index < 9 ? selectedFY : selectedFY + 1
      const monthKey = `${actualYear}-${String(actualMonth).padStart(2, "0")}`
      monthlyData[monthKey] = { sales: 0, invoices: 0 }

      const prevActualYear = index < 9 ? selectedFY - 1 : selectedFY
      const prevMonthKey = `${prevActualYear}-${String(actualMonth).padStart(2, "0")}`
      prevMonthlyData[prevMonthKey] = { sales: 0, invoices: 0 }
    })

    baseFilteredInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date)
      if (invoiceDate >= fyStart && invoiceDate <= fyEnd) {
        const year = invoiceDate.getFullYear()
        const month = invoiceDate.getMonth() + 1
        const monthKey = `${year}-${String(month).padStart(2, "0")}`
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].sales += invoice.total
          monthlyData[monthKey].invoices += 1
        }
      } else if (invoiceDate >= prevFYStart && invoiceDate <= prevFYEnd) {
        const year = invoiceDate.getFullYear()
        const month = invoiceDate.getMonth() + 1
        const monthKey = `${year}-${String(month).padStart(2, "0")}`
        if (prevMonthlyData[monthKey]) {
          prevMonthlyData[monthKey].sales += invoice.total
          prevMonthlyData[monthKey].invoices += 1
        }
      }
    })

    return months.map((monthName, index) => {
      const actualMonth = index < 9 ? index + 4 : index - 8
      const actualYear = index < 9 ? selectedFY : selectedFY + 1
      const monthKey = `${actualYear}-${String(actualMonth).padStart(2, "0")}`

      const prevActualYear = index < 9 ? selectedFY - 1 : selectedFY
      const prevMonthKey = `${prevActualYear}-${String(actualMonth).padStart(2, "0")}`

      const data = monthlyData[monthKey]
      const prevData = prevMonthlyData[prevMonthKey]
      return {
        month: monthName,
        sales: data?.sales || 0,
        invoices: data?.invoices || 0,
        prevSales: prevData?.sales || 0,
        prevInvoices: prevData?.invoices || 0,
        fullDate: new Date(actualYear, actualMonth - 1, 1),
      }
    })
  }, [baseFilteredInvoices, selectedFY])

  // Filter invoices for the active period (selected Month or selected FY)
  const filteredInvoices = useMemo(() => {
    if (reportType === "monthly") {
      const [year, month] = selectedMonth.split("-").map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)
      return baseFilteredInvoices.filter((inv) => {
        const d = new Date(inv.date)
        return d >= startDate && d <= endDate
      })
    } else {
      const fyStart = new Date(selectedFY, 3, 1)
      const fyEnd = new Date(selectedFY + 1, 2, 31, 23, 59, 59, 999)
      return baseFilteredInvoices.filter((inv) => {
        const d = new Date(inv.date)
        return d >= fyStart && d <= fyEnd
      })
    }
  }, [baseFilteredInvoices, reportType, selectedMonth, selectedFY])

  // Filter invoices for the previous period (to calculate growth/trends)
  const previousPeriodInvoices = useMemo(() => {
    if (reportType === "monthly") {
      const [year, month] = selectedMonth.split("-").map(Number)
      const prevYear = month === 1 ? year - 1 : year
      const prevMonth = month === 1 ? 12 : month - 1
      const startDate = new Date(prevYear, prevMonth - 1, 1)
      const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)
      return baseFilteredInvoices.filter((inv) => {
        const d = new Date(inv.date)
        return d >= startDate && d <= endDate
      })
    } else {
      const prevFY = selectedFY - 1
      const fyStart = new Date(prevFY, 3, 1)
      const fyEnd = new Date(prevFY + 1, 2, 31, 23, 59, 59, 999)
      return baseFilteredInvoices.filter((inv) => {
        const d = new Date(inv.date)
        return d >= fyStart && d <= fyEnd
      })
    }
  }, [baseFilteredInvoices, reportType, selectedMonth, selectedFY])

  // Calculate percentage changes
  const salesPercentageChange = useMemo(() => {
    const currentSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const previousSales = previousPeriodInvoices.reduce((sum, inv) => sum + inv.total, 0)
    if (previousSales === 0) return currentSales > 0 ? 100 : 0
    return ((currentSales - previousSales) / previousSales) * 100
  }, [filteredInvoices, previousPeriodInvoices])

  const invoicesPercentageChange = useMemo(() => {
    const currentCount = filteredInvoices.length
    const previousCount = previousPeriodInvoices.length
    if (previousCount === 0) return currentCount > 0 ? 100 : 0
    return ((currentCount - previousCount) / previousCount) * 100
  }, [filteredInvoices, previousPeriodInvoices])

  const avgSalesPercentageChange = useMemo(() => {
    const currentCount = filteredInvoices.length
    const currentSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const currentAvg = currentCount > 0 ? currentSales / currentCount : 0

    const previousCount = previousPeriodInvoices.length
    const previousSales = previousPeriodInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const previousAvg = previousCount > 0 ? previousSales / previousCount : 0

    if (previousAvg === 0) return currentAvg > 0 ? 100 : 0
    return ((currentAvg - previousAvg) / previousAvg) * 100
  }, [filteredInvoices, previousPeriodInvoices])

  // Top Invoices
  const topInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => b.total - a.total).slice(0, 5)
  }, [filteredInvoices])

  // Status Distribution
  const statusCounts = useMemo(() => {
    const counts = { paid: 0, unpaid: 0, overdue: 0 }
    filteredInvoices.forEach((inv) => {
      if (inv.status === "paid") counts.paid++
      else if (inv.status === "overdue") counts.overdue++
      else counts.unpaid++
    })
    return counts
  }, [filteredInvoices])

  const statusPcts = useMemo(() => {
    const total = filteredInvoices.length
    if (total === 0) return { paid: 0, unpaid: 0, overdue: 0 }
    return {
      paid: (statusCounts.paid / total) * 100,
      unpaid: (statusCounts.unpaid / total) * 100,
      overdue: (statusCounts.overdue / total) * 100,
    }
  }, [filteredInvoices, statusCounts])

  // Tax Breakdown
  const taxTotals = useMemo(() => {
    const totals = { cgst: 0, sgst: 0, igst: 0, total: 0 }
    filteredInvoices.forEach((inv) => {
      totals.cgst += inv.gstBreakdown?.cgst || 0
      totals.sgst += inv.gstBreakdown?.sgst || 0
      totals.igst += inv.gstBreakdown?.igst || 0
      totals.total += inv.gstBreakdown?.total || 0
    })
    return totals
  }, [filteredInvoices])

  // Compute display range formatted exactly like a premium date range picker
  const dateRangeDisplay = useMemo(() => {
    if (reportType === "monthly") {
      const [year, month] = selectedMonth.split("-").map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)

      const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      return `${startStr} – ${endStr}`
    } else {
      return `FY ${selectedFY}-${String(selectedFY + 1).slice(-2)}`
    }
  }, [reportType, selectedMonth, selectedFY])

  // Sparkline data arrays
  const salesSparklineData = useMemo(() => {
    const data = reportType === "monthly" ? monthlyData : financialYearData
    return data.map((item) => item.sales)
  }, [reportType, monthlyData, financialYearData])

  const invoicesSparklineData = useMemo(() => {
    const data = reportType === "monthly" ? monthlyData : financialYearData
    return data.map((item) => item.invoices)
  }, [reportType, monthlyData, financialYearData])

  const avgSalesSparklineData = useMemo(() => {
    const data = reportType === "monthly" ? monthlyData : financialYearData
    return data.map((item) => (item.invoices > 0 ? item.sales / item.invoices : 0))
  }, [reportType, monthlyData, financialYearData])

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx")
      const filename =
        reportType === "monthly"
          ? `Monthly_Report_${selectedMonth}.xlsx`
          : `FY_Report_${selectedFY}-${String(selectedFY + 1).slice(-2)}.xlsx`

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
        reportType === "monthly" ? `Monthly_Chart_${selectedMonth}.png` : `FY_Chart_${selectedFY}-${String(selectedFY + 1).slice(-2)}.png`

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

  const selectClasses = "w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 appearance-none transition-all shadow-sm"

  return (
    <div className="pt-20 lg:pt-0 relative overflow-hidden">
      {/* SaaS Premium Ambient Glow Backdrop */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/[0.03] dark:bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-1/4 w-[600px] h-[600px] bg-blue-500/[0.03] dark:bg-blue-500/[0.015] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ PAGE HEADER ═══ */}
        <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">Business insights and reports</p>
          </div>
        </motion.div>

        {/* ═══ CONTROLS ═══ */}
        <motion.div variants={itemVariants}>
          {/* Mobile Layout (2x2 Grid + Filter Card + Export Card) */}
          <div className="block md:hidden space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm" className="bg-white/40 dark:bg-[#121214]/40 border border-gray-150/50 dark:border-white/[0.03] backdrop-blur-md shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-505 uppercase tracking-wider block">Report Type</label>
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

              <Card padding="sm" className="bg-white/40 dark:bg-[#121214]/40 border border-gray-150/50 dark:border-white/[0.03] backdrop-blur-md shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider block">
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
                              FY {fy}-{String(fy + 1).slice(-2)}
                            </option>
                          ))
                        ) : (
                          <option value={selectedFY}>
                            FY {selectedFY}-{String(selectedFY + 1).slice(-2)}
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
              <Card padding="sm" className="bg-white/40 dark:bg-[#121214]/40 border border-gray-150/50 dark:border-white/[0.03] backdrop-blur-md shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">View Type</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewType("chart")}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${viewType === "chart" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-[#1A1A1D] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#212124]"
                        }`}
                    >
                      Chart
                    </button>
                    <button
                      onClick={() => setViewType("table")}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${viewType === "table" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-[#1A1A1D] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#212124]"
                        }`}
                    >
                      Table
                    </button>
                  </div>
                </div>
              </Card>

              <Card padding="sm" className="relative bg-white/40 dark:bg-[#121214]/40 border border-gray-150/50 dark:border-white/[0.03] backdrop-blur-md shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-505 uppercase tracking-wider block">Filters</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                      className={`w-full inline-flex items-center justify-center gap-2 font-semibold rounded-lg border border-gray-200 dark:border-white/[0.04] px-3 py-1.5 text-xs shadow-sm transition-all h-[32px] ${statusFilter !== "all" || clientFilter !== "all"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                        : "bg-white/60 dark:bg-[#1A1A1D]/60 text-gray-700 dark:text-[#8B8B96] hover:bg-gray-50 dark:hover:bg-[#252529]"
                        }`}
                    >
                      <SlidersHorizontal className="w-3 h-3 text-gray-400" />
                      <span>
                        {statusFilter !== "all" || clientFilter !== "all" ? "Active" : "Configure"}
                      </span>
                    </button>
                    {showFilterPanel && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowFilterPanel(false)} />
                        <div className="absolute right-0 mt-2 z-30 w-[260px] bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-xl p-4 space-y-4 text-left">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-505 uppercase tracking-wider block">Invoice Status</label>
                            <div className="relative">
                              <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={`${selectClasses} text-xs py-1.5 pr-8`}
                              >
                                <option value="all">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="overdue">Overdue</option>
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-550 uppercase tracking-wider block">Client / Customer</label>
                            <div className="relative">
                              <select
                                value={clientFilter}
                                onChange={(e) => setClientFilter(e.target.value)}
                                className={`${selectClasses} text-xs py-1.5 pr-8`}
                              >
                                <option value="all">All Clients</option>
                                {uniqueClients.map((client) => (
                                  <option key={client} value={client}>
                                    {client}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          {(statusFilter !== "all" || clientFilter !== "all") && (
                            <button
                              onClick={() => {
                                setStatusFilter("all")
                                setClientFilter("all")
                                setShowFilterPanel(false)
                              }}
                              className="w-full text-center py-1.5 text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-450 font-semibold border border-rose-250 dark:border-rose-500/10 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 transition-all"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <Card padding="sm" className="bg-white/40 dark:bg-[#121214]/40 border border-gray-150/50 dark:border-white/[0.03] backdrop-blur-md shadow-sm">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider block">Export Reports</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-xs py-2 px-2 shadow-sm transition-all duration-300 bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 hover:border-blue-500/30"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  {viewType === "chart" && (
                    <button
                      onClick={handleExportChart}
                      className="flex-1 inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-xs py-2 px-2 shadow-sm transition-all duration-300 bg-violet-50/70 hover:bg-violet-100/90 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-500/20 hover:border-violet-500/30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Desktop Layout — Premium Glassmorphic inline toolbar */}
          <div className="hidden md:flex items-end justify-between bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md border border-gray-150/65 dark:border-white/[0.04] p-4 rounded-2xl shadow-sm transition-all duration-300">
            <div className="flex items-end gap-5">
              {/* Segmented report type tabs (like 12m, 30d in reference) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-505 uppercase tracking-wider block">Report Type</label>
                <div className="flex gap-1 bg-gray-50/50 dark:bg-[#1A1A1D]/50 rounded-xl p-0.5 border border-gray-200/40 dark:border-white/[0.02] h-[40px] items-center">
                  <button
                    onClick={() => setReportType("monthly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportType === "monthly" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-550 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setReportType("financial-year")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportType === "financial-year" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-555 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-300"
                      }`}
                  >
                    Financial Year
                  </button>
                </div>
              </div>

              {/* Date Range Selector showing formatted range with calendar icon */}
              <div className="space-y-1.5 min-w-[240px]">
                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider block">
                  {reportType === "monthly" ? "Selected Period" : "Selected Financial Year"}
                </label>
                <div className="relative h-[40px]">
                  {/* Visual Date Box with Calendar icon */}
                  <div className="absolute inset-0 flex items-center justify-between px-3.5 bg-white/60 dark:bg-[#1A1A1D]/60 border border-gray-200 dark:border-white/[0.04] rounded-xl text-xs text-gray-800 dark:text-gray-200 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-505" />
                      <span className="font-semibold">{dateRangeDisplay}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  {/* Transparent dropdown input for functionality */}
                  {reportType === "monthly" ? (
                    <select
                      key="monthly-select"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
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
                      key="fy-select"
                      value={selectedFY}
                      onChange={(e) => setSelectedFY(Number.parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    >
                      {availableFYs.length > 0 ? (
                        availableFYs.map((fy) => (
                          <option key={fy} value={fy}>
                            FY {fy}-{String(fy + 1).slice(-2)}
                          </option>
                        ))
                      ) : (
                        <option value={selectedFY}>
                          FY {selectedFY}-{String(selectedFY + 1).slice(-2)}
                        </option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* View switcher tabs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-550 uppercase tracking-wider block">View Type</label>
                <div className="flex gap-1 bg-gray-55/50 dark:bg-[#1A1A1D]/50 rounded-xl p-0.5 border border-gray-200/40 dark:border-white/[0.02] h-[40px] items-center">
                  <button
                    onClick={() => setViewType("chart")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewType === "chart" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setViewType("table")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewType === "table" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Premium grey Filters button with interactive dropdown panel */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl border px-4 h-[40px] text-xs shadow-sm hover:shadow-md transition-all ${statusFilter !== "all" || clientFilter !== "all"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                    : "bg-white/60 dark:bg-[#1A1A1D]/60 text-gray-700 dark:text-[#8B8B96] hover:bg-gray-50 dark:hover:bg-[#252529] border-gray-200 dark:border-white/[0.04]"
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-405 dark:text-gray-550" />
                  <span>Filters</span>
                  {(statusFilter !== "all" || clientFilter !== "all") && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 border border-white dark:border-[#161618]" />
                  )}
                </button>
                {showFilterPanel && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowFilterPanel(false)} />
                    <div className="absolute right-0 mt-2 z-35 w-72 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-2xl shadow-xl p-4 space-y-4 text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/[0.03]">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">Active Filters</h4>
                        {(statusFilter !== "all" || clientFilter !== "all") && (
                          <button
                            onClick={() => {
                              setStatusFilter("all")
                              setClientFilter("all")
                              setShowFilterPanel(false)
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-450 dark:text-gray-505 uppercase tracking-wider block">Invoice Status</label>
                        <div className="relative">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`${selectClasses} text-xs py-2 pr-8`}
                          >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="overdue">Overdue</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-450 dark:text-gray-550 uppercase tracking-wider block">Client / Customer</label>
                        <div className="relative">
                          <select
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            className={`${selectClasses} text-xs py-2 pr-8`}
                          >
                            <option value="all">All Clients</option>
                            {uniqueClients.map((client) => (
                              <option key={client} value={client}>
                                {client}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-xs h-[40px] px-4 shadow-sm transition-all duration-300 bg-blue-50/70 hover:bg-blue-100/90 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 hover:border-blue-500/30"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              {viewType === "chart" && (
                <button
                  onClick={handleExportChart}
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-xs h-[40px] px-4 shadow-sm transition-all duration-300 bg-violet-50/70 hover:bg-violet-100/90 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-500/20 hover:border-violet-500/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ SUMMARY STATS ═══ */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">

            {/* Total Revenue Card */}
            <div className="relative overflow-hidden group rounded-2xl border-y border-r border-gray-150/70 dark:border-white/[0.04] border-l-[3.5px] border-l-blue-500 bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-5 shadow-sm hover:shadow-lg hover:shadow-blue-600/20[0.02] hover:border-y-blue-500/20 hover:border-r-blue-500/20 transition-all duration-300 flex items-center justify-between">
              {/* Radial gradient background hover glow */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/[0.06] dark:bg-blue-500/[0.04] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              {/* Premium grey Options icon on top right */}
              <div
                onClick={() => setActiveCardMenu(activeCardMenu === "revenue" ? null : "revenue")}
                className="absolute right-4 top-4 z-20 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </div>

              {activeCardMenu === "revenue" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setActiveCardMenu(null)} />
                  <div className="absolute right-4 top-12 z-30 w-40 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-lg py-1 text-left">
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        setViewType("table")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] font-medium"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        handleExportExcel()
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Export data
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        toast.success("Card Refreshed", "Today's revenue data has been updated")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Refresh card
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-405 dark:text-gray-500 uppercase tracking-wider">Today's revenue</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white ez-number tracking-tight">
                    {formatCurrency(getTotalSales())}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${salesPercentageChange > 0
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : salesPercentageChange < 0
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-gray-100 dark:bg-white/[0.04] text-gray-500"
                      }`}>
                      {salesPercentageChange > 0 && <ArrowUpRight className="w-2.5 h-2.5" />}
                      {salesPercentageChange < 0 && <ArrowDownRight className="w-2.5 h-2.5" />}
                      {salesPercentageChange > 0 ? `+` : ""}{salesPercentageChange.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-medium text-gray-405 dark:text-gray-500">last period</span>
                  </div>
                </div>
              </div>
              <div className="h-10 flex items-center relative z-10 pl-2">
                <Sparkline data={salesSparklineData} color="#2563eb" gradientId="sparkline-sales" />
              </div>
            </div>

            {/* Total Invoices Card */}
            <div className="relative overflow-hidden group rounded-2xl border-y border-r border-gray-150/70 dark:border-white/[0.04] border-l-[3.5px] border-l-indigo-500 bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/[0.02] hover:border-y-indigo-500/20 hover:border-r-indigo-500/20 transition-all duration-300 flex items-center justify-between">
              {/* Radial gradient background hover glow */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/[0.06] dark:bg-indigo-500/[0.04] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              {/* Premium grey Options icon on top right */}
              <div
                onClick={() => setActiveCardMenu(activeCardMenu === "invoices" ? null : "invoices")}
                className="absolute right-4 top-4 z-20 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </div>

              {activeCardMenu === "invoices" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setActiveCardMenu(null)} />
                  <div className="absolute right-4 top-12 z-30 w-40 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-lg py-1 text-left">
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        setViewType("table")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        handleExportExcel()
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Export data
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        toast.success("Card Refreshed", "Today's invoice count has been updated")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Refresh card
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-405 dark:text-gray-550 uppercase tracking-wider">Today's invoices</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white ez-number tracking-tight">
                    {getTotalInvoices()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${invoicesPercentageChange > 0
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : invoicesPercentageChange < 0
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-gray-100 dark:bg-white/[0.04] text-gray-500"
                      }`}>
                      {invoicesPercentageChange > 0 && <ArrowUpRight className="w-2.5 h-2.5" />}
                      {invoicesPercentageChange < 0 && <ArrowDownRight className="w-2.5 h-2.5" />}
                      {invoicesPercentageChange > 0 ? `+` : ""}{invoicesPercentageChange.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-medium text-gray-405 dark:text-gray-500">last period</span>
                  </div>
                </div>
              </div>
              <div className="h-10 flex items-center relative z-10 pl-2">
                <Sparkline data={invoicesSparklineData} color="#6366f1" gradientId="sparkline-invoices" />
              </div>
            </div>

            {/* Average Sales Card */}
            <div className="relative overflow-hidden group rounded-2xl border-y border-r border-gray-150/70 dark:border-white/[0.04] border-l-[3.5px] border-l-violet-500 bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-5 shadow-sm hover:shadow-lg hover:shadow-violet-500/[0.02] hover:border-y-violet-500/20 hover:border-r-violet-500/20 transition-all duration-300 flex items-center justify-between">
              {/* Radial gradient background hover glow */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-violet-500/[0.06] dark:bg-violet-500/[0.04] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              {/* Premium grey Options icon on top right */}
              <div
                onClick={() => setActiveCardMenu(activeCardMenu === "avg" ? null : "avg")}
                className="absolute right-4 top-4 z-20 text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </div>

              {activeCardMenu === "avg" && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setActiveCardMenu(null)} />
                  <div className="absolute right-4 top-12 z-30 w-40 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-lg py-1 text-left">
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        setViewType("table")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        handleExportExcel()
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Export data
                    </button>
                    <button
                      onClick={() => {
                        setActiveCardMenu(null)
                        toast.success("Card Refreshed", "Average invoice value has been updated")
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-750 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-white/[0.04] font-medium"
                    >
                      Refresh card
                    </button>
                  </div>
                </>
              )}

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-405 dark:text-gray-550 uppercase tracking-wider">Avg. invoice value</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white ez-number tracking-tight">
                    {formatCurrency(getAverageSales())}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${avgSalesPercentageChange > 0
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : avgSalesPercentageChange < 0
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-gray-100 dark:bg-white/[0.04] text-gray-500"
                      }`}>
                      {avgSalesPercentageChange > 0 && <ArrowUpRight className="w-2.5 h-2.5" />}
                      {avgSalesPercentageChange < 0 && <ArrowDownRight className="w-2.5 h-2.5" />}
                      {avgSalesPercentageChange > 0 ? `+` : ""}{avgSalesPercentageChange.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-medium text-gray-405 dark:text-gray-550">last period</span>
                  </div>
                </div>
              </div>
              <div className="h-10 flex items-center relative z-10 pl-2">
                <Sparkline data={avgSalesSparklineData} color="#8b5cf6" gradientId="sparkline-avg" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ CHART / TABLE ═══ */}
        <motion.div variants={itemVariants}>
          {viewType === "chart" ? (
            <Card className="bg-white/45 dark:bg-[#121214]/45 border border-gray-150/65 dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-6 shadow-sm relative overflow-hidden">
              {/* Ambient card glow */}
              <div className="absolute -left-12 -top-12 w-32 h-32 bg-purple-500/[0.02] dark:bg-purple-500/[0.01] rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start flex-col sm:flex-row gap-4 mb-4 md:mb-6 relative z-10">
                <div>
                  <span className="text-[11px] font-semibold text-gray-405 dark:text-gray-500 uppercase tracking-wider block mb-1">
                    {reportType === "monthly" ? "Daily Breakdown" : "Monthly Breakdown"}
                  </span>
                  <h3 className="text-lg md:text-xl font-bold tracking-heading text-gray-900 dark:text-white mb-1">
                    {reportType === "monthly"
                      ? `${activeMetric === "sales" ? "Sales" : "Invoices"} — ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                      : `${activeMetric === "sales" ? "Sales" : "Invoices"} — FY ${selectedFY}-${String(selectedFY + 1).slice(-2)}`}
                  </h3>
                  <p className="text-gray-550 dark:text-gray-400 text-sm">
                    {reportType === "monthly"
                      ? "Daily breakdown of sales and invoice count"
                      : "Monthly breakdown of sales and invoice count for the financial year"}
                  </p>
                </div>

                {/* Segmented switcher tabs for Revenue vs Invoices */}
                <div className="flex gap-1 bg-gray-50/50 dark:bg-[#1A1A1D]/50 rounded-xl p-0.5 border border-gray-200/40 dark:border-white/[0.02] items-center">
                  <button
                    onClick={() => setActiveMetric("sales")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMetric === "sales" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setActiveMetric("invoices")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMetric === "invoices" ? "bg-white dark:bg-[#252529] text-gray-900 dark:text-white shadow-sm" : "text-gray-550 dark:text-gray-400 hover:text-gray-750 dark:hover:text-gray-300"
                      }`}
                  >
                    Invoices
                  </button>
                </div>
              </div>

              {reportType === "monthly" ? (
                <MonthlyChart data={monthlyData} metric={activeMetric} />
              ) : (
                <FinancialYearChart data={financialYearData} metric={activeMetric} />
              )}
            </Card>
          ) : (
            <Card className="bg-white/45 dark:bg-[#121214]/45 border border-gray-150/65 dark:border-white/[0.04] backdrop-blur-md rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="mb-4 md:mb-6">
                <span className="text-[11px] font-semibold text-gray-405 dark:text-gray-500 uppercase tracking-wider block mb-2">
                  {reportType === "monthly" ? "Daily Data" : "Monthly Data"}
                </span>
                <h3 className="text-lg md:text-xl font-bold tracking-heading text-gray-900 dark:text-white">
                  {reportType === "monthly"
                    ? `Sales Table — ${new Date(selectedMonth + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" })}`
                    : `Sales Table — FY ${selectedFY}-${String(selectedFY + 1).slice(-2)}`}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.03]">
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
                        <tr key={index} className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/20 transition-colors">
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
                        <tr key={index} className="border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/20 transition-colors">
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
                    <tr className="border-t-2 border-gray-200 dark:border-white/[0.04] bg-gray-50/50 dark:bg-[#141416]">
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

        {/* ═══ ADDITIONAL INSIGHTS ═══ */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Customers / Invoices */}
          <Card className="lg:col-span-2 relative overflow-hidden group rounded-2xl border border-gray-150/60 dark:border-white/[0.04] bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-6 shadow-sm hover:shadow-lg hover:border-blue-500/10 transition-all duration-300">
            {/* Radial hover glow */}
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-blue-500/[0.05] dark:bg-blue-500/[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Performance</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Top Sales Invoices</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.03] text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">
                      <th className="pb-2.5">Invoice ID</th>
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5 text-right">Amount</th>
                      <th className="pb-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {topInvoices.length > 0 ? (
                      topInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1C1C1F]/20 transition-colors">
                          <td className="py-2.5 text-gray-900 dark:text-white font-medium">{inv.invoiceNumber}</td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400">{inv.customerName}</td>
                          <td className="py-2.5 text-gray-500 dark:text-gray-400">{formatDate(new Date(inv.date))}</td>
                          <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.total)}</td>
                          <td className="py-2.5 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide capitalize ${inv.status === "paid"
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : inv.status === "overdue"
                                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">No invoices found for this period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* GST Breakdown & Invoice Status Distribution */}
          <div className="space-y-6">
            {/* Status Distribution */}
            <Card className="relative overflow-hidden group rounded-2xl border border-gray-150/60 dark:border-white/[0.04] bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-6 shadow-sm hover:shadow-lg hover:border-indigo-500/10 transition-all duration-300">
              {/* Radial hover glow */}
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-indigo-500/[0.06] dark:bg-indigo-500/[0.04] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Invoice Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Paid", count: statusCounts.paid, pct: statusPcts.paid, color: "bg-gradient-to-r from-blue-500 to-blue-600", textColor: "text-blue-500" },
                    { label: "Unpaid", count: statusCounts.unpaid, pct: statusPcts.unpaid, color: "bg-gradient-to-r from-amber-400 to-orange-500", textColor: "text-amber-500" },
                    { label: "Overdue", count: statusCounts.overdue, pct: statusPcts.overdue, color: "bg-gradient-to-r from-rose-450 to-red-600", textColor: "text-rose-500" }
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-605 dark:text-gray-400">{item.label}</span>
                        <span className="text-gray-550 dark:text-gray-400">{item.count} ({item.pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* GST Tax liability summary */}
            <Card className="relative overflow-hidden group rounded-2xl border border-gray-150/60 dark:border-white/[0.04] bg-white/45 dark:bg-[#121214]/45 backdrop-blur-md p-6 shadow-sm hover:shadow-lg hover:border-blue-500/10 transition-all duration-300">
              {/* Radial hover glow */}
              <div className="absolute -right-12 -top-12 w-36 h-36 bg-blue-500/[0.06] dark:bg-blue-500/[0.04] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

              <div className="relative z-10">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">GST Tax Liability Summary</h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">CGST (Central Tax)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(taxTotals.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">SGST (State Tax)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(taxTotals.sgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">IGST (Integrated Tax)</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(taxTotals.igst)}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-white/[0.04] pt-3 flex justify-between font-bold text-sm">
                    <span className="text-gray-900 dark:text-white">Total GST Collected</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(taxTotals.total)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Analytics
