"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import { formatCurrency } from "../../utils/calculations"
import InvoiceTable from "./InvoiceTable"
import InvoicePreview from "../Invoice/InvoicePreview"
import type { Invoice } from "../../types"
import {
  Plus, TrendingUp, FileText, AlertCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, IndianRupee, Clock,
  ShoppingBag, BarChart3, ArrowRight,
} from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

/* ─── Mini Sparkline SVG ─── */
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  const areaPoints = [...points, `${w},${height}`, `0,${height}`]
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill={`url(#spark-fill-${color})`} />
      <polyline points={points.join(' ')} className="ez-sparkline" stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Animated Counter ─── */
const AnimatedNumber: React.FC<{
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}> = ({ value, format, duration = 1200, className }) => {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  const formatter = useCallback(
    (n: number) => (format ? format(n) : n.toLocaleString("en-IN")),
    [format],
  )

  useEffect(() => {
    startRef.current = null
    const target = value
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(eased * target)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setDisplay(target)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className}>{formatter(display)}</span>
}

const Dashboard: React.FC = () => {
  const { invoices, loading, error, refreshInvoices, getDashboardSummary } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const summary = getDashboardSummary()

  const revenueSparkline = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const last8 = sorted.slice(-8)
    if (last8.length < 2) return [0, 1, 2, 3, 4, 5, 6, 7]
    let running = 0
    return last8.map(inv => { running += inv.total; return running })
  }, [invoices])

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter === "all") return true
    return invoice.status === statusFilter
  })
  const recentInvoices = filteredInvoices.slice(0, 5)

  const filters = [
    { value: "all", label: "All" },
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
    { value: "overdue", label: "Overdue" },
  ]

  const handleViewInvoice = (invoice: Invoice) => setSelectedInvoice(invoice)
  const handleEditInvoice = (invoice: Invoice) => navigate(`/dashboard/edit-invoice/${invoice.id}`)
  const closePreview = () => setSelectedInvoice(null)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshInvoices()
    setRefreshing(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  }
  const itemVariants = {
    hidden: { y: 16, opacity: 0, scale: 0.99 },
    visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  const paidCount = invoices.filter(i => i.status === 'paid').length
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length
  const paidPercent = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-20 lg:pt-0">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-[#71717A] text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 pt-20 lg:pt-0">
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-1 text-sm">Error Loading Data</h3>
              <p className="text-gray-500 dark:text-[#71717A] text-sm mb-3">{error}</p>
              <Button onClick={refreshInvoices} variant="danger" size="sm">Try Again</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6 pt-20 lg:pt-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ═══ HEADER ═══ */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {user?.fullName?.split(" ")[0] || "User"}
            </span>{" "}
            👋
          </h1>
          <p className="text-gray-500 dark:text-[#71717A] text-sm mt-1">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate("/dashboard/create-invoice")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-blue-600/20 flex-1 md:flex-none"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-[#0d0d10] border border-gray-200/60 dark:border-white/[0.06] text-gray-500 dark:text-[#71717A] hover:bg-gray-50 dark:hover:bg-[#141418] hover:border-gray-300 dark:hover:border-white/[0.1] active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </motion.div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

        {/* Revenue Hero Card — spans 2 cols */}
        <motion.div variants={itemVariants} className="col-span-2">
          <div className="ez-hero-card p-5 md:p-6 h-full">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                    <TrendingUp className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Total Revenue</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  summary.revenueChange >= 0
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20'
                    : 'bg-red-500/20 text-red-300 border border-red-500/20'
                }`}>
                  {summary.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(summary.revenueChange).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl md:text-4xl font-bold tracking-tight text-white ez-number">
                    <AnimatedNumber value={summary.totalRevenue} format={(n) => formatCurrency(Math.round(n))} />
                  </p>
                  <p className="text-[#71717A] text-xs mt-1.5">
                    {invoices.length} total invoices · {paidCount} paid
                  </p>
                </div>
                <div className="hidden md:block opacity-70">
                  <Sparkline data={revenueSparkline} color="#60a5fa" height={48} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purchase */}
        <motion.div variants={itemVariants}>
          <div className="ez-card ez-bento-violet h-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-500/10 dark:bg-violet-500/10">
                <ShoppingBag className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-[#71717A]">Purchase</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.totalPurchase} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <p className="text-xs text-gray-500 dark:text-[#52525b] mt-2">
              {Math.abs(summary.purchaseChange).toFixed(1)}% vs last month
            </p>
          </div>
        </motion.div>

        {/* Pending */}
        <motion.div variants={itemVariants}>
          <div className="ez-card ez-bento-amber h-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-[#71717A]">Pending</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.pendingAmount} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <p className="text-xs text-gray-500 dark:text-[#52525b] mt-2">
              {unpaidCount} unpaid invoice{unpaidCount !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Paid — with progress bar */}
        <motion.div variants={itemVariants}>
          <div className="ez-card ez-bento-blue h-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <IndianRupee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-[#71717A]">Paid</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.paidAmount} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1 bg-gray-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${paidPercent}%` }}
                  transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">{paidPercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* Analytics */}
        <motion.div variants={itemVariants}>
          <div className="ez-card ez-bento-blue h-full p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-[#71717A]">Analytics</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={invoices.length} format={(n) => Math.round(n).toString()} />
            </p>
            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 mt-3 hover:gap-2 transition-all duration-200 group"
            >
              View insights
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>

        {/* Quick Links Row — spans 2 cols */}
        <motion.div variants={itemVariants} className="col-span-2">
          <div className="ez-card h-full">
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/[0.04]">
              <button
                onClick={() => navigate("/dashboard/create-invoice")}
                className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-l-xl transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/15 transition-colors">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-[#A1A1AA]">New Invoice</span>
              </button>
              <button
                onClick={() => navigate("/dashboard/invoices")}
                className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/15 transition-colors">
                  <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-[#A1A1AA]">All Invoices</span>
              </button>
              <button
                onClick={() => navigate("/dashboard/gst-reports")}
                className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-r-xl transition-colors group"
              >
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/15 transition-colors">
                  <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-[#A1A1AA]">GST Reports</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ RECENT INVOICES ═══ */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            {/* Landing page-style section label */}
            <div className="inline-flex items-center gap-1.5 mb-1">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Recent</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Invoices</h2>
          </div>
          {/* Filter tabs */}
          <div className="flex gap-0.5 bg-gray-100 dark:bg-[#0d0d10] border border-gray-200/60 dark:border-white/[0.05] rounded-xl p-1">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === filter.value
                    ? "bg-white dark:bg-[#141418] text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-white/[0.06]"
                    : "text-gray-500 dark:text-[#52525b] hover:text-gray-700 dark:hover:text-[#A1A1AA]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <InvoiceTable
          invoices={recentInvoices}
          onViewInvoice={handleViewInvoice}
          onEditInvoice={handleEditInvoice}
          statusFilter={statusFilter}
        />

        {recentInvoices.length > 0 && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => navigate("/dashboard/invoices")}
              variant="secondary"
              className="px-8"
            >
              View All Invoices ({invoices.length})
            </Button>
          </motion.div>
        )}
      </motion.div>

      {selectedInvoice && <InvoicePreview invoice={selectedInvoice} onClose={closePreview} />}
    </motion.div>
  )
}

export default Dashboard
