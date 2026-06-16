"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import type { InvoiceItem } from "../../types"
import { calculateSubtotal, calculateGSTBreakdown, formatCurrency } from "../../utils/calculations"
import { Plus, Save, FileText, Trash2 } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

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
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const invoiceFY = useMemo(() => {
    if (!invoiceDate) return new Date().getFullYear()
    const dateObj = new Date(invoiceDate)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()
    return month >= 3 ? year : year - 1
  }, [invoiceDate])

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

  const [overallDiscountType, setOverallDiscountType] = useState<"percentage" | "flat">("percentage")
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(0)

  useEffect(() => {
    if (isEditing && id) {
      const invoice = getInvoiceById(id)
      if (invoice) {
        setCustomerName(invoice.customerName)
        setCustomerAddress(invoice.customerAddress)
        setCustomerState(invoice.customerState)
        setCustomerGSTIN(invoice.customerGSTIN)
        setCustomerPAN(invoice.customerPAN)
        setInvoiceDate(invoice.date.toISOString().split("T")[0])
        setItems(invoice.items.map(item => ({
          ...item,
          unit: item.unit || "pcs",
          discount: item.discount || 0
        })))
        if (invoice.discountType) setOverallDiscountType(invoice.discountType)
        if (invoice.discountValue !== undefined) setOverallDiscountValue(invoice.discountValue)
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

  const subtotal = calculateSubtotal(items)
  const overallDiscountAmount = useMemo(() => {
    if (overallDiscountType === "percentage") {
      return (subtotal * (overallDiscountValue || 0)) / 100
    }
    return overallDiscountValue || 0
  }, [subtotal, overallDiscountType, overallDiscountValue])

  const taxableAmount = Math.max(0, subtotal - overallDiscountAmount)
  const gstBreakdown = calculateGSTBreakdown(taxableAmount, user?.state || "", customerState)
  const total = taxableAmount + gstBreakdown.total

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName || !customerAddress || !customerState || items.some((item) => !item.name || item.rate <= 0)) {
      alert("Please fill in all required fields")
      return
    }

    const validItems = items.filter((item) => item.name && item.rate > 0)

    const invoiceData = {
      customerName,
      customerAddress,
      customerState,
      customerGSTIN,
      customerPAN,
      date: new Date(invoiceDate),
      items: validItems,
      subtotal,
      discountType: overallDiscountType,
      discountValue: overallDiscountValue,
      discountAmount: overallDiscountAmount,
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

  return (
    <div className="pt-24 lg:pt-0">
      <motion.div
        className="max-w-4xl mx-auto space-y-6 md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex items-center gap-3 md:gap-4" variants={itemVariants}>
          <div className="p-2 md:p-3 bg-blue-500/10 rounded-lg">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">
              {isEditing ? "Edit Invoice" : "Create New Invoice"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base transition-colors">
              {isEditing ? "Update invoice details" : "Generate a professional invoice for your customer"}
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6" variants={itemVariants}>
            <Card>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Customer Name *</label>
                  <div className="relative">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                      placeholder="Enter customer name"
                      required
                      autoComplete="off"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-lg shadow-lg overflow-hidden"
                      >
                        {suggestions.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onMouseDown={() => handleSelectCustomer(name)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-[#212124] flex items-center gap-2 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </span>
                            <span>{name}</span>
                            <span className="ml-auto text-xs text-gray-400">auto-fill ↵</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Customer Address *</label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                    placeholder="Enter customer address"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">State *</label>
                  <input
                    type="text"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                    placeholder="Enter customer state"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">GSTIN/UIN</label>
                  <input
                    type="text"
                    value={customerGSTIN}
                    onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                    placeholder="Enter GSTIN/UIN (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">PAN Number</label>
                  <input
                    type="text"
                    value={customerPAN}
                    onChange={(e) => setCustomerPAN(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                    placeholder="Enter PAN number (optional)"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Invoice Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">Invoice Date *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/40 text-sm transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Invoice Number Preview */}
                <div className="bg-gray-50 dark:bg-[#212124] p-3 md:p-4 rounded-lg transition-colors">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-colors">Invoice Number Preview</h4>
                  <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    {user?.invoicePrefix ? (
                      <p>
                        ✓ Next invoice will be numbered:{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-medium ez-mono">
                          {user.invoicePrefix}-{invoiceFY}-XXXX
                        </span>
                      </p>
                    ) : (
                      <p className="text-yellow-600 dark:text-yellow-400">⚠ Set your invoice prefix in Profile to customize numbering</p>
                    )}
                  </div>
                </div>

                {/* GST Preview */}
                <div className="bg-gray-50 dark:bg-[#212124] p-3 md:p-4 rounded-lg transition-colors">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 transition-colors">GST Calculation Preview</h4>
                  {customerState && user?.state ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customerState.toLowerCase().trim() === user.state.toLowerCase().trim() ? (
                        <p>✓ Same state ({user.state}) - CGST @ 9% + SGST @ 9% will be applied</p>
                      ) : (
                        <p>
                          ✓ Different states (Your: {user.state}, Customer: {customerState}) - IGST @ 18% will be
                          applied
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Enter customer state to see GST calculation</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white transition-colors">Line Items</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add services or products and configure quantity, rates, and discounts</p>
                </div>
                <Button onClick={addItem} icon={Plus} size="sm">
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {/* Table Header Row (Desktop only) */}
                <div className="hidden md:grid md:grid-cols-12 gap-3 px-2 py-2.5 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-white/[0.04] mb-1">
                  <div className="md:col-span-3">Item / Service Name *</div>
                  <div className="md:col-span-1.5 text-center">HSN/SAC</div>
                  <div className="md:col-span-1 text-center">Qty</div>
                  <div className="md:col-span-1 text-center">Unit</div>
                  <div className="md:col-span-1.5 text-right">Rate *</div>
                  <div className="md:col-span-1 text-center">Disc (%)</div>
                  <div className="md:col-span-2 text-right">Amount</div>
                  <div className="md:col-span-1 text-center">Action</div>
                </div>

                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="p-3.5 md:p-2 bg-gray-50 dark:bg-transparent border border-gray-200 dark:border-transparent md:border-b md:border-white/[0.03] rounded-xl md:rounded-none space-y-4 md:space-y-0 transition-all hover:bg-gray-100/30 dark:hover:bg-white/[0.01]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Item Name *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all placeholder:text-gray-500"
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">HSN/SAC</label>
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all text-center placeholder:text-gray-500"
                            placeholder="HSN"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Qty *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all text-center"
                            min="1"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Unit</label>
                          <select
                            value={item.unit || "pcs"}
                            onChange={(e) => handleUnitChange(item.id, e.target.value)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all text-center cursor-pointer"
                          >
                            <option value="pcs">pcs</option>
                            <option value="kg">kg</option>
                            <option value="nos">nos</option>
                            <option value="ltr">ltr</option>
                            <option value="box">box</option>
                            <option value="mtr">mtr</option>
                            <option value="hrs">hrs</option>
                            <option value="days">days</option>
                            <option value="set">set</option>
                            <option value="pkts">pkts</option>
                            <option value="bags">bags</option>
                            <option value="g">g</option>
                            <option value="tons">tons</option>
                            <option value="sqft">sqft</option>
                            <option value="sqm">sqm</option>
                            <option value="srv">srv</option>
                            {item.unit && !["pcs", "kg", "nos", "ltr", "box", "mtr", "hrs", "days", "set", "pkts", "bags", "g", "tons", "sqft", "sqm", "srv"].includes(item.unit) && (
                              <option value={item.unit}>{item.unit}</option>
                            )}
                            <option value="custom" className="text-blue-500 font-semibold">+ Custom...</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Rate *</label>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={item.rate === 0 ? "" : item.rate}
                            onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all text-right"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Disc (%)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.discount === 0 ? "" : item.discount}
                            onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all text-center"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Amount</label>
                          <div className="px-2.5 py-2 bg-gray-100 dark:bg-[#161618] border border-gray-200 dark:border-white/[0.04] rounded-lg text-gray-900 dark:text-white text-xs transition-all font-bold text-right ez-mono">
                            {formatCurrency(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          disabled={items.length === 1}
                        >
                          Remove Item
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all placeholder:text-gray-500"
                          placeholder="Items"
                          required
                        />
                      </div>
                      <div className="md:col-span-1.5">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all text-center placeholder:text-gray-500"
                          placeholder="HSN"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all text-center"
                          min="1"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <select
                          value={item.unit || "pcs"}
                          onChange={(e) => handleUnitChange(item.id, e.target.value)}
                          className="w-full px-2 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all text-center cursor-pointer"
                        >
                          <option value="pcs">pcs</option>
                          <option value="kg">kg</option>
                          <option value="nos">nos</option>
                          <option value="ltr">ltr</option>
                          <option value="box">box</option>
                          <option value="mtr">mtr</option>
                          <option value="hrs">hrs</option>
                          <option value="days">days</option>
                          <option value="set">set</option>
                          <option value="pkts">pkts</option>
                          <option value="bags">bags</option>
                          <option value="g">g</option>
                          <option value="tons">tons</option>
                          <option value="sqft">sqft</option>
                          <option value="sqm">sqm</option>
                          <option value="srv">srv</option>
                          {item.unit && !["pcs", "kg", "nos", "ltr", "box", "mtr", "hrs", "days", "set", "pkts", "bags", "g", "tons", "sqft", "sqm", "srv"].includes(item.unit) && (
                            <option value={item.unit}>{item.unit}</option>
                          )}
                          <option value="custom" className="text-blue-500 font-semibold">+ Custom...</option>
                        </select>
                      </div>
                      <div className="md:col-span-1.5">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate === 0 ? "" : item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all text-right"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.discount === 0 ? "" : item.discount}
                          onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.1] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all text-center"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div className="md:col-span-2 text-right font-bold text-gray-900 dark:text-[#F0F0F3] px-3 py-2 bg-[#1A1A1D]/10 dark:bg-[#151518]/30 rounded-xl text-sm border border-transparent select-all ez-mono transition-all">
                        {formatCurrency(item.lineTotal)}
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-20 disabled:hover:text-gray-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 transition-colors">Invoice Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base transition-colors">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                {/* Overall Discount Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-[#1A1A1D]/30 p-3.5 rounded-2xl border border-gray-200 dark:border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Discount:</span>
                    <select
                      value={overallDiscountType}
                      onChange={(e) => setOverallDiscountType(e.target.value as "percentage" | "flat")}
                      className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      value={overallDiscountValue === 0 ? "" : overallDiscountValue}
                      onChange={(e) => setOverallDiscountValue(Math.max(0, Number.parseFloat(e.target.value) || 0))}
                      className="w-28 px-3 py-1.5 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/[0.04] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-right font-medium transition-all"
                      placeholder="0"
                      min="0"
                    />
                    {overallDiscountAmount > 0 && (
                      <span className="text-xs text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg">
                        -{formatCurrency(overallDiscountAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base transition-colors">
                    <span>Taxable Amount:</span>
                    <span className="font-semibold">{formatCurrency(taxableAmount)}</span>
                  </div>
                )}

                {gstBreakdown.isInterState ? (
                  <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base transition-colors">
                    <span>IGST @ 18%:</span>
                    <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base transition-colors">
                      <span>CGST @ 9%:</span>
                      <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm md:text-base transition-colors">
                      <span>SGST @ 9%:</span>
                      <span className="ez-mono font-medium">{formatCurrency(gstBreakdown.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg md:text-xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/[0.04] pt-3 transition-colors">
                  <span>TOTAL:</span>
                  <span className="text-blue-500 dark:text-blue-400 ez-mono">{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div className="flex flex-col sm:flex-row gap-3 md:gap-4" variants={itemVariants}>
            <Button type="submit" icon={Save} size="lg" className="flex-1 sm:flex-none">
              {isEditing ? "Update Invoice" : "Save Invoice"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}

export default CreateInvoice
