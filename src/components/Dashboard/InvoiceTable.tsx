"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useApp } from "../../context/AppContext"
import type { Invoice } from "../../types"
import { formatCurrency, formatDate } from "../../utils/calculations"
import { Eye, CheckCircle, XCircle, Download, Edit, Trash2, AlertTriangle, FileX } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"
import { generateInvoicePDF } from "../../utils/pdf"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"

interface InvoiceTableProps {
  invoices: Invoice[]
  onViewInvoice: (invoice: Invoice) => void
  onEditInvoice: (invoice: Invoice) => void
  statusFilter?: string
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onViewInvoice, onEditInvoice, statusFilter }) => {
  const { updateInvoiceStatus, deleteInvoice } = useApp()
  const { user } = useAuth()
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
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
  }

  const handleDownload = (invoice: Invoice) => {
    toast.info("Generating PDF", "Creating your invoice PDF...")
    generateInvoicePDF(invoice, user)
    toast.success("PDF Generated", "Invoice PDF has been downloaded")
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteConfirm(invoice.id)
  }

  const confirmDelete = (invoice: Invoice) => {
    deleteInvoice(invoice.id)
    setDeleteConfirm(null)
    toast.success("Invoice Deleted", `Invoice ${invoice.invoiceNumber} has been deleted`)
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
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
        <Card className="text-center py-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4"
          >
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <FileX className="w-8 h-8 text-gray-400" />
            </div>
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">{emptyState.title}</h3>
          <p className="text-gray-400">{emptyState.description}</p>
        </Card>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
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
                            <Button size="sm" variant="primary" icon={Eye} onClick={() => onViewInvoice(invoice)}>
                              View
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Download}
                              onClick={() => handleDownload(invoice)}
                            >
                              PDF
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button size="sm" variant="secondary" icon={Edit} onClick={() => onEditInvoice(invoice)}>
                              Edit
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              size="sm"
                              variant={invoice.status === "paid" ? "secondary" : "success"}
                              icon={invoice.status === "paid" ? XCircle : CheckCircle}
                              onClick={() => toggleInvoiceStatus(invoice)}
                            >
                              {invoice.status === "paid" ? "Unpaid" : "Paid"}
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => handleDeleteClick(invoice)}>
                              Delete
                            </Button>
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
              className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700"
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
                  <p className="text-gray-400">Are you sure you want to delete this invoice?</p>
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
    </>
  )
}

export default InvoiceTable
