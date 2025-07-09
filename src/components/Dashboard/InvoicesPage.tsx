"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import InvoiceTable from "./InvoiceTable"
import InvoicePreview from "../Invoice/InvoicePreview"
import type { Invoice } from "../../types"
import { FileText, Plus, Search, Filter } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const InvoicesPage: React.FC = () => {
  const { invoices } = useApp()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesSearch =
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filters = [
    { value: "all", label: "All Invoices", count: invoices.length },
    { value: "paid", label: "Paid", count: invoices.filter((i) => i.status === "paid").length },
    { value: "unpaid", label: "Unpaid", count: invoices.filter((i) => i.status === "unpaid").length },
    { value: "overdue", label: "Overdue", count: invoices.filter((i) => i.status === "overdue").length },
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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  }

  return (
    <motion.div className="space-y-8 pt-24 md:pt-0" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
        <div className="flex-1">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">All Invoices</h1>
              <p className="text-gray-400 text-sm md:text-lg">Manage and track all your invoices</p>
            </div>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-full md:w-auto"
        >
          <Button
            onClick={() => navigate("/create-invoice")}
            icon={Plus}
            size="md"
            className="w-full md:w-auto shadow-lg"
          >
            <span className="md:hidden">Create Invoice</span>
            <span className="hidden md:inline">Create New Invoice</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards - Mobile: 2x2 Grid */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6" variants={itemVariants}>
        {filters.map((filter, index) => (
          <motion.div
            key={filter.value}
            className="cursor-pointer transition-all relative"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(filter.value as any)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:bg-gray-750 relative overflow-hidden">
              {/* Selected state overlay */}
              {statusFilter === filter.value && (
                <motion.div
                  className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              <div className="text-center relative z-10">
                <div
                  className={`text-2xl md:text-3xl font-bold mb-1 md:mb-2 ${
                    filter.value === "paid"
                      ? "text-green-500"
                      : filter.value === "unpaid"
                        ? "text-yellow-500"
                        : filter.value === "overdue"
                          ? "text-red-500"
                          : "text-emerald-500"
                  }`}
                >
                  {filter.count}
                </div>
                <div className="text-gray-300 font-medium text-xs md:text-base break-words px-1">{filter.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by customer name or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <Filter className="w-5 h-5 text-gray-400" />
            </div>

            {/* Filter Buttons - 2x2 Grid on Mobile, Single Row on Desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* First Row on Mobile: All Invoices, Paid */}
              <motion.button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                All Invoices ({filters[0].count})
              </motion.button>

              <motion.button
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "paid"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Paid ({filters[1].count})
              </motion.button>

              {/* Second Row on Mobile: Unpaid, Overdue */}
              <motion.button
                onClick={() => setStatusFilter("unpaid")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "unpaid"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Unpaid ({filters[2].count})
              </motion.button>

              <motion.button
                onClick={() => setStatusFilter("overdue")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "overdue"
                    ? "bg-emerald-600 text-white shadow-lg"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Overdue ({filters[3].count})
              </motion.button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Results Summary */}
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <div className="text-gray-400">
          Showing {filteredInvoices.length} of {invoices.length} invoices
          {searchTerm && (
            <span className="ml-2">
              for "<span className="text-white">{searchTerm}</span>"
            </span>
          )}
        </div>

        {searchTerm && (
          <motion.button
            onClick={() => setSearchTerm("")}
            className="text-emerald-500 hover:text-emerald-400 text-sm"
            whileHover={{ scale: 1.05 }}
          >
            Clear search
          </motion.button>
        )}
      </motion.div>

      {/* Invoices Table */}
      <motion.div variants={itemVariants}>
        <InvoiceTable
          invoices={filteredInvoices}
          onViewInvoice={handleViewInvoice}
          onEditInvoice={handleEditInvoice}
          statusFilter={statusFilter}
        />
      </motion.div>

      {selectedInvoice && <InvoicePreview invoice={selectedInvoice} onClose={closePreview} />}
    </motion.div>
  )
}

export default InvoicesPage
