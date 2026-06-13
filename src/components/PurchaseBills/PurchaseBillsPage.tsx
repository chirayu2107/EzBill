"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import PurchaseBillTable from "./PurchaseBillTable"
import PurchaseBillPreview from "./PurchaseBillPreview"
import type { PurchaseBill } from "../../types"
import { Plus, Search } from "lucide-react"
import Button from "../UI/Button"

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

  const stats = [
    { value: "all", label: "All Bills", count: purchaseBills.length, color: "text-gray-900 dark:text-white", bg: "bg-gray-50 dark:bg-white/5", activeBg: "bg-gray-100 dark:bg-white/10", border: "border-gray-200 dark:border-gray-700" },
    { value: "paid", label: "Paid", count: purchaseBills.filter(i => i.status === "paid").length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/5", activeBg: "bg-emerald-100 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
    { value: "unpaid", label: "Unpaid", count: purchaseBills.filter(i => i.status === "unpaid").length, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/5", activeBg: "bg-amber-100 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
    { value: "overdue", label: "Overdue", count: purchaseBills.filter(i => i.status === "overdue").length, color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/5", activeBg: "bg-red-100 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/20" },
  ]

  const handleViewBill = (bill: PurchaseBill) => setSelectedBill(bill)
  const handleEditBill = (bill: PurchaseBill) => navigate(`/dashboard/edit-purchase-bill/${bill.id}`)
  const closePreview = () => setSelectedBill(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <motion.div className="space-y-6 pt-20 lg:pt-0" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Purchase Bills</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Track and manage vendor bills</p>
        </div>
        <Button onClick={() => navigate("/dashboard/create-purchase-bill")} icon={Plus} variant="accent" size="sm" className="w-full md:w-auto">
          <span className="md:hidden">Add Bill</span>
          <span className="hidden md:inline">Add Purchase Bill</span>
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3" variants={itemVariants}>
        {stats.map((stat) => {
          const isActive = statusFilter === stat.value
          return (
            <motion.button
              key={stat.value}
              onClick={() => setStatusFilter(stat.value as any)}
              className={`relative rounded-2xl border p-4 text-center transition-all duration-200 ${
                isActive
                  ? `${stat.activeBg} ${stat.border} shadow-sm`
                  : `bg-white dark:bg-white/[0.02] border-gray-100 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700`
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`text-2xl font-bold ez-number mb-0.5 ${stat.color}`}>
                {stat.count}
              </div>
              <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vendor or bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/40 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
            {stats.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === f.value
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white ez-number">{filteredBills.length}</span> of {purchaseBills.length}
            {searchTerm && (
              <> · <button onClick={() => setSearchTerm("")} className="text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button></>
            )}
          </div>
        </div>
      </motion.div>

      {/* Table */}
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
