"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import SummaryCards from "./SummaryCards"
import InvoiceTable from "./InvoiceTable"
import InvoicePreview from "../Invoice/InvoicePreview"
import type { Invoice } from "../../types"
import { Plus, TrendingUp, FileText, AlertCircle, RefreshCw } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const Dashboard: React.FC = () => {
  const { invoices, loading, error, refreshInvoices } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    navigate(`/edit-invoice/${invoice.id}`)
  }

  const closePreview = () => {
    setSelectedInvoice(null)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshInvoices()
    setRefreshing(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
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

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading your invoices...</div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <Card className="border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Error Loading Invoices</h3>
              <p className="text-red-300 text-sm mb-3">{error}</p>
              <Button onClick={refreshInvoices} size="sm" className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <motion.div className="space-y-6 md:space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 rounded-xl md:rounded-2xl p-4 md:p-8 text-white"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <motion.h1
              className="text-2xl md:text-4xl font-bold mb-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Welcome back, {user?.fullName?.split(" ")[0] || "User"}! 👋
            </motion.h1>
            <motion.p
              className="text-emerald-100 text-base md:text-lg"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Here's your business overview for today
            </motion.p>
          </div>
          <motion.div
            className="flex items-center gap-2 md:gap-3 w-full md:w-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Button
              onClick={() => navigate("/create-invoice")}
              icon={Plus}
              size="sm"
              className="flex-1 md:flex-none p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="md:inline">Create Invoice</span>
            </Button>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh invoices"
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-white ${refreshing ? "animate-spin" : ""}`} />
            </motion.button>
          </motion.div>
        </div>

        {/* Floating Elements - Now visible on mobile too */}
        <motion.div
          className="absolute top-2 right-4 md:top-4 md:right-20 w-8 h-8 md:w-16 md:h-16 bg-white/10 rounded-full"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-2 left-4 md:bottom-4 md:left-20 w-4 h-4 md:w-8 md:h-8 bg-white/20 rounded-full"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 right-8 md:right-32 w-3 h-3 md:w-6 md:h-6 bg-white/15 rounded-full"
          animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-1/3 left-8 md:left-16 w-5 h-5 md:w-10 md:h-10 bg-white/8 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1.5 }}
        />
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants}>
        <SummaryCards />
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" variants={itemVariants}>
        <motion.div
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/create-invoice")}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-lg">
              <Plus className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">Create Invoice</h3>
              <p className="text-blue-100 text-sm">Generate new invoice</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/invoices")}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">View All Invoices</h3>
              <p className="text-purple-100 text-sm">Manage your invoices</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 md:p-6 text-white cursor-pointer hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/profile")}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">Business Profile</h3>
              <p className="text-orange-100 text-sm">Update your details</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Invoices */}
      <motion.div className="space-y-4 md:space-y-6" variants={itemVariants}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Recent Invoices</h2>
            <p className="text-gray-400">Your latest 5 invoices</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {filters.map((filter) => (
              <motion.button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === filter.value
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter.label}
              </motion.button>
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
            <Button onClick={() => navigate("/invoices")} variant="secondary" className="bg-gray-700 hover:bg-gray-600">
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
