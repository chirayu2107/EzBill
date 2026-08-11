"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import type { InvoiceItem, InvoiceType, GlassInvoiceData, GlassItemGroup, GlassItem } from "../../types"
import { calculateSubtotal, calculateGSTBreakdown, formatCurrency, formatDate } from "../../utils/calculations"
import { calculateGlassInvoiceTotals, formatGlassSizeInches, calculateMMtoSqms } from "../../utils/glassCalculations"
import { Plus, Save, Trash2, Layers, FileText } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"
import { getAvatarGradient } from "../../utils/avatarUtils"

const CreateInvoice: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, getInvoiceById } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerState, setCustomerState] = useState("")
  const [customerGSTIN, setCustomerGSTIN] = useState("")
  const [customerPAN, setCustomerPAN] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [gstRate, setGstRate] = useState(18)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const [overallDiscountType, setOverallDiscountType] = useState<"percentage" | "flat">("percentage")
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0)

  const invoiceFY = useMemo(() => {
    if (!invoiceDate) return new Date().getFullYear()
    const dateObj = new Date(invoiceDate)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()
    return month >= 3 ? year : year - 1
  }, [invoiceDate])

  const existingInvoice = useMemo(() => isEditing && id ? getInvoiceById(id) : null, [isEditing, id, getInvoiceById])
  const displayInvoiceNumber = existingInvoice ? existingInvoice.invoiceNumber : `${user?.invoicePrefix || "EZ"}-${invoiceFY}-XXXX`

  const convertToWords = (amount: number): string => {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    const convertHundreds = (num: number): string => {
      let result = ""
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " Hundred "
        num %= 100
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + " "
        num %= 10
      } else if (num >= 10) {
        result += teens[num - 10] + " "
        return result
      }
      if (num > 0) {
        result += ones[num] + " "
      }
      return result
    }

    if (amount === 0) return "Zero Rupees Only"

    let result = ""
    const crores = Math.floor(amount / 10000000)
    const lakhs = Math.floor((amount % 10000000) / 100000)
    const thousands = Math.floor((amount % 100000) / 1000)
    const hundreds = Math.round(amount % 1000)

    if (crores > 0) result += convertHundreds(crores) + "Crore "
    if (lakhs > 0) result += convertHundreds(lakhs) + "Lakh "
    if (thousands > 0) result += convertHundreds(thousands) + "Thousand "
    if (hundreds > 0) result += convertHundreds(hundreds)

    return result.trim() + " Rupees Only"
  }

  // Build unique customer list from existing invoices
  const knownCustomers = useMemo(() => {
    const map = new Map<string, { address: string; state: string; gstin: string; pan: string }>()
    // Sort by date desc so the most recent details win
    ;[...invoices]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((inv) => {
        map.set(inv.customerName, {
          address: inv.customerAddress,
          state: inv.customerState,
          gstin: inv.customerGSTIN,
          pan: inv.customerPAN,
        })
      })
    return map
  }, [invoices])

  const suggestions = useMemo(() => {
    if (!customerName.trim() || customerName.length < 1) return []
    return Array.from(knownCustomers.keys()).filter((name) =>
      name.toLowerCase().includes(customerName.toLowerCase())
    )
  }, [customerName, knownCustomers])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSelectCustomer = (name: string) => {
    const details = knownCustomers.get(name)
    if (details) {
      setCustomerName(name)
      setCustomerAddress(details.address)
      setCustomerState(details.state)
      setCustomerGSTIN(details.gstin)
      setCustomerPAN(details.pan)
    }
    setShowSuggestions(false)
  }
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", name: "", hsnSac: "", quantity: 1, rate: 0, unit: "pcs", discount: 0, lineTotal: 0 },
  ])

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("standard")
  const [glassData, setGlassData] = useState<GlassInvoiceData>({
    groups: [
      {
        id: "group-1",
        specification: "",
        items: [
          {
            id: "glass-1",
            srNo: 1,
            itemNo: "1",
            actualWidth: 0,
            actualHeight: 0,
            actualInches: "",
            pcs: 1,
            actualSqms: 0,
            drgHolesNotes: "",
            chargedWidth: 0,
            chargedHeight: 0,
            chargedSqms: 0,
            chargedRefNotes: "",
            ratePerSqm: 0,
            glassAmount: 0,
            lineTotal: 0,
          },
        ],
      },
    ],
    holeChargesCount: 0,
    holeChargesRate: 0,
    holeChargesAmount: 0,
    cutoutChargesCount: 0,
    cutoutChargesRate: 0,
    cutoutChargesAmount: 0,
    adminCharge: 0,
    assuranceChargeRate: 0,
    assuranceChargeAmount: 0,
  })

  useEffect(() => {
    if (isEditing && id) {
      const invoice = getInvoiceById(id)
      if (invoice) {
        if (invoice.invoiceType) setInvoiceType(invoice.invoiceType)
        if (invoice.glassData) setGlassData(invoice.glassData)
        setCustomerName(invoice.customerName)
        setCustomerAddress(invoice.customerAddress)
        setCustomerState(invoice.customerState)
        setCustomerGSTIN(invoice.customerGSTIN)
        setCustomerPAN(invoice.customerPAN)
        setInvoiceDate(new Date(invoice.date).toISOString().split("T")[0])
        if (invoice.items && invoice.items.length > 0) {
          setItems(invoice.items.map(item => ({
            ...item,
            unit: item.unit || "pcs",
            discount: item.discount || 0
          })))
        }
        if (invoice.discountType) setOverallDiscountType(invoice.discountType)
        if (invoice.discountValue !== undefined) setOverallDiscountValue(invoice.discountValue ?? 0)
        if (invoice.gstBreakdown && invoice.subtotal > 0) {
          const taxable = invoice.subtotal - (invoice.discountAmount || 0)
          if (taxable > 0) {
            const calculatedRate = Math.round((invoice.gst / taxable) * 100)
            setGstRate(calculatedRate === 5 || calculatedRate === 18 ? calculatedRate : calculatedRate === 0 ? 0 : 18)
          }
        }
      }
    }
  }, [isEditing, id, getInvoiceById])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: "",
      hsnSac: "",
      quantity: 1,
      rate: 0,
      unit: "pcs",
      discount: 0,
      lineTotal: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "rate" || field === "discount") {
            const qty = updatedItem.quantity || 0
            const rate = updatedItem.rate || 0
            const disc = updatedItem.discount || 0
            updatedItem.lineTotal = qty * rate * (1 - disc / 100)
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const handleUnitChange = (itemId: string, val: string) => {
    if (val === "custom") {
      const customUnit = prompt("Enter custom unit (e.g. roll, pack, gram):")
      if (customUnit && customUnit.trim()) {
        updateItem(itemId, "unit", customUnit.trim().toLowerCase())
      }
    } else {
      updateItem(itemId, "unit", val)
    }
  }

  // ── Glass Processing Helper Functions ──
  const addGlassGroup = () => {
    const newGroup: GlassItemGroup = {
      id: `group-${Date.now()}`,
      specification: "",
      items: [
        {
          id: `glass-${Date.now()}`,
          srNo: 1,
          itemNo: "1",
          actualWidth: 0,
          actualHeight: 0,
          actualInches: "",
          pcs: 1,
          actualSqms: 0,
          drgHolesNotes: "",
          chargedWidth: 0,
          chargedHeight: 0,
          chargedSqms: 0,
          chargedRefNotes: "",
          ratePerSqm: 0,
          glassAmount: 0,
          lineTotal: 0,
        },
      ],
    }
    setGlassData((prev) => ({
      ...prev,
      groups: [...prev.groups, newGroup],
    }))
  }

  const removeGlassGroup = (groupId: string) => {
    if (glassData.groups.length > 1) {
      setGlassData((prev) => ({
        ...prev,
        groups: prev.groups.filter((g) => g.id !== groupId),
      }))
    }
  }

  const updateGlassGroupSpec = (groupId: string, specification: string) => {
    setGlassData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === groupId ? { ...g, specification } : g)),
    }))
  }

  const addGlassItem = (groupId: string) => {
    setGlassData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id === groupId) {
          const nextIdx = g.items.length + 1
          const newItem: GlassItem = {
            id: `glass-${Date.now()}`,
            srNo: nextIdx,
            itemNo: `${nextIdx}`,
            actualWidth: 0,
            actualHeight: 0,
            actualInches: "",
            pcs: 1,
            actualSqms: 0,
            drgHolesNotes: "",
            chargedWidth: 0,
            chargedHeight: 0,
            chargedSqms: 0,
            chargedRefNotes: "",
            ratePerSqm: 0,
            glassAmount: 0,
            lineTotal: 0,
          }
          return { ...g, items: [...g.items, newItem] }
        }
        return g
      }),
    }))
  }

  const removeGlassItem = (groupId: string, itemId: string) => {
    setGlassData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id === groupId && g.items.length > 1) {
          return { ...g, items: g.items.filter((i) => i.id !== itemId) }
        }
        return g
      }),
    }))
  }

  const updateGlassItem = (groupId: string, itemId: string, field: keyof GlassItem, val: any) => {
    setGlassData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => {
        if (g.id === groupId) {
          const updatedItems = g.items.map((item) => {
            if (item.id === itemId) {
              const updated = { ...item, [field]: val }
              const actualW = Number(updated.actualWidth) || 0
              const actualH = Number(updated.actualHeight) || 0
              const pcs = Number(updated.pcs) || 0
              const chargedW = Number(updated.chargedWidth) || actualW
              const chargedH = Number(updated.chargedHeight) || actualH
              const rate = Number(updated.ratePerSqm) || 0

              updated.actualSqms = calculateMMtoSqms(actualW, actualH, pcs)
              updated.actualInches = formatGlassSizeInches(actualW, actualH)
              updated.chargedSqms = calculateMMtoSqms(chargedW, chargedH, pcs)
              updated.glassAmount = Number((updated.chargedSqms * rate).toFixed(2))
              updated.lineTotal = Number((updated.glassAmount + (Number(updated.grindingAmount) || 0) + (Number(updated.otherCharges) || 0)).toFixed(2))

              return updated
            }
            return item
          })
          return { ...g, items: updatedItems }
        }
        return g
      }),
    }))
  }

  const updateGlassExtra = (field: keyof GlassInvoiceData, val: number) => {
    setGlassData((prev) => ({
      ...prev,
      [field]: val,
    }))
  }

  const glassTotals = useMemo(() => calculateGlassInvoiceTotals(glassData), [glassData])

  const subtotal = useMemo(() => {
    if (invoiceType === "glass") {
      return glassTotals.assessableValue
    }
    return calculateSubtotal(items)
  }, [invoiceType, glassTotals, items])

  const overallDiscountAmount = useMemo(() => {
    if (invoiceType === "glass") return 0
    if (overallDiscountType === "percentage") {
      return (subtotal * (overallDiscountValue || 0)) / 100
    }
    return overallDiscountValue || 0
  }, [invoiceType, subtotal, overallDiscountType, overallDiscountValue])

  const taxableAmount = Math.max(0, subtotal - overallDiscountAmount)
  const gstBreakdown = calculateGSTBreakdown(taxableAmount, user?.state || "", customerState, gstRate)
  const total = taxableAmount + gstBreakdown.total

  // Aggregate GST and taxable value by unique HSN/SAC code dynamically for the live GSTR preview
  const hsnSummaryMap = useMemo(() => {
    const summary: Record<string, { hsn: string; taxableValue: number; igst: number; cgst: number; sgst: number; totalTax: number }> = {}
    
    if (invoiceType === "glass") {
      const hsn = "7007"
      const itemGst = calculateGSTBreakdown(taxableAmount, user?.state || "", customerState, gstRate)
      summary[hsn] = {
        hsn,
        taxableValue: taxableAmount,
        igst: itemGst.igst,
        cgst: itemGst.cgst,
        sgst: itemGst.sgst,
        totalTax: itemGst.total,
      }
      return Object.values(summary)
    }

    const validItems = items.filter(i => i.name && i.rate > 0)
    const totalLineSubtotal = validItems.reduce((acc, curr) => acc + curr.lineTotal, 0) || 1
    
    validItems.forEach(item => {
      const hsn = item.hsnSac || "—"
      if (!summary[hsn]) {
        summary[hsn] = { hsn, taxableValue: 0, igst: 0, cgst: 0, sgst: 0, totalTax: 0 }
      }
      
      const itemRatio = item.lineTotal / totalLineSubtotal
      const itemDiscountPortion = overallDiscountAmount * itemRatio
      const itemTaxable = Math.max(0, item.lineTotal - itemDiscountPortion)
      const itemGst = calculateGSTBreakdown(itemTaxable, user?.state || "", customerState, gstRate)
      
      summary[hsn].taxableValue += itemTaxable
      summary[hsn].igst += itemGst.igst
      summary[hsn].cgst += itemGst.cgst
      summary[hsn].sgst += itemGst.sgst
      summary[hsn].totalTax += itemGst.total
    })
    
    return Object.values(summary)
  }, [invoiceType, taxableAmount, items, overallDiscountAmount, customerState, user?.state, gstRate])

  const hsnTotalTaxable = hsnSummaryMap.reduce((acc, curr) => acc + curr.taxableValue, 0)
  const hsnTotalIgst = hsnSummaryMap.reduce((acc, curr) => acc + curr.igst, 0)
  const hsnTotalCgst = hsnSummaryMap.reduce((acc, curr) => acc + curr.cgst, 0)
  const hsnTotalSgst = hsnSummaryMap.reduce((acc, curr) => acc + curr.sgst, 0)
  const hsnTotalTax = hsnSummaryMap.reduce((acc, curr) => acc + curr.totalTax, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerAddress || !customerState) {
      alert("Please fill in all required customer fields")
      return
    }

    let finalItems: InvoiceItem[] = []

    if (invoiceType === "glass") {
      let srCounter = 1
      glassData.groups.forEach((g) => {
        g.items.forEach((gi) => {
          finalItems.push({
            id: gi.id || `glass-${srCounter}`,
            name: `${g.specification} (${gi.actualWidth}x${gi.actualHeight}mm)`,
            hsnSac: "7007",
            quantity: gi.pcs,
            rate: gi.pcs > 0 ? Number((gi.glassAmount / gi.pcs).toFixed(2)) : gi.glassAmount,
            unit: "sqm",
            discount: 0,
            lineTotal: gi.lineTotal,
          })
          srCounter++
        })
      })
    } else {
      if (items.some((item) => !item.name || item.rate <= 0)) {
        alert("Please fill in all required item details")
        return
      }
      finalItems = items.filter((item) => item.name && item.rate > 0)
    }

    const invoiceData = {
      invoiceType,
      customerName,
      customerAddress,
      customerState,
      customerGSTIN,
      customerPAN,
      date: new Date(invoiceDate),
      items: finalItems,
      glassData: invoiceType === "glass" ? glassData : null,
      subtotal,
      discountType: invoiceType === "standard" ? (overallDiscountType ?? "percentage") : null,
      discountValue: invoiceType === "standard" ? (overallDiscountValue ?? 0) : 0,
      discountAmount: invoiceType === "standard" ? overallDiscountAmount : 0,
      gst: gstBreakdown.total,
      gstBreakdown,
      total,
      status: "unpaid" as const,
    }

    if (isEditing && id) {
      updateInvoice(id, invoiceData)
    } else {
      addInvoice(invoiceData)
    }

    navigate("/dashboard")
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
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.06] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
  const labelCls =
    "block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider"

  return (
    <div className="pt-24 lg:pt-0">
      <motion.div
        className="max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ HEADER ═══ */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isEditing ? "Edit Invoice" : "Create New Invoice"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {isEditing
                ? "Update the invoice details below"
                : "Fill in the details to generate a professional invoice"}
            </p>
          </div>
        </motion.div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start"
        >
          {/* ═══ LEFT: Form ═══ */}
          <div className="space-y-5">

            {/* ── Row 0: INVOICE TYPE SELECTION ── */}
            <motion.div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-4 shadow-sm" variants={itemVariants}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Invoice Format / Mode</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose standard billing or detailed glass processing factory bill</p>
                </div>
                <div className="flex items-center p-1 bg-gray-100 dark:bg-[#1A1A1D] rounded-xl border border-gray-200/60 dark:border-white/[0.06] w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setInvoiceType("standard")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      invoiceType === "standard"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Standard Invoice (Old)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType("glass")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      invoiceType === "glass"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Glass Processing Bill
                  </button>
                </div>
              </div>
            </motion.div>

            {/* ── Row 1: Customer Info + Invoice Details ── */}
            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-5" variants={itemVariants}>

              {/* Customer Information */}
              <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-white/[0.04]">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Customer Information</h3>
                </div>
                <div className="space-y-3.5">
                  {/* Name + autocomplete */}
                  <div>
                    <label className={labelCls}>Customer Name *</label>
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={customerName}
                        onChange={(e) => { setCustomerName(e.target.value); setShowSuggestions(true) }}
                        onFocus={() => setShowSuggestions(true)}
                        className={inputCls}
                        placeholder="Enter customer name"
                        required
                        autoComplete="off"
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-xl overflow-hidden"
                        >
                          {suggestions.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onMouseDown={() => handleSelectCustomer(name)}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-[#212124] flex items-center gap-2.5 transition-colors"
                            >
                              <span className={`w-6 h-6 rounded-full ${getAvatarGradient(name)} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
                                {name.charAt(0).toUpperCase()}
                              </span>
                              <span>{name}</span>
                              <span className="ml-auto text-[10px] text-gray-400">autofill ↵</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Address */}
                  <div>
                    <label className={labelCls}>Customer Address *</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className={`${inputCls} resize-none`}
                      placeholder="Enter customer address"
                      rows={3}
                      required
                    />
                  </div>
                  {/* State */}
                  <div>
                    <label className={labelCls}>State *</label>
                    <input
                      type="text"
                      value={customerState}
                      onChange={(e) => setCustomerState(e.target.value)}
                      className={inputCls}
                      placeholder="Enter customer state"
                      required
                    />
                  </div>
                  {/* GSTIN + PAN side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>GSTIN/UIN</label>
                      <input
                        type="text"
                        value={customerGSTIN}
                        onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                        className={inputCls}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>PAN Number</label>
                      <input
                        type="text"
                        value={customerPAN}
                        onChange={(e) => setCustomerPAN(e.target.value.toUpperCase())}
                        className={inputCls}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-white/[0.04]">
                  <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Invoice Details</h3>
                </div>
                <div className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className={labelCls}>Invoice Date *</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className={labelCls}>GST Tax Rate</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { rate: 18, label: "GST 18%" },
                        { rate: 5, label: "GST 5%" },
                        { rate: 0, label: "No Tax" },
                      ].map((item) => (
                        <button
                          key={item.rate}
                          type="button"
                          onClick={() => setGstRate(item.rate)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            gstRate === item.rate
                              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                              : "bg-white dark:bg-[#151518] border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/30"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invoice # Preview */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] p-3.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Invoice # Preview</p>
                    {user?.invoicePrefix ? (
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Next:{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-bold ez-mono">
                          {user.invoicePrefix}-{invoiceFY}-XXXX
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠ Set invoice prefix in Profile
                      </p>
                    )}
                  </div>

                  {/* GST Preview */}
                  <div className="rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] p-3.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">GST Calculation</p>
                    {customerState && user?.state ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {customerState.toLowerCase().trim() === user.state.toLowerCase().trim()
                          ? `✓ Same state (${user.state}) — CGST + SGST @ ${gstRate / 2}% each`
                          : `✓ Interstate — IGST @ ${gstRate}% will apply`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Enter customer state to preview</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Line Items / Glass Builder Section ── */}
            {invoiceType === "glass" ? (
              <motion.div variants={itemVariants} className="space-y-6">
                {/* ── GLASS ITEM GROUPS ── */}
                <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Glass Specifications & Processing Items</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Group items by Glass Type, Thickness, Tempering & Edge Finish</p>
                      </div>
                    </div>
                    <Button type="button" onClick={addGlassGroup} icon={Plus} size="sm">
                      Add Glass Category
                    </Button>
                  </div>

                  {glassData.groups.map((group, groupIdx) => {
                    const groupTotal = glassTotals.groupTotals.find(gt => gt.groupId === group.id)
                    return (
                      <div key={group.id} className="border border-gray-200 dark:border-white/[0.08] rounded-xl p-4 bg-gray-50/50 dark:bg-white/[0.01] space-y-4">
                        {/* Group Header Spec */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#151518] p-3 rounded-lg border border-gray-200 dark:border-white/[0.06]">
                          <div className="flex-1">
                            <label className={labelCls}>Glass Specification / Group Header *</label>
                            <input
                              type="text"
                              value={group.specification}
                              onChange={(e) => updateGlassGroupSpec(group.id, e.target.value)}
                              className={`${inputCls} font-bold text-blue-600 dark:text-blue-400`}
                              placeholder="e.g. 12 MM CLEAR FLOAT FLAT, TOUGHENED, POLISH(Flat & Arris), HOLE"
                              required
                            />
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => addGlassItem(group.id)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> + Glass Item
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGlassGroup(group.id)}
                              disabled={glassData.groups.length === 1}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-20 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              title="Delete Group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[750px]" style={{ fontSize: "11px" }}>
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-white/[0.08] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider" style={{ fontSize: "9px" }}>
                                <th className="py-1.5 px-1 w-[32px] text-center">Sr</th>
                                <th className="py-1.5 px-1 w-[170px]">Actual Size (mm)</th>
                                <th className="py-1.5 px-1 w-[48px] text-center">PCS</th>
                                <th className="py-1.5 px-1 w-[80px]">Act. SQMS</th>
                                <th className="py-1.5 px-1 w-[110px]">Notes / DRG</th>
                                <th className="py-1.5 px-1 w-[170px]">Charged Size (mm)</th>
                                <th className="py-1.5 px-1 w-[80px]">Ch. SQMS</th>
                                <th className="py-1.5 px-1 w-[90px] text-right">Rate/SQMS</th>
                                <th className="py-1.5 px-1 w-[95px] text-right">Glass Amt</th>
                                <th className="py-1.5 px-1 w-[28px] text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                              {group.items.map((item, itemIdx) => (
                                <tr key={item.id} className="hover:bg-white dark:hover:bg-[#151518] transition-colors">
                                  <td className="py-2 px-1 text-center font-bold text-gray-500">{itemIdx + 1}</td>
                                  <td className="py-2 px-2">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={item.actualWidth || ""}
                                        onChange={(e) => updateGlassItem(group.id, item.id, "actualWidth", Number(e.target.value))}
                                        className={`${inputCls} text-center font-mono font-semibold`}
                                        style={{ minWidth: "60px", fontSize: "11px", padding: "4px 6px" }}
                                        placeholder="W"
                                        required
                                      />
                                      <span className="text-gray-400 font-bold flex-shrink-0 text-xs">×</span>
                                      <input
                                        type="number"
                                        value={item.actualHeight || ""}
                                        onChange={(e) => updateGlassItem(group.id, item.id, "actualHeight", Number(e.target.value))}
                                        className={`${inputCls} text-center font-mono font-semibold`}
                                        style={{ minWidth: "60px", fontSize: "11px", padding: "4px 6px" }}
                                        placeholder="H"
                                        required
                                      />
                                    </div>
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5 px-0.5">
                                      {item.actualInches || formatGlassSizeInches(item.actualWidth, item.actualHeight)}
                                    </div>
                                  </td>
                                  <td className="py-2 px-1">
                                    <input
                                      type="number"
                                      value={item.pcs || 1}
                                      onChange={(e) => updateGlassItem(group.id, item.id, "pcs", Number(e.target.value))}
                                      className={`${inputCls} text-center font-bold`}
                                      style={{ fontSize: "11px", padding: "4px 4px" }}
                                      min="1"
                                      required
                                    />
                                  </td>
                                  <td className="py-2 px-2 font-mono font-semibold text-gray-700 dark:text-gray-300">
                                    {item.actualSqms || calculateMMtoSqms(item.actualWidth, item.actualHeight, item.pcs)}
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={item.drgHolesNotes || ""}
                                      onChange={(e) => updateGlassItem(group.id, item.id, "drgHolesNotes", e.target.value)}
                                      className={`${inputCls} text-xs`}
                                      style={{ fontSize: "10px", padding: "4px 6px" }}
                                      placeholder="e.g. DRG Holes: 4"
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={item.chargedWidth || item.actualWidth || ""}
                                        onChange={(e) => updateGlassItem(group.id, item.id, "chargedWidth", Number(e.target.value))}
                                        className={`${inputCls} text-center font-mono font-semibold bg-blue-50/50 dark:bg-blue-950/20`}
                                        style={{ minWidth: "60px", fontSize: "11px", padding: "4px 6px" }}
                                        placeholder="CW"
                                      />
                                      <span className="text-gray-400 font-bold flex-shrink-0 text-xs">×</span>
                                      <input
                                        type="number"
                                        value={item.chargedHeight || item.actualHeight || ""}
                                        onChange={(e) => updateGlassItem(group.id, item.id, "chargedHeight", Number(e.target.value))}
                                        className={`${inputCls} text-center font-mono font-semibold bg-blue-50/50 dark:bg-blue-950/20`}
                                        style={{ minWidth: "60px", fontSize: "11px", padding: "4px 6px" }}
                                        placeholder="CH"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={item.chargedRefNotes || ""}
                                      onChange={(e) => updateGlassItem(group.id, item.id, "chargedRefNotes", e.target.value)}
                                      className={`${inputCls} mt-0.5`}
                                      style={{ fontSize: "10px", padding: "3px 6px" }}
                                      placeholder="Ref.-"
                                    />
                                  </td>
                                  <td className="py-2 px-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {item.chargedSqms || calculateMMtoSqms(item.chargedWidth, item.chargedHeight, item.pcs)}
                                  </td>
                                  <td className="py-2 px-2 text-right">
                                    <input
                                      type="number"
                                      value={item.ratePerSqm || ""}
                                      onChange={(e) => updateGlassItem(group.id, item.id, "ratePerSqm", Number(e.target.value))}
                                      className={`${inputCls} text-right font-bold`}
                                      style={{ fontSize: "11px", padding: "4px 6px" }}
                                      placeholder="Rate"
                                      step="0.01"
                                      required
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-right font-bold ez-mono text-gray-900 dark:text-white">
                                    {formatCurrency(item.glassAmount || 0)}
                                  </td>
                                  <td className="py-2 px-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeGlassItem(group.id, item.id)}
                                      disabled={group.items.length === 1}
                                      className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors"
                                      title="Remove item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Group Sub Total Summary */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-100/70 dark:bg-white/[0.03] p-3 rounded-lg border border-gray-200/50 dark:border-white/[0.04] text-xs font-semibold">
                          <span className="italic text-gray-500">Sub Total for Category #{groupIdx + 1}</span>
                          <div className="flex items-center gap-4 text-gray-900 dark:text-white font-mono">
                            <span>PCS: <strong>{groupTotal?.pcs || 0}</strong></span>
                            <span>Actual SQMS: <strong>{groupTotal?.actualSqms || 0}</strong></span>
                            <span>Charged SQMS: <strong className="text-blue-600 dark:text-blue-400">{groupTotal?.chargedSqms || 0}</strong></span>
                            <span>Glass Amount: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(groupTotal?.glassAmount || 0)}</strong></span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── GLASS EXTRA CHARGES & ASSURANCE ── */}
                <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-white/[0.04]">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                    <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Glass Processing Additional Charges</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hole Charges */}
                    <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                      <label className={labelCls}>Hole Charges</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] text-gray-400 block">Total Holes</span>
                          <input
                            type="number"
                            value={glassData.holeChargesCount || ""}
                            onChange={(e) => updateGlassExtra("holeChargesCount", Number(e.target.value))}
                            className={inputCls}
                            placeholder="Count"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Rate / Hole</span>
                          <input
                            type="number"
                            value={glassData.holeChargesRate || ""}
                            onChange={(e) => updateGlassExtra("holeChargesRate", Number(e.target.value))}
                            className={inputCls}
                            placeholder="Rate"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Amount (₹)</span>
                          <input
                            type="number"
                            value={glassData.holeChargesAmount || ""}
                            onChange={(e) => updateGlassExtra("holeChargesAmount", Number(e.target.value))}
                            className={`${inputCls} font-bold text-right`}
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cutout Charges */}
                    <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                      <label className={labelCls}>Cutout Charges</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] text-gray-400 block">Total Cutouts</span>
                          <input
                            type="number"
                            value={glassData.cutoutChargesCount || ""}
                            onChange={(e) => updateGlassExtra("cutoutChargesCount", Number(e.target.value))}
                            className={inputCls}
                            placeholder="Count"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Rate / Cutout</span>
                          <input
                            type="number"
                            value={glassData.cutoutChargesRate || ""}
                            onChange={(e) => updateGlassExtra("cutoutChargesRate", Number(e.target.value))}
                            className={inputCls}
                            placeholder="Rate"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 block">Amount (₹)</span>
                          <input
                            type="number"
                            value={glassData.cutoutChargesAmount || ""}
                            onChange={(e) => updateGlassExtra("cutoutChargesAmount", Number(e.target.value))}
                            className={`${inputCls} font-bold text-right`}
                            placeholder="Amount"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Admin Charge */}
                    <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02]">
                      <label className={labelCls}>Admin Charges (₹)</label>
                      <input
                        type="number"
                        value={glassData.adminCharge || ""}
                        onChange={(e) => updateGlassExtra("adminCharge", Number(e.target.value))}
                        className={`${inputCls} font-bold text-right`}
                        placeholder="Admin Charge"
                      />
                    </div>

                    {/* Assurance Charge */}
                    <div className="p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] space-y-1.5">
                      <label className={labelCls}>Assurance Charges (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={glassData.assuranceChargeRate || ""}
                          onChange={(e) => updateGlassExtra("assuranceChargeRate", Number(e.target.value))}
                          className={inputCls}
                          placeholder="e.g. 1.5"
                          step="0.1"
                        />
                        <div className="px-3 py-2 bg-gray-100 dark:bg-[#151518] rounded-xl text-xs font-bold ez-mono text-gray-900 dark:text-white">
                          ₹{glassTotals.assuranceChargeAmount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Standard Invoice Line Items Builder */
              <motion.div variants={itemVariants}>
                <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                      <div>
                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Line Items</h3>
                      </div>
                    </div>
                    <Button onClick={addItem} icon={Plus} size="sm">Add Item</Button>
                  </div>

                  <div className="space-y-2">
                    {/* Desktop header */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 px-1 pb-2.5 text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest border-b border-gray-100 dark:border-white/[0.04] mb-2">
                      <div className="md:col-span-3">Item / Service *</div>
                      <div className="md:col-span-2 text-center">HSN/SAC</div>
                      <div className="md:col-span-1 text-center">Qty</div>
                      <div className="md:col-span-1 text-center">Unit</div>
                      <div className="md:col-span-2 text-right">Rate *</div>
                      <div className="md:col-span-1 text-center">Disc%</div>
                      <div className="md:col-span-1 text-right">Amount</div>
                      <div className="md:col-span-1" />
                    </div>

                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        className="p-3.5 md:p-2 bg-gray-50/60 dark:bg-white/[0.01] border border-gray-100 dark:border-white/[0.03] md:border-b md:border-t-0 md:border-x-0 md:border-white/[0.03] rounded-xl md:rounded-none space-y-4 md:space-y-0 transition-all"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* Mobile */}
                        <div className="block md:hidden space-y-3.5">
                          <div>
                            <label className={labelCls}>Item Name *</label>
                            <input type="text" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} className={inputCls} placeholder="Enter item name" required />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={labelCls}>HSN/SAC</label>
                              <input type="text" value={item.hsnSac} onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)} className={`${inputCls} text-center`} placeholder="HSN" />
                            </div>
                            <div>
                              <label className={labelCls}>Qty *</label>
                              <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)} className={`${inputCls} text-center`} min="1" required />
                            </div>
                            <div>
                              <label className={labelCls}>Unit</label>
                              <select value={item.unit || "pcs"} onChange={(e) => handleUnitChange(item.id, e.target.value)} className={`${inputCls} cursor-pointer`}>
                                {["pcs","kg","nos","ltr","box","mtr","hrs","days","set","pkts","bags","g","tons","sqft","sqm","srv"].map(u => <option key={u} value={u}>{u}</option>)}
                                {item.unit && !["pcs","kg","nos","ltr","box","mtr","hrs","days","set","pkts","bags","g","tons","sqft","sqm","srv"].includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                                <option value="custom">+ Custom...</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={labelCls}>Rate *</label>
                              <input type="number" placeholder="Rate" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)} className={`${inputCls} text-right`} min="0" step="0.01" required />
                            </div>
                            <div>
                              <label className={labelCls}>Disc (%)</label>
                              <input type="number" placeholder="0" value={item.discount === 0 ? "" : item.discount} onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)} className={`${inputCls} text-center`} min="0" max="100" step="0.1" />
                            </div>
                            <div>
                              <label className={labelCls}>Amount</label>
                              <div className="px-3.5 py-2.5 bg-gray-100 dark:bg-[#151518] border border-gray-200 dark:border-white/[0.06] rounded-xl text-gray-900 dark:text-white text-sm font-bold text-right ez-mono">{formatCurrency(item.lineTotal)}</div>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1} className="text-xs text-red-400 hover:text-red-500 disabled:opacity-20 flex items-center gap-1.5 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                          </div>
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-3">
                            <input type="text" value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} className={inputCls} placeholder="Item name" required />
                          </div>
                          <div className="md:col-span-2">
                            <input type="text" value={item.hsnSac} onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)} className={`${inputCls} text-center`} placeholder="HSN" />
                          </div>
                          <div className="md:col-span-1">
                            <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)} className={`${inputCls} text-center`} min="1" required />
                          </div>
                          <div className="md:col-span-1">
                            <select value={item.unit || "pcs"} onChange={(e) => handleUnitChange(item.id, e.target.value)} className={`${inputCls} cursor-pointer`}>
                              {["pcs","kg","nos","ltr","box","mtr","hrs","days","set","pkts","bags","g","tons","sqft","sqm","srv"].map(u => <option key={u} value={u}>{u}</option>)}
                              {item.unit && !["pcs","kg","nos","ltr","box","mtr","hrs","days","set","pkts","bags","g","tons","sqft","sqm","srv"].includes(item.unit) && <option value={item.unit}>{item.unit}</option>}
                              <option value="custom">+ Custom...</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <input type="number" placeholder="Rate" value={item.rate === 0 ? "" : item.rate} onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)} className={`${inputCls} text-right`} min="0" step="0.01" required />
                          </div>
                          <div className="md:col-span-1">
                            <input type="number" placeholder="0" value={item.discount === 0 ? "" : item.discount} onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)} className={`${inputCls} text-center`} min="0" max="100" step="0.1" />
                          </div>
                          <div className="md:col-span-1 text-right font-bold text-gray-900 dark:text-white text-sm ez-mono px-1">
                            {formatCurrency(item.lineTotal)}
                          </div>
                          <div className="md:col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-20 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Summary ── */}
            <motion.div variants={itemVariants}>
              <div className="bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.05] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100 dark:border-white/[0.04]">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span>
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Invoice Summary</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold ez-mono">{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Overall Discount */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Overall Discount</span>
                      <select
                        value={overallDiscountType}
                        onChange={(e) => setOverallDiscountType(e.target.value as "percentage" | "flat")}
                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.06] rounded-lg text-gray-900 dark:text-white focus:outline-none transition-all font-semibold cursor-pointer"
                      >
                        <option value="percentage">%</option>
                        <option value="flat">₹ Flat</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={overallDiscountValue === 0 ? "" : overallDiscountValue}
                        onChange={(e) => setOverallDiscountValue(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                        className="w-24 px-3 py-1.5 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.06] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-right font-medium transition-all"
                        placeholder="0"
                        min="0"
                      />
                      {overallDiscountAmount > 0 && (
                        <span className="text-xs text-blue-500 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                          -{formatCurrency(overallDiscountAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {overallDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>Taxable Amount</span>
                      <span className="font-semibold ez-mono">{formatCurrency(taxableAmount)}</span>
                    </div>
                  )}

                  {gstBreakdown.isInterState ? (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>IGST @ {gstRate}%</span>
                      <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.igst)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>CGST @ {gstRate / 2}%</span>
                        <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>SGST @ {gstRate / 2}%</span>
                        <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.sgst)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/[0.06] pt-3 mt-1">
                    <span className="text-base">Total Due</span>
                    <span className="text-blue-600 dark:text-blue-400 ez-mono text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Actions ── */}
            <motion.div className="flex flex-col sm:flex-row gap-3" variants={itemVariants}>
              <Button type="submit" icon={Save} size="lg" className="flex-1">
                {isEditing ? "Update Invoice" : "Save Invoice"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                size="lg"
              >
                Cancel
              </Button>
            </motion.div>
          </div>

          {/* ═══ RIGHT: Live Preview ═══ */}
          <div className="xl:sticky xl:top-6 hidden xl:block">
            <Card
              className="p-0 border border-gray-200 dark:border-white/[0.06] overflow-hidden shadow-2xl bg-white text-gray-900 rounded-2xl select-none relative"
              padding="sm"
            >
              <div className="bg-gray-50/50 dark:bg-zinc-900/40 px-4 py-3 border-b border-gray-200/50 dark:border-white/[0.04] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  {invoiceType === "glass" ? "Glass Factory Processing Bill" : "Classic Template"}
                </span>
              </div>
              <div className="p-6 bg-white text-[#111827] text-left select-none text-[10px]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                <div className="border border-gray-400 p-3 space-y-2.5 bg-white">
                  {/* Title & Copy */}
                  <div className="flex justify-between items-center pb-1.5 border-b border-gray-300">
                    <span className="text-sm font-bold tracking-tight text-gray-900">TAX INVOICE</span>
                    <span className="text-[7.5px] font-bold border border-gray-300 px-1.5 py-0.5 uppercase text-gray-800">ORIGINAL FOR RECIPIENT</span>
                  </div>
                  {/* Issuer & Invoice Details */}
                  <div className="flex justify-between pb-2.5 border-b border-gray-300 gap-3">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 border border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0">
                        {user?.businessLogo ? (
                          <img src={user.businessLogo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-[9px]">{user?.fullName?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[10.5px] leading-tight text-gray-900">{user?.fullName || "Your Business"}</p>
                        <p className="text-gray-500 text-[7.5px] mt-0.5 leading-relaxed">
                          {user?.address || "Address details"}<br />
                          {user?.state && `State: ${user.state}`}<br />
                          {user?.gstNumber && `GSTIN: ${user.gstNumber}`}<br />
                          {user?.panNumber && `PAN: ${user.panNumber}`}<br />
                          {user?.phoneNumber && `Mobile: ${user.phoneNumber}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[7.5px] text-gray-500">
                      <p className="font-bold text-gray-900 text-[8.5px] mb-0.5">Invoice No.</p>
                      <p className="mb-1.5 font-mono text-gray-800 font-semibold">{displayInvoiceNumber}</p>
                      <p className="font-bold text-gray-900 text-[8.5px] mb-0.5">Invoice Date</p>
                      <p className="mb-0 text-gray-800 font-semibold">{invoiceDate ? formatDate(new Date(invoiceDate)) : "—"}</p>
                    </div>
                  </div>
                  {/* Customer (BILL TO) */}
                  <div>
                    <span className="text-[7.5px] font-bold text-gray-400 block uppercase tracking-wider mb-0.5">BILL TO</span>
                    <p className="font-bold text-[10.5px] text-gray-900">{customerName || "Customer Name"}</p>
                    <p className="text-gray-500 text-[7.5px] mt-0.5 leading-relaxed">
                      {customerAddress && <span>Address: {customerAddress}<br /></span>}
                      {customerState && <span>State: {customerState}<br /></span>}
                      {customerGSTIN && <span>GSTIN: {customerGSTIN}<br /></span>}
                      {customerPAN && <span>PAN: {customerPAN}</span>}
                    </p>
                  </div>

                  {/* Items List or Glass Factory Table */}
                  {invoiceType === "glass" ? (() => {
                    let glassSrCounter = 1
                    return (
                      <div className="text-[6.5px]">
                        {/* Simplified glass preview - key columns only */}
                        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
                          <thead>
                            <tr className="border-t border-b border-gray-900 text-center font-bold text-[5.5px] uppercase">
                              <th style={{ width: "5%" }} className="p-0.5">Sr</th>
                              <th style={{ width: "18%" }} className="p-0.5 text-left">SIZE</th>
                              <th style={{ width: "5%" }} className="p-0.5">PCS</th>
                              <th style={{ width: "12%" }} className="p-0.5 text-right border-r border-dashed border-gray-400">SQMS</th>
                              <th style={{ width: "12%" }} className="p-0.5 text-right border-r border-dashed border-gray-400">Ch.SQMS</th>
                              <th style={{ width: "10%" }} className="p-0.5 text-right">RATE</th>
                              <th style={{ width: "15%" }} className="p-0.5 text-right border-r border-dashed border-gray-400">GLASS AMT</th>
                              <th style={{ width: "15%" }} className="p-0.5 text-right">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {glassData.groups.map((group) => {
                              const groupTotal = glassTotals.groupTotals.find(gt => gt.groupId === group.id)
                              return (
                                <React.Fragment key={group.id}>
                                  <tr>
                                    <td colSpan={8} className="pt-1.5 pb-0.5 font-bold text-[6px] uppercase border-b border-dashed border-gray-400">
                                      {group.specification}
                                    </td>
                                  </tr>
                                  {group.items.map((item) => {
                                    const sr = glassSrCounter++
                                    const actualSqms = item.actualSqms || calculateMMtoSqms(item.actualWidth, item.actualHeight, item.pcs)
                                    const chargedSqms = item.chargedSqms || calculateMMtoSqms(item.chargedWidth, item.chargedHeight, item.pcs)
                                    const glassAmt = item.glassAmount || Number((chargedSqms * item.ratePerSqm).toFixed(2))

                                    return (
                                      <tr key={item.id}>
                                        <td className="p-0.5 text-center">{sr}</td>
                                        <td className="p-0.5 font-mono whitespace-nowrap">{item.actualWidth} x {item.actualHeight}</td>
                                        <td className="p-0.5 text-center">{item.pcs}</td>
                                        <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{actualSqms.toFixed(4)}</td>
                                        <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{chargedSqms.toFixed(4)}</td>
                                        <td className="p-0.5 text-right font-mono">{item.ratePerSqm ? item.ratePerSqm.toLocaleString("en-IN") : ""}</td>
                                        <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{glassAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                        <td className="p-0.5 text-right font-mono font-bold">{glassAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    )
                                  })}
                                  <tr className="border-t border-b border-dashed border-gray-400 italic font-semibold text-[5.5px]">
                                    <td colSpan={2} className="p-0.5 text-right">Sub Total</td>
                                    <td className="p-0.5 text-center">{groupTotal?.pcs || 0}</td>
                                    <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{groupTotal?.actualSqms?.toFixed(4) || "0.0000"}</td>
                                    <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{groupTotal?.chargedSqms?.toFixed(4) || "0.0000"}</td>
                                    <td></td>
                                    <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{groupTotal?.glassAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}</td>
                                    <td className="p-0.5 text-right font-mono">{groupTotal?.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}</td>
                                  </tr>
                                </React.Fragment>
                              )
                            })}
                            <tr className="border-t border-b border-gray-900 font-bold text-[6px]">
                              <td colSpan={2} className="p-0.5">TOTAL</td>
                              <td className="p-0.5 text-center">{glassTotals.totalPcs}</td>
                              <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{glassTotals.totalActualSqms.toFixed(4)}</td>
                              <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{glassTotals.totalChargedSqms.toFixed(4)}</td>
                              <td></td>
                              <td className="p-0.5 text-right font-mono border-r border-dashed border-gray-300">{glassTotals.totalGlassAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td className="p-0.5 text-right font-mono">{glassTotals.totalGlassAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Charges summary - right aligned */}
                        <div className="text-[6px] mt-1.5 border-t border-gray-900 pt-1 space-y-0.5">
                          {glassData.holeChargesCount ? (
                            <div className="flex justify-end gap-4">
                              <span>HOLE CHARGES {glassData.holeChargesCount} NOS @</span>
                              <span className="font-mono w-16 text-right">{glassTotals.holeChargesAmount || ""}</span>
                            </div>
                          ) : null}
                          {glassData.cutoutChargesCount ? (
                            <div className="flex justify-end gap-4">
                              <span>CUTOUT CHARGES {glassData.cutoutChargesCount} NOS @</span>
                              <span className="font-mono w-16 text-right">{glassTotals.cutoutChargesAmount || ""}</span>
                            </div>
                          ) : null}
                          {glassTotals.adminCharge > 0 && (
                            <div className="flex justify-end gap-4">
                              <span>ADMIN CHARGE</span>
                              <span className="font-mono w-16 text-right">{glassTotals.adminCharge.toFixed(2)}</span>
                            </div>
                          )}
                          {glassTotals.assuranceChargeAmount > 0 && (
                            <div className="flex justify-end gap-4">
                              <span>ASSURANCE CHARGES @{glassData.assuranceChargeRate || 1.5}%</span>
                              <span className="font-mono w-16 text-right">{glassTotals.assuranceChargeAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-end gap-4 font-bold border-t border-dashed border-gray-400 pt-0.5">
                            <span>ASSESSABLE VALUE</span>
                            <span className="font-mono w-16 text-right">{glassTotals.assessableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                          {gstBreakdown.isInterState ? (
                            <div className="flex justify-end gap-4 font-semibold">
                              <span>ADD IGST @ {gstRate}%</span>
                              <span className="font-mono w-16 text-right">{gstBreakdown.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-end gap-4 font-semibold">
                                <span>ADD SGST @ {gstRate / 2}%</span>
                                <span className="font-mono w-16 text-right">{gstBreakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-end gap-4 font-semibold">
                                <span>ADD CGST @ {gstRate / 2}%</span>
                                <span className="font-mono w-16 text-right">{gstBreakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-end gap-4 font-bold text-[7px] border-t border-b border-gray-900 py-0.5">
                            <span>TOTAL AMOUNT (IN RUPEES)</span>
                            <span className="font-mono w-16 text-right">₹{Math.round(total).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })() : (
                    /* Standard Items Table */
                    <div className="border border-gray-300 rounded-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-300 text-[6px] font-bold text-gray-700">
                            <th className="p-1 text-center w-[5%] border-r border-gray-300">S.NO</th>
                            <th className="p-1 border-r border-gray-300 w-[28%]">SERVICES</th>
                            <th className="p-1 text-center w-[12%] border-r border-gray-300">HSN/SAC</th>
                            <th className="p-1 text-center w-[8%] border-r border-gray-300">QTY</th>
                            <th className="p-1 text-center w-[8%] border-r border-gray-300">UNIT</th>
                            <th className="p-1 text-right w-[12%] border-r border-gray-300">RATE</th>
                            <th className="p-1 text-right w-[10%] border-r border-gray-300">DISC</th>
                            <th className="p-1 text-right w-[17%]">AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-gray-300 text-[7px] text-gray-800">
                              <td className="p-1 text-center border-r border-gray-300">{idx + 1}</td>
                              <td className="p-1 border-r border-gray-300 font-medium truncate max-w-[80px]">{item.name || "Item Name"}</td>
                              <td className="p-1 text-center border-r border-gray-300">{item.hsnSac || "—"}</td>
                              <td className="p-1 text-center border-r border-gray-300">{item.quantity}</td>
                              <td className="p-1 text-center border-r border-gray-300">{item.unit || "pcs"}</td>
                              <td className="p-1 text-right border-r border-gray-300">{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td className="p-1 text-right border-r border-gray-300">{item.discount ? `${item.discount}%` : "—"}</td>
                              <td className="p-1 text-right font-semibold">{item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 border-t border-gray-300 font-semibold text-[7px] text-gray-800">
                            <td colSpan={7} className="p-1 text-right border-r border-gray-300">Subtotal:</td>
                            <td className="p-1 text-right">{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                          {overallDiscountAmount > 0 && (
                            <tr className="bg-gray-50 font-semibold text-[7px] text-blue-600">
                              <td colSpan={7} className="p-1 text-right border-r border-gray-300">Overall Discount {overallDiscountType === "percentage" ? `(${overallDiscountValue}%)` : ""}:</td>
                              <td className="p-1 text-right">-{overallDiscountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                          {gstBreakdown.isInterState ? (
                            <tr className="bg-gray-50 text-[7px] text-gray-800">
                              <td colSpan={7} className="p-1 text-right border-r border-gray-300 font-semibold">IGST ({gstRate}%):</td>
                              <td className="p-1 text-right font-semibold">{gstBreakdown.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ) : (
                            <>
                              <tr className="bg-gray-50 text-[7px] text-gray-800">
                                <td colSpan={7} className="p-1 text-right border-r border-gray-300 font-semibold">CGST ({gstRate / 2}%):</td>
                                <td className="p-1 text-right font-semibold">{gstBreakdown.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              </tr>
                              <tr className="bg-gray-50 text-[7px] text-gray-800">
                                <td colSpan={7} className="p-1 text-right border-r border-gray-300 font-semibold">SGST ({gstRate / 2}%):</td>
                                <td className="p-1 text-right font-semibold">{gstBreakdown.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              </tr>
                            </>
                          )}
                          <tr className="bg-gray-100 border-t border-gray-300 font-bold text-[8px] text-gray-900">
                            <td colSpan={7} className="p-1 text-right border-r border-gray-300">TOTAL:</td>
                            <td className="p-1 text-right">₹{Math.round(total).toLocaleString("en-IN")}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Tax Summary Table (for standard invoice) */}
                  {invoiceType === "standard" && (
                    <div className="border border-gray-300 rounded-sm overflow-hidden">
                      <table className="w-full text-[6px] text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-300 text-[5.5px] font-bold text-gray-750 text-center">
                            <th className="p-1 border-r border-gray-300">HSN/SAC</th>
                            <th className="p-1 border-r border-gray-300">Taxable Value</th>
                            {gstBreakdown.isInterState ? (
                              <>
                                <th className="p-1 border-r border-gray-300">IGST Rate</th>
                                <th className="p-1 border-r border-gray-300">IGST Amt</th>
                              </>
                            ) : (
                              <>
                                <th className="p-1 border-r border-gray-300">CGST Rate</th>
                                <th className="p-1 border-r border-gray-300">CGST Amt</th>
                                <th className="p-1 border-r border-gray-300">SGST Rate</th>
                                <th className="p-1 border-r border-gray-300">SGST Amt</th>
                              </>
                            )}
                            <th className="p-1">Total Tax</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hsnSummaryMap.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-300 text-center text-[6px] text-gray-700">
                              <td className="p-1 border-r border-gray-300 font-bold">{row.hsn}</td>
                              <td className="p-1 border-r border-gray-300 text-right">{row.taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              {gstBreakdown.isInterState ? (
                                <>
                                  <td className="p-1 border-r border-gray-300">{gstRate}%</td>
                                  <td className="p-1 border-r border-gray-300 text-right">{row.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </>
                              ) : (
                                <>
                                  <td className="p-1 border-r border-gray-300">{(gstRate / 2)}%</td>
                                  <td className="p-1 border-r border-gray-300 text-right">{row.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                  <td className="p-1 border-r border-gray-300">{(gstRate / 2)}%</td>
                                  <td className="p-1 border-r border-gray-300 text-right">{row.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </>
                              )}
                              <td className="p-1 text-right font-bold">{row.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold text-center text-[6px] text-gray-800">
                            <td className="p-1 border-r border-gray-300">Total</td>
                            <td className="p-1 border-r border-gray-300 text-right">{hsnTotalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            {gstBreakdown.isInterState ? (
                              <>
                                <td className="p-1 border-r border-gray-300"></td>
                                <td className="p-1 border-r border-gray-300 text-right">{hsnTotalIgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              </>
                            ) : (
                              <>
                                <td className="p-1 border-r border-gray-300"></td>
                                <td className="p-1 border-r border-gray-300 text-right">{hsnTotalCgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                <td className="p-1 border-r border-gray-300"></td>
                                <td className="p-1 border-r border-gray-300 text-right">{hsnTotalSgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              </>
                            )}
                            <td className="p-1 text-right">{hsnTotalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Amount in words */}
                  <div className="border border-gray-200 p-1.5 bg-gray-50/30">
                    <p className="font-bold text-[7.5px] text-gray-900 mb-0.5">Total Amount (in words)</p>
                    <p className="text-[7.5px] font-medium italic text-gray-650 leading-normal">{convertToWords(total)}</p>
                  </div>

                  {/* 3-Column Footer: Bank | Terms | Signature */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Bank Details */}
                    <div className="border border-gray-250 p-1.5 bg-gray-50/30">
                      <p className="font-bold text-[7.5px] text-gray-900 mb-0.5">Bank Details</p>
                      <div className="text-[6.5px] text-gray-500 space-y-0.5 leading-normal">
                        <p className="truncate">Name: {user?.bankName || "—"}</p>
                        <p className="truncate">IFSC: {user?.ifscCode || "—"}</p>
                        <p className="truncate">A/c No: {user?.accountNumber || "—"}</p>
                      </div>
                    </div>
                    {/* Terms */}
                    <div className="border border-gray-250 p-1.5 bg-gray-50/30">
                      <p className="font-bold text-[7.5px] text-gray-900 mb-0.5">Terms & Conditions</p>
                      <div className="text-[6px] text-gray-500 space-y-0.5 leading-tight">
                        <p>1. Disputes subject to courts in {user?.state || "jurisdiction"}.</p>
                        <p>2. TDS Deduction under Sec 194C.</p>
                      </div>
                    </div>
                    {/* Signature */}
                    <div className="border border-gray-250 p-1.5 bg-gray-50/30 text-center flex flex-col justify-between items-center h-full min-h-[62px]">
                      {user?.signature ? (
                        <img src={user.signature} alt="Sign" className="max-h-6.5 object-contain mx-auto opacity-90 mb-1" />
                      ) : (
                        <div className="h-5.5 w-full border-b border-dashed border-gray-300 mb-1" />
                      )}
                      <div>
                        <p className="text-[5.5px] text-gray-400 font-bold uppercase tracking-wider leading-none">Authorised Signatory For</p>
                        <p className="text-[7px] text-gray-900 font-bold leading-tight truncate max-w-[100px] mt-0.5">{user?.fullName || "Your Business"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default CreateInvoice

