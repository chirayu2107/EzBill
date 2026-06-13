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
import { Plus, TrendingUp, FileText, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, IndianRupee, Clock, ShoppingBag, BarChart3, ArrowRight } from "lucide-react"
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
      <polyline points={points.join(' ')} className="ez-sparkline" stroke={color} />
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
      // easeOutExpo
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

  // Generate sparkline data from recent invoices
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
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  }
  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  const paidCount = invoices.filter(i => i.status === 'paid').length
  const unpaidCount = invoices.filter(i => i.status === 'unpaid').length
  const paidPercent = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-8 pt-20 lg:pt-0">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="ez-loading-bar" />
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading your invoices...</p>
          </div>
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
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{error}</p>
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
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, {user?.fullName?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate("/dashboard/create-invoice")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/30 dark:bg-[#1C1C1F] backdrop-blur-sm border border-gray-200/40 dark:border-white/[0.07] text-emerald-600 dark:text-emerald-400 hover:bg-white/50 dark:hover:bg-[#232326] hover:backdrop-blur-lg hover:border-gray-200/60 dark:hover:border-white/[0.12] active:bg-white/70 dark:active:bg-[#2B2B2F] active:scale-[0.97] active:border-gray-300/60 dark:active:border-white/[0.15] transition-all duration-200 flex-1 md:flex-none"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/30 dark:bg-[#1C1C1F] backdrop-blur-sm border border-gray-200/40 dark:border-white/[0.07] text-gray-600 dark:text-[#A0A0AB] hover:bg-white/50 dark:hover:bg-[#232326] hover:backdrop-blur-lg hover:border-gray-200/60 dark:hover:border-white/[0.12] active:bg-white/70 dark:active:bg-[#2B2B2F] active:scale-[0.97] active:border-gray-300/60 dark:active:border-white/[0.15] transition-all duration-200 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </motion.div>

      {/* ═══ BENTO GRID ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Revenue — Hero card (spans 2 cols on desktop) */}
        <motion.div variants={itemVariants} className="col-span-2">
          <div className="ez-hero-card p-5 md:p-6 h-full">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/10">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Total Revenue</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  summary.revenueChange >= 0 
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {summary.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(summary.revenueChange).toFixed(1)}%
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl md:text-4xl font-bold ez-number tracking-tight">
                    <AnimatedNumber value={summary.totalRevenue} format={(n) => formatCurrency(Math.round(n))} />
                  </p>
                  <p className="text-gray-400 text-xs mt-1.5">
                    {invoices.length} total invoices · {paidCount} paid
                  </p>
                </div>
                <div className="hidden md:block opacity-80">
                  <Sparkline data={revenueSparkline} color="#34d399" height={48} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purchase */}
        <motion.div variants={itemVariants}>
          <Card padding="md" className="h-full ez-bento-violet">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <ShoppingBag className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Purchase</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.totalPurchase} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {Math.abs(summary.purchaseChange).toFixed(1)}% vs last month
            </p>
          </Card>
        </motion.div>

        {/* Pending */}
        <motion.div variants={itemVariants}>
          <Card padding="md" className="h-full ez-bento-amber">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.pendingAmount} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {unpaidCount} unpaid invoice{unpaidCount !== 1 ? 's' : ''}
            </p>
          </Card>
        </motion.div>

        {/* Paid — with progress ring */}
        <motion.div variants={itemVariants}>
          <Card padding="md" className="h-full ez-bento-emerald">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Paid</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={summary.paidAmount} format={(n) => formatCurrency(Math.round(n))} />
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-200/60 dark:bg-[#232326] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${paidPercent}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{paidPercent}%</span>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions — spans 1 col */}
        <motion.div variants={itemVariants}>
          <Card padding="md" className="h-full ez-bento-blue">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Analytics</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white ez-number tracking-tight">
              <AnimatedNumber value={invoices.length} format={(n) => Math.round(n).toString()} />
            </p>
            <button
              onClick={() => navigate("/dashboard/analytics")}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 mt-2 hover:gap-2 transition-all"
            >
              View insights <ArrowRight className="w-3 h-3" />
            </button>
          </Card>
        </motion.div>

        {/* Quick Links row — spans 2 cols on mobile, 2 on desktop */}
        <motion.div variants={itemVariants} className="col-span-2">
          <Card padding="sm" className="h-full">
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/[0.07]">
              <button onClick={() => navigate("/dashboard/create-invoice")} className="flex flex-col items-center gap-1.5 py-3 hover:bg-gray-50 dark:hover:bg-[#232326] rounded-l-xl transition-colors">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Invoice</span>
              </button>
              <button onClick={() => navigate("/dashboard/invoices")} className="flex flex-col items-center gap-1.5 py-3 hover:bg-gray-50 dark:hover:bg-[#232326] transition-colors">
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                  <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">All Invoices</span>
              </button>
              <button onClick={() => navigate("/dashboard/gst-reports")} className="flex flex-col items-center gap-1.5 py-3 hover:bg-gray-50 dark:hover:bg-[#232326] rounded-r-xl transition-colors">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                  <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">GST Reports</span>
              </button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ═══ RECENT INVOICES ═══ */}
      <motion.div className="space-y-4" variants={itemVariants}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Your latest transactions</p>
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1C1C1F] rounded-lg p-0.5">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === filter.value
                    ? "bg-white dark:bg-[#232326] text-gray-900 dark:text-[#F0F0F3] shadow-sm"
                    : "text-gray-500 dark:text-[#62626B] hover:text-gray-700 dark:hover:text-[#9E9EA7]"
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
