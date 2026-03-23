"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import CustomerLedger from "../Invoice/CustomerLedger"
import type { Invoice } from "../../types"
import { BookOpen, Users, Search } from "lucide-react"
import Card from "../UI/Card"

const LedgersPage: React.FC = () => {
  const { invoices } = useApp()
  const { user } = useAuth()
  const [ledgerCustomer, setLedgerCustomer] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Group invoices by customer name
  const customerGroups = useMemo(() => {
    const map = new Map<string, Invoice[]>()
    invoices.forEach((inv) => {
      const existing = map.get(inv.customerName) || []
      map.set(inv.customerName, [...existing, inv])
    })
    return Array.from(map.entries())
      .map(([name, invList]) => {
        const totalInvoiced = invList.reduce((s, i) => s + i.total, 0)
        const totalPaid = invList.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0)
        const balance = totalInvoiced - totalPaid
        const lastDate = invList.reduce(
          (max, i) => (new Date(i.date) > max ? new Date(i.date) : max),
          new Date(invList[0].date)
        )
        return { name, invList, totalInvoiced, totalPaid, balance, lastDate }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [invoices])

  const filtered = customerGroups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ledgerInvoices = useMemo(
    () => customerGroups.find((g) => g.name === ledgerCustomer)?.invList || [],
    [customerGroups, ledgerCustomer]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
  }

  return (
    <motion.div className="space-y-8 pt-24 md:pt-0" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <BookOpen className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 dark:text-white transition-colors">
              Customer Ledgers
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base transition-colors">
              Tally-style account ledger for each customer
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4" variants={itemVariants}>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-indigo-500">{customerGroups.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Customers</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-semibold text-emerald-500">
              ₹{customerGroups.reduce((s, g) => s + g.totalPaid, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Received</div>
          </div>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-500">
              ₹{customerGroups.reduce((s, g) => s + g.balance, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Outstanding</div>
          </div>
        </Card>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Customer Table */}
      <motion.div variants={itemVariants}>
        {filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "No customers match your search." : "No customers yet. Create invoices to see ledgers here."}
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Invoices</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Total Billed</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 hidden sm:table-cell">Total Paid</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Balance Due</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((group, idx) => (
                    <motion.tr
                      key={group.name}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                            <div className="text-xs text-gray-400">
                              Last: {group.lastDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{group.invList.length}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white hidden sm:table-cell">
                        ₹{group.totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium hidden sm:table-cell">
                        ₹{group.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${group.balance > 0 ? "text-orange-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                          ₹{group.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <motion.button
                          onClick={() => setLedgerCustomer(group.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-lg transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>

      {ledgerCustomer && (
        <CustomerLedger
          customerName={ledgerCustomer}
          invoices={ledgerInvoices}
          user={user}
          onClose={() => setLedgerCustomer(null)}
        />
      )}
    </motion.div>
  )
}

export default LedgersPage
