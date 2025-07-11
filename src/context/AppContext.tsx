"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./AuthContext"
import { auth } from "../config/firebase"
import {
  addInvoice as addInvoiceToFirebase,
  updateInvoice as updateInvoiceInFirebase,
  deleteInvoice as deleteInvoiceFromFirebase,
  getUserInvoices,
} from "../services/firebaseService"
import type { Invoice, DashboardSummary } from "../types"
import { useToast } from "../hooks/useToast"

interface AppContextType {
  invoices: Invoice[]
  addInvoice: (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<void>
  updateInvoice: (id: string, invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice["status"]) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  getDashboardSummary: () => DashboardSummary
  getInvoiceById: (id: string) => Invoice | undefined
  loading: boolean
  error: string | null
  refreshInvoices: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Debug logging
  useEffect(() => {
    console.log("AppContext - Auth state changed:")
    console.log("- isAuthenticated:", isAuthenticated)
    console.log("- user:", user)
    console.log("- auth.currentUser:", auth.currentUser)
  }, [isAuthenticated, user])

  // Load invoices when user is authenticated
  useEffect(() => {
    if (isAuthenticated && auth.currentUser) {
      console.log("User authenticated, loading invoices...")
      loadInvoices()
    } else {
      console.log("User not authenticated, clearing invoices")
      setInvoices([])
      setError(null)
    }
  }, [isAuthenticated])

  const loadInvoices = async () => {
    if (!auth.currentUser) {
      console.log("No current user, cannot load invoices")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("Loading invoices for user:", auth.currentUser.uid)
      const result = await getUserInvoices(auth.currentUser.uid)

      console.log("Load invoices result:", result)

      if (result.success) {
        console.log("Successfully loaded invoices:", result.invoices?.length || 0)
        setInvoices(result.invoices || [])
        setError(null)
      } else {
        console.error("Failed to load invoices:", result.error)
        setError(result.error || "Failed to load invoices")
        setInvoices([])
      }
    } catch (error: any) {
      console.error("Error loading invoices:", error)
      setError(`Failed to load invoices: ${error.message}`)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const refreshInvoices = async () => {
    console.log("Refreshing invoices...")
    await loadInvoices()
  }

  const generateInvoiceNumber = () => {
    // Use the user's custom invoice prefix, fallback to auto-generated or default
    let prefix = "XUSE" // default fallback

    if (user?.invoicePrefix && user.invoicePrefix.trim()) {
      // Use the user's custom prefix
      prefix = user.invoicePrefix.trim().toUpperCase()
    } else if (user?.fullName && user.fullName.length >= 4) {
      // Fallback to auto-generated from name
      prefix = user.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
    }

    const baseNumber = 1;

    // Get the highest existing invoice number for this user with this prefix
    let maxNumber = baseNumber - 1

    invoices.forEach((invoice) => {
      if (invoice.invoiceNumber.startsWith(prefix + "-")) {
        const numberPart = invoice.invoiceNumber.split("-")[1]
        const num = Number.parseInt(numberPart)
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num
        }
      }
    })

    // Return the next number in sequence
    const nextNumber = String(maxNumber + 1)
    return `${prefix}-${nextNumber}`;
  }

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => {
    if (!auth.currentUser) {
      setError("User not authenticated")
      return
    }

    console.log("Adding new invoice:", invoiceData)

    const invoiceNumber = generateInvoiceNumber()
    const newInvoice: Omit<Invoice, "id"> = {
      ...invoiceData,
      invoiceNumber,
      createdAt: new Date(),
    }

    try {
      setError(null)
      const result = await addInvoiceToFirebase(newInvoice, auth.currentUser.uid)
      if (result.success) {
        console.log("Invoice added successfully, refreshing list")
        await loadInvoices() // Reload invoices to get the latest data
        toast.success("Invoice Created", `Invoice ${invoiceNumber} has been created successfully`)
      } else {
        console.error("Failed to add invoice:", result.error)
        setError(result.error || "Failed to add invoice")
        toast.error("Failed to Create Invoice", result.error || "An error occurred while creating the invoice")
      }
    } catch (error: any) {
      console.error("Error adding invoice:", error)
      setError(`Failed to add invoice: ${error.message}`)
    }
  }

  const updateInvoice = async (id: string, invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => {
    try {
      setError(null)
      console.log("Updating invoice:", id, invoiceData)

      // Create a clean update object without the excluded fields
      const updateData: Partial<Invoice> = {
        customerName: invoiceData.customerName,
        customerAddress: invoiceData.customerAddress,
        customerState: invoiceData.customerState,
        customerGSTIN: invoiceData.customerGSTIN,
        customerPAN: invoiceData.customerPAN,
        date: invoiceData.date,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        gst: invoiceData.gst,
        gstBreakdown: invoiceData.gstBreakdown,
        total: invoiceData.total,
        status: invoiceData.status,
      }

      const result = await updateInvoiceInFirebase(id, updateData)
      if (result.success) {
        console.log("Invoice updated successfully, refreshing list")
        await loadInvoices() // Reload invoices to get the latest data
        toast.success("Invoice Updated", "Invoice has been updated successfully")
      } else {
        console.error("Failed to update invoice:", result.error)
        setError(result.error || "Failed to update invoice")
        toast.error("Failed to Update Invoice", result.error || "An error occurred while updating the invoice")
      }
    } catch (error: any) {
      console.error("Error updating invoice:", error)
      setError(`Failed to update invoice: ${error.message}`)
    }
  }

  const updateInvoiceStatus = async (id: string, status: Invoice["status"]) => {
    try {
      setError(null)
      console.log("Updating invoice status:", id, status)

      const result = await updateInvoiceInFirebase(id, { status })
      if (result.success) {
        console.log("Invoice status updated successfully")
        setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)))
      } else {
        console.error("Failed to update invoice status:", result.error)
        setError(result.error || "Failed to update invoice status")
      }
    } catch (error: any) {
      console.error("Error updating invoice status:", error)
      setError(`Failed to update invoice status: ${error.message}`)
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      setError(null)
      console.log("Deleting invoice:", id)

      const result = await deleteInvoiceFromFirebase(id)
      if (result.success) {
        console.log("Invoice deleted successfully")
        setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
      } else {
        console.error("Failed to delete invoice:", result.error)
        setError(result.error || "Failed to delete invoice")
      }
    } catch (error: any) {
      console.error("Error deleting invoice:", error)
      setError(`Failed to delete invoice: ${error.message}`)
    }
  }

  const getDashboardSummary = (): DashboardSummary => {
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const paidAmount = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.total, 0)
    const pendingAmount = invoices
      .filter((invoice) => invoice.status === "unpaid")
      .reduce((sum, invoice) => sum + invoice.total, 0)
    const overdueAmount = invoices
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.total, 0)

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
    }
  }

  const getInvoiceById = (id: string) => {
    return invoices.find((invoice) => invoice.id === id)
  }

  return (
    <AppContext.Provider
      value={{
        invoices,
        addInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,
        getDashboardSummary,
        getInvoiceById,
        loading,
        error,
        refreshInvoices,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
