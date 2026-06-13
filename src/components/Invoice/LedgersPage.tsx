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
    hidden: { y: 8, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  }

  return (
    <motion.div className="space-y-6 md:space-y-8 pt-20 lg:pt-0" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start gap-4" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Customer Ledgers
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Tally-style account ledger for each customer
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-3" variants={itemVariants}>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 ez-number">{customerGroups.length}</div>
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Customers</div>
        </div>
        <div className="rounded-2xl border border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5 p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 ez-number">
            ₹{customerGroups.reduce((s, g) => s + g.totalPaid, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Received</div>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4 text-center col-span-2 md:col-span-1">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 ez-number">
            ₹{customerGroups.reduce((s, g) => s + g.balance, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Outstanding</div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400/40 transition-all placeholder:text-gray-400 shadow-sm"
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
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Invoices</th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">Total Billed</th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">Total Paid</th>
                    <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Balance Due</th>
                    <th className="text-center py-3 px-4 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((group, idx) => (
                    <motion.tr
                      key={group.name}
                      className="border-b border-gray-50 dark:border-gray-800/30 hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors duration-150"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
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
                      <td className="py-3.5 px-4 text-right text-gray-600 dark:text-gray-400 ez-number">{group.invList.length}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-900 dark:text-white hidden sm:table-cell ez-number">
                        ₹{group.totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium hidden sm:table-cell ez-number">
                        ₹{group.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-semibold ez-number ${group.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
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
