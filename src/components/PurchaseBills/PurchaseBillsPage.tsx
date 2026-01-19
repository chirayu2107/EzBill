"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import PurchaseBillTable from "./PurchaseBillTable"
import PurchaseBillPreview from "./PurchaseBillPreview"
import type { PurchaseBill } from "../../types"
import { ShoppingBag, Plus, Search, Filter } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const PurchaseBillsPage: React.FC = () => {
  const { purchaseBills } = useApp()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null)

  const filteredBills = purchaseBills.filter((bill) => {
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter
    const matchesSearch =
      bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Calculate stats
  const totalBills = purchaseBills.length
  const paidBills = purchaseBills.filter((i) => i.status === "paid").length
  const unpaidBills = purchaseBills.filter((i) => i.status === "unpaid").length
  const overdueBills = purchaseBills.filter((i) => i.status === "overdue").length

  const filters = [
    { value: "all", label: "All Bills", count: totalBills },
    { value: "paid", label: "Paid", count: paidBills },
    { value: "unpaid", label: "Unpaid", count: unpaidBills },
    { value: "overdue", label: "Overdue", count: overdueBills },
  ]

  const handleViewBill = (bill: PurchaseBill) => {
    setSelectedBill(bill)
  }

  const handleEditBill = (bill: PurchaseBill) => {
    navigate(`/edit-purchase-bill/${bill.id}`)
  }

  const closePreview = () => {
    setSelectedBill(null)
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
              <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white transition-colors">Purchase Bills</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-lg transition-colors">Track and manage vendor bills</p>
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
            onClick={() => navigate("/create-purchase-bill")}
            icon={Plus}
            size="md"
            className="w-full md:w-auto shadow-lg"
          >
            <span className="md:hidden">Add Bill</span>
            <span className="hidden md:inline">Add Purchase Bill</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
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
            <Card className="hover:bg-gray-50 dark:hover:bg-gray-750 relative overflow-hidden transition-colors">
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
                  className={`text-2xl md:text-3xl font-bold mb-1 md:mb-2 transition-colors ${
                    filter.value === "paid"
                      ? "text-green-600 dark:text-green-500"
                      : filter.value === "unpaid"
                        ? "text-yellow-600 dark:text-yellow-500"
                        : filter.value === "overdue"
                          ? "text-red-500"
                          : "text-emerald-600 dark:text-emerald-500"
                  }`}
                >
                  {filter.count}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium text-xs md:text-base break-words px-1 transition-colors">{filter.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vendor or bill number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {filters.map(filter => (
                 <motion.button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === filter.value
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {filter.label}
                </motion.button>
               ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Results Summary */}
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
        <div className="text-gray-500 dark:text-gray-400 transition-colors">
          Showing {filteredBills.length} of {purchaseBills.length} bills
          {searchTerm && (
            <span className="ml-2">
              for "<span className="text-gray-900 dark:text-white font-medium">{searchTerm}</span>"
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

      {/* Bills Table */}
      <motion.div variants={itemVariants}>
        <PurchaseBillTable
          bills={filteredBills}
          onViewBill={handleViewBill}
          onEditBill={handleEditBill}
          statusFilter={statusFilter}
        />
      </motion.div>

      {selectedBill && <PurchaseBillPreview bill={selectedBill} onClose={closePreview} />}
    </motion.div>
  )
}

export default PurchaseBillsPage
