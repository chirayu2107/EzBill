"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useApp } from "../../context/AppContext"
import type { Invoice } from "../../types"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { Eye, CheckCircle, XCircle, Edit, Trash2, AlertTriangle, FileX, Download, MoreVertical } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"
import InvoicePreview from "../Invoice/InvoicePreview"
import { useToast } from "../../hooks/useToast"
import { getInitials, getAvatarGradient } from "../../utils/avatarUtils"



const RenderCurrency = ({ amount, isTotal = false }: { amount: number; isTotal?: boolean }) => {
  const formatted = formatCurrency(amount)
  const symbol = formatted.charAt(0)
  const rest = formatted.slice(1)
  
  return (
    <span className={`ez-mono tracking-tight ${isTotal ? 'text-gray-900 dark:text-white font-bold text-xs md:text-sm' : 'text-gray-600 dark:text-gray-300 text-xs font-medium'}`}>
      <span className="text-gray-400 dark:text-gray-500 mr-0.5 font-normal">{symbol}</span>
      {rest}
    </span>
  )
}

interface InvoiceTableProps {
  invoices: Invoice[]
  onViewInvoice: (invoice: Invoice) => void
  onEditInvoice: (invoice: Invoice) => void
  statusFilter?: string
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onViewInvoice, onEditInvoice, statusFilter }) => {
  const { updateInvoiceStatus, deleteInvoice } = useApp()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [downloadPreview, setDownloadPreview] = useState<Invoice | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const { toast } = useToast()

  const getStatusTextClass = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "text-emerald-600 dark:text-emerald-400"
      case "unpaid":
        return "text-amber-600 dark:text-amber-400"
      case "overdue":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-gray-500 dark:text-gray-400"
    }
  }

  const toggleInvoiceStatus = (invoice: Invoice) => {
    const newStatus = invoice.status === "paid" ? "unpaid" : "paid"
    updateInvoiceStatus(invoice.id, newStatus)
    toast.success("Status Updated", `Invoice ${invoice.invoiceNumber} marked as ${newStatus}`)
    setActiveDropdown(null)
  }

  const handleDownload = (invoice: Invoice) => {
    setDownloadPreview(invoice)
    setActiveDropdown(null)
  }

  const closeDownloadPreview = () => {
    setDownloadPreview(null)
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteConfirm(invoice.id)
    setActiveDropdown(null)
  }

  const confirmDelete = (invoice: Invoice) => {
    deleteInvoice(invoice.id)
    setDeleteConfirm(null)
    toast.success("Invoice Deleted", `Invoice ${invoice.invoiceNumber} has been deleted`)
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  const toggleDropdown = (invoiceId: string) => {
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId)
  }

  const getEmptyStateMessage = () => {
    if (!statusFilter || statusFilter === "all") {
      return {
        title: "No invoices found",
        description: "Create your first invoice to get started",
      }
    }

    const statusMessages = {
      paid: {
        title: "No paid invoices",
        description: "No invoices have been marked as paid yet",
      },
      unpaid: {
        title: "No unpaid invoices",
        description: "All your invoices are up to date!",
      },
      overdue: {
        title: "No overdue invoices",
        description: "Great! No invoices are overdue",
      },
    }

    return (
      statusMessages[statusFilter as keyof typeof statusMessages] || {
        title: "No invoices found",
        description: "No invoices match the current filter",
      }
    )
  }

  if (invoices.length === 0) {
    const emptyState = getEmptyStateMessage()

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="text-center py-12 md:py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 28 }}
            className="mb-4"
          >
            <div className="w-14 h-14 bg-gray-100 dark:bg-[#1A1A1D] rounded-2xl flex items-center justify-center mx-auto">
              <FileX className="w-7 h-7 text-gray-400 dark:text-[#55555E]" />
            </div>
          </motion.div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{emptyState.title}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyState.description}</p>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card padding="sm">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3 p-2">
            <AnimatePresence>
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.04 }}
                  className="ez-card !rounded-xl p-4 relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${getAvatarGradient(invoice.customerName)} flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm`}>
                        {getInitials(invoice.customerName)}
                      </div>
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-bold text-xs ez-mono bg-gray-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-gray-200/50 dark:border-white/[0.04] inline-block mb-0.5">{invoice.invoiceNumber}</h4>
                        <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight">{invoice.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold capitalize tracking-wide ${getStatusTextClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(invoice.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#ECECEF] rounded-md hover:bg-gray-100 dark:hover:bg-[#212124] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeDropdown === invoice.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              transition={{ type: "spring", stiffness: 280, damping: 28 }}
                              className={`absolute right-0 ez-modal z-20 min-w-[160px] py-1 ${
                                index >= invoices.length - 2 ? "bottom-8" : "top-8"
                              }`}
                            >
                              <button
                                onClick={() => onViewInvoice(invoice)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1F] flex items-center gap-2 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="font-medium">View</span>
                              </button>
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1F] flex items-center gap-2 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                              <button
                                onClick={() => onEditInvoice(invoice)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1F] flex items-center gap-2 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleInvoiceStatus(invoice)}
                                className="w-full px-3 py-2 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1C1C1F] flex items-center gap-2 transition-colors"
                              >
                                {invoice.status === "paid" ? (
                                  <>
                                    <XCircle className="w-3.5 h-3.5" />
                                    Mark Unpaid
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Mark Paid
                                  </>
                                )}
                              </button>
                              <div className="border-t border-gray-100 dark:border-white/[0.04] my-1" />
                              <button
                                onClick={() => handleDeleteClick(invoice)}
                                className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/50 dark:bg-[#161618]/50 p-2.5 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Date</p>
                      <p className="text-gray-900 dark:text-white font-medium text-sm">{formatDate(invoice.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Amount</p>
                      <p className="text-gray-900 dark:text-white font-bold text-sm ez-mono">{formatCurrency(invoice.total)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01]">
                  <th className="w-[13%] text-left py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Invoice #</th>
                  <th className="w-[18%] text-left py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Customer</th>
                  <th className="w-[12%] text-left py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Date</th>
                  <th className="w-[11%] text-right py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Amount</th>
                  <th className="w-[9%] text-right py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">GST</th>
                  <th className="w-[11%] text-right py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Total</th>
                  <th className="w-[9%] text-center py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Status</th>
                  <th className="w-[17%] text-right py-3 px-4 text-[10px] font-bold text-gray-400 dark:text-[#55555E] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.02]">
                <AnimatePresence>
                  {invoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: index * 0.04 }}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/[0.01] transition-colors duration-150 group"
                    >
                      <td className="py-3.5 px-4 text-left">
                        <span className="font-semibold text-[11px] ez-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-white/[0.04] px-2.5 py-1 rounded border border-gray-200/50 dark:border-white/[0.04] tracking-tight">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${getAvatarGradient(invoice.customerName)} flex items-center justify-center text-white font-semibold text-[10px] shrink-0 shadow-sm`}>
                            {getInitials(invoice.customerName)}
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium text-xs tracking-tight">{invoice.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 text-xs tracking-tight truncate">{formatDate(invoice.date)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <RenderCurrency amount={invoice.subtotal} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <RenderCurrency
                          amount={
                            invoice.gstBreakdown.isInterState
                              ? invoice.gstBreakdown.igst
                              : invoice.gstBreakdown.cgst + invoice.gstBreakdown.sgst
                          }
                        />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <RenderCurrency amount={invoice.total} isTotal={true} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-xs font-semibold capitalize tracking-wide ${getStatusTextClass(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onViewInvoice(invoice)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDownload(invoice)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onEditInvoice(invoice)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleInvoiceStatus(invoice)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              invoice.status === "paid"
                                ? "text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/10"
                                : "text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/10"
                            }`}
                            title={invoice.status === "paid" ? "Mark as Unpaid" : "Mark as Paid"}
                          >
                            {invoice.status === "paid" ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteClick(invoice)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Click outside to close dropdown */}
      {activeDropdown && <div className="fixed inset-0 z-5" onClick={() => setActiveDropdown(null)} />}

      {/* ═══ DELETE MODAL (Command Palette Style) ═══ */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ez-modal p-5 md:p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-500/8 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Delete Invoice</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#1A1A1D] rounded-lg p-3 mb-5 border border-gray-100 dark:border-white/[0.04]">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Invoice:{" "}
                  <span className="text-gray-900 dark:text-white font-medium ez-mono">
                    {invoices.find((inv) => inv.id === deleteConfirm)?.invoiceNumber}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Customer:{" "}
                  <span className="text-gray-900 dark:text-white font-medium">
                    {invoices.find((inv) => inv.id === deleteConfirm)?.customerName}
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => confirmDelete(invoices.find((inv) => inv.id === deleteConfirm)!)}
                  variant="danger"
                  className="flex-1"
                  size="sm"
                >
                  Delete
                </Button>
                <Button onClick={cancelDelete} variant="secondary" className="flex-1" size="sm">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Preview Modal */}
      {downloadPreview && (
        <InvoicePreview invoice={downloadPreview} onClose={closeDownloadPreview} autoDownload={true} />
      )}
    </>
  )
}

export default InvoiceTable
