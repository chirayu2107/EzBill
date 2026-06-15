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
  addPurchaseBill as addPurchaseBillToFirebase,
  updatePurchaseBill as updatePurchaseBillInFirebase,
  deletePurchaseBill as deletePurchaseBillFromFirebase,
  getUserPurchaseBills,
} from "../services/firebaseService"
import type { Invoice, DashboardSummary, PurchaseBill } from "../types"
import { useToast } from "../hooks/useToast"

interface AppContextType {
  invoices: Invoice[]
  addInvoice: (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<void>
  updateInvoice: (id: string, invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice["status"]) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  getDashboardSummary: () => DashboardSummary
  getInvoiceById: (id: string) => Invoice | undefined
  generateInvoiceNumber: (date?: Date) => string
  // Purchase Bills
  purchaseBills: PurchaseBill[]
  addPurchaseBill: (bill: Omit<PurchaseBill, "id" | "createdAt">) => Promise<void>
  updatePurchaseBill: (id: string, bill: Omit<PurchaseBill, "id" | "createdAt">) => Promise<void>
  deletePurchaseBill: (id: string) => Promise<void>
  getPurchaseBillById: (id: string) => PurchaseBill | undefined
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
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && auth.currentUser) {
      loadData()
    } else {
      setInvoices([])
      setPurchaseBills([])
      setError(null)
    }
  }, [isAuthenticated])

  const loadData = async () => {
    if (!auth.currentUser) return

    setLoading(true)
    setError(null)

    try {
      // Load Invoices
      const invoicesResult = await getUserInvoices(auth.currentUser.uid)
      if (invoicesResult.success) {
        setInvoices(invoicesResult.invoices || [])
      }

      // Load Purchase Bills
      const billsResult = await getUserPurchaseBills(auth.currentUser.uid)
      if (billsResult.success) {
        setPurchaseBills(billsResult.purchaseBills || [])
      }
      
    } catch (error: any) {
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const isNewFormat = (invoiceNumber: string): boolean => {
    if (!invoiceNumber) return false
    const parts = invoiceNumber.split("-")
    if (parts.length < 3) return false
    const sequencePart = parts[parts.length - 1]
    const yearPart = parts[parts.length - 2]
    
    const isYearValid = /^\d{4}$/.test(yearPart)
    const isSequenceValid = /^\d+$/.test(sequencePart)
    
    return isYearValid && isSequenceValid
  }

  const getMigratedInvoiceNumber = (invoiceNumber: string, date: Date): string => {
    const safeInvoiceNumber = invoiceNumber || "1"
    const parts = safeInvoiceNumber.split("-")
    let prefix = ""
    let sequence = ""

    if (parts.length >= 2) {
      sequence = parts[parts.length - 1]
      prefix = parts.slice(0, parts.length - 1).join("-").toUpperCase()
    } else {
      sequence = parts[0]
      if (user?.invoicePrefix && user.invoicePrefix.trim()) {
        prefix = user.invoicePrefix.trim().toUpperCase()
      } else if (user?.fullName && user.fullName.length >= 4) {
        prefix = user.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
      } else {
        prefix = "XUSE"
      }
    }

    const numericSequence = sequence.replace(/\D/g, "") || "1"
    const dateObj = date instanceof Date && !isNaN(date.getTime()) ? date : new Date()
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()
    const financialYear = month >= 3 ? year : year - 1

    return `${prefix}-${financialYear}-${numericSequence}`
  }

  const migrateExistingInvoices = async () => {
    let migratedCount = 0
    for (const invoice of invoices) {
      if (!isNewFormat(invoice.invoiceNumber)) {
        const newInvoiceNumber = getMigratedInvoiceNumber(invoice.invoiceNumber, invoice.date)
        
        try {
          await updateInvoiceInFirebase(invoice.id, { invoiceNumber: newInvoiceNumber })
          migratedCount++
        } catch (err) {
          console.error("Failed to migrate invoice:", invoice.id, err)
        }
      }
    }
    if (migratedCount > 0) {
      await loadData() // Refresh context state
      toast.success("Invoices Migrated", `${migratedCount} invoices updated to the new financial year numbering format.`)
    }
  }

  useEffect(() => {
    if (!loading && invoices.length > 0) {
      const runMigration = async () => {
        const needsMigration = invoices.some((inv) => !isNewFormat(inv.invoiceNumber))
        if (needsMigration) {
          await migrateExistingInvoices()
        }
      }
      runMigration()
    }
  }, [loading, invoices])

  const refreshInvoices = async () => {
    await loadData()
  }

  const generateInvoiceNumber = (date: Date = new Date()) => {
    // Use the user's custom invoice prefix, fallback to auto-generated or default
    let prefix = "XUSE" // default fallback

    if (user?.invoicePrefix && user.invoicePrefix.trim()) {
      // Use the user's custom prefix
      prefix = user.invoicePrefix.trim().toUpperCase()
    } else if (user?.fullName && user.fullName.length >= 4) {
      // Fallback to auto-generated from name
      prefix = user.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
    }

    const dateObj = new Date(date)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() // 0-indexed: 0 = Jan, 11 = Dec
    const financialYear = month >= 3 ? year : year - 1

    const yearPrefix = `${prefix}-${financialYear}-`

    // Get the highest existing invoice number for this user with this prefix and financial year
    let maxNumber = 0

    invoices.forEach((invoice) => {
      if (invoice.invoiceNumber.startsWith(yearPrefix)) {
        const parts = invoice.invoiceNumber.split("-")
        if (parts.length >= 3) {
          const numberPart = parts[2]
          const num = Number.parseInt(numberPart)
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num
          }
        }
      }
    })

    const nextNumber = maxNumber + 1
    return `${prefix}-${financialYear}-${nextNumber}`
  }

  const addInvoice = async (invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => {
    if (!auth.currentUser) {
      setError("User not authenticated")
      return
    }

    const invoiceNumber = generateInvoiceNumber(invoiceData.date)
    const newInvoice: Omit<Invoice, "id"> = {
      ...invoiceData,
      invoiceNumber,
      createdAt: new Date(),
    }

    try {
      setError(null)
      const result = await addInvoiceToFirebase(newInvoice, auth.currentUser.uid)
      if (result.success) {
        await loadData() // Reload invoices to get the latest data
        toast.success("Invoice Created", `Invoice ${invoiceNumber} has been created successfully`)
      } else {
        setError(result.error || "Failed to add invoice")
        toast.error("Failed to Create Invoice", result.error || "An error occurred while creating the invoice")
      }
    } catch (error: any) {
      setError("Failed to add invoice. Please try again.")
    }
  }

  const updateInvoice = async (id: string, invoiceData: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => {
    try {
      setError(null)

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
        await loadData() // Reload invoices to get the latest data
        toast.success("Invoice Updated", "Invoice has been updated successfully")
      } else {
        setError(result.error || "Failed to update invoice")
        toast.error("Failed to Update Invoice", result.error || "An error occurred while updating the invoice")
      }
    } catch (error: any) {
      setError("Failed to update invoice. Please try again.")
    }
  }

  const updateInvoiceStatus = async (id: string, status: Invoice["status"]) => {
    try {
      setError(null)

      const result = await updateInvoiceInFirebase(id, { status })
      if (result.success) {
        setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)))
      } else {
        setError(result.error || "Failed to update invoice status")
      }
    } catch (error: any) {
      setError("Failed to update invoice status. Please try again.")
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      setError(null)

      const result = await deleteInvoiceFromFirebase(id)
      if (result.success) {
        setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
      } else {
        setError(result.error || "Failed to delete invoice")
      }
    } catch (error: any) {
      setError("Failed to delete invoice. Please try again.")
    }
  }

  // Purchase Bill methods
  const addPurchaseBill = async (billData: Omit<PurchaseBill, "id" | "createdAt">) => {
    if (!auth.currentUser) return

    try {
      setError(null)
      const newBill: Omit<PurchaseBill, "id"> = {
        ...billData,
        createdAt: new Date(),
      }
      
      const result = await addPurchaseBillToFirebase(newBill, auth.currentUser.uid)
      if (result.success) {
        await loadData()
        toast.success("Purchase Bill Created", "Bill added successfully")
      } else {
        toast.error("Failed to Add Bill", result.error || "Error adding bill")
      }
    } catch (error: any) {
      setError("Failed to add purchase bill. Please try again.")
    }
  }

  const updatePurchaseBill = async (id: string, billData: Omit<PurchaseBill, "id" | "createdAt">) => {
     try {
      setError(null)
      // Create a clean update object
      const updateData: Partial<PurchaseBill> = {
        billNumber: billData.billNumber,
        vendorName: billData.vendorName,
        vendorAddress: billData.vendorAddress,
        vendorState: billData.vendorState,
        vendorGSTIN: billData.vendorGSTIN,
        vendorPAN: billData.vendorPAN,
        date: billData.date,
        items: billData.items,
        subtotal: billData.subtotal,
        gst: billData.gst,
        gstBreakdown: billData.gstBreakdown,
        total: billData.total,
        status: billData.status,
      }

      const result = await updatePurchaseBillInFirebase(id, updateData)
      if (result.success) {
        await loadData()
        toast.success("Purchase Bill Updated", "Bill updated successfully")
      } else {
        toast.error("Failed to Update Bill", result.error || "Error updating bill")
      }
    } catch (error: any) {
      setError("Failed to update purchase bill. Please try again.")
    }
  }

  const deletePurchaseBill = async (id: string) => {
    try {
      setError(null)
      const result = await deletePurchaseBillFromFirebase(id)
      if (result.success) {
        setPurchaseBills((prev) => prev.filter((bill) => bill.id !== id))
        toast.success("Purchase Bill Deleted", "Bill deleted successfully")
      } else {
        toast.error("Failed to Delete Bill", result.error || "Error deleting bill")
      }
    } catch (error: any) {
      // Silent fail
    }
  }

  const getDashboardSummary = (): DashboardSummary => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1)
    const lastMonth = lastMonthDate.getMonth()
    const lastYear = lastMonthDate.getFullYear()

    // Helper to calculate totals for a period
    const calculatePeriodMetrics = (invoiceList: Invoice[], billList: PurchaseBill[], month: number, year: number) => {
      const periodInvoices = invoiceList.filter((inv) => {
        const d = new Date(inv.date)
        return d.getMonth() === month && d.getFullYear() === year
      })

      const periodBills = billList.filter((bill) => {
        const d = new Date(bill.date)
        return d.getMonth() === month && d.getFullYear() === year
      })

      return {
        revenue: periodInvoices.reduce((sum, inv) => sum + inv.total, 0),
        paid: periodInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0),
        pending: periodInvoices.filter((inv) => inv.status === "unpaid").reduce((sum, inv) => sum + inv.total, 0),
        purchase: periodBills.reduce((sum, bill) => sum + bill.total, 0),
      }
    }

    const thisMonthMetrics = calculatePeriodMetrics(invoices, purchaseBills, thisMonth, thisYear)
    const lastMonthMetrics = calculatePeriodMetrics(invoices, purchaseBills, lastMonth, lastYear)

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

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

    const totalPurchase = purchaseBills.reduce((sum, bill) => sum + bill.total, 0)

    return {
      totalPurchase,
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalInvoices: invoices.length,
      purchaseChange: calculateChange(thisMonthMetrics.purchase, lastMonthMetrics.purchase),
      revenueChange: calculateChange(thisMonthMetrics.revenue, lastMonthMetrics.revenue),
      paidChange: calculateChange(thisMonthMetrics.paid, lastMonthMetrics.paid),
      pendingChange: calculateChange(thisMonthMetrics.pending, lastMonthMetrics.pending),
    }
  }

  const getInvoiceById = (id: string) => {
    return invoices.find((invoice) => invoice.id === id)
  }

  const getPurchaseBillById = (id: string) => {
    return purchaseBills.find((bill) => bill.id === id)
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
        purchaseBills,
        addPurchaseBill,
        updatePurchaseBill,
        deletePurchaseBill,
        getPurchaseBillById,
        loading,
        error,
        refreshInvoices,
        generateInvoiceNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
