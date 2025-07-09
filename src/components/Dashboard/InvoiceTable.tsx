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

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "unpaid":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "overdue":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="text-center py-12 md:py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <FileX className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            </div>
          </motion.div>
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{emptyState.title}</h3>
          <p className="text-gray-400 text-sm md:text-base">{emptyState.description}</p>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden">
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            <AnimatePresence>
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-700 rounded-lg p-4 relative"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-white font-medium">{invoice.invoiceNumber}</h4>
                      <p className="text-gray-300 text-sm">{invoice.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(invoice.status)}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {invoice.status}
                      </motion.span>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(invoice.id)}
                          className="p-1 text-gray-400 hover:text-white rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                          {activeDropdown === invoice.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[150px]"
                            >
                              <button
                                onClick={() => onViewInvoice(invoice)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              <button
                                onClick={() => onEditInvoice(invoice)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleInvoiceStatus(invoice)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                              >
                                {invoice.status === "paid" ? (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    Mark Unpaid
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Paid
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(invoice)}
                                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Date</p>
                      <p className="text-white">{formatDate(invoice.date)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Amount</p>
                      <p className="text-white font-medium">{formatCurrency(invoice.total)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Invoice #</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Customer</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Date</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Amount</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">GST</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Total</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-4 px-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {invoices.map((invoice, index) => (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-700 hover:bg-gray-750 transition-all duration-200"
                      whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                    >
                      <td className="py-4 px-4 text-white font-medium">{invoice.invoiceNumber}</td>
                      <td className="py-4 px-4 text-gray-300">{invoice.customerName}</td>
                      <td className="py-4 px-4 text-gray-300">{formatDate(invoice.date)}</td>
                      <td className="py-4 px-4 text-gray-300">{formatCurrency(invoice.subtotal)}</td>
                      <td className="py-4 px-4 text-gray-300">
                        {invoice.gstBreakdown.isInterState ? (
                          <span>{formatCurrency(invoice.gstBreakdown.igst)}</span>
                        ) : (
                          <span>{formatCurrency(invoice.gstBreakdown.cgst + invoice.gstBreakdown.sgst)}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">{formatCurrency(invoice.total)}</td>
                      <td className="py-4 px-4">
                        <motion.span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusColor(invoice.status)}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {invoice.status}
                        </motion.span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <button
                              onClick={() => onViewInvoice(invoice)}
                              className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <button
                              onClick={() => handleDownload(invoice)}
                              className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <button
                              onClick={() => onEditInvoice(invoice)}
                              className="p-2 text-gray-400 hover:bg-gray-500/10 rounded-lg transition-colors"
                              title="Edit Invoice"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <button
                              onClick={() => toggleInvoiceStatus(invoice)}
                              className={`p-2 rounded-lg transition-colors ${
                                invoice.status === "paid"
                                  ? "text-yellow-500 hover:bg-yellow-500/10"
                                  : "text-green-500 hover:bg-green-500/10"
                              }`}
                              title={invoice.status === "paid" ? "Mark as Unpaid" : "Mark as Paid"}
                            >
                              {invoice.status === "paid" ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <button
                              onClick={() => handleDeleteClick(invoice)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-xl p-4 md:p-6 max-w-md w-full border border-gray-700"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Invoice</h3>
                  <p className="text-gray-400 text-sm">Are you sure you want to delete this invoice?</p>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-300">
                  Invoice:{" "}
                  <span className="text-white font-medium">
                    {invoices.find((inv) => inv.id === deleteConfirm)?.invoiceNumber}
                  </span>
                </p>
                <p className="text-sm text-gray-300">
                  Customer:{" "}
                  <span className="text-white font-medium">
                    {invoices.find((inv) => inv.id === deleteConfirm)?.customerName}
                  </span>
                </p>
              </div>

              <p className="text-sm text-red-400 mb-6">
                This action cannot be undone. The invoice will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => confirmDelete(invoices.find((inv) => inv.id === deleteConfirm)!)}
                    variant="danger"
                    className="w-full"
                  >
                    Yes, Delete
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={cancelDelete} variant="secondary" className="w-full">
                    Cancel
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Preview Modal - Hidden but renders for PDF generation */}
      {downloadPreview && (
        <InvoicePreview invoice={downloadPreview} onClose={closeDownloadPreview} autoDownload={true} />
      )}
    </>
  )
}

export default InvoiceTable
