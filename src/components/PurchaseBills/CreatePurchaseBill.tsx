"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import type { PurchaseBillItem } from "../../types"
import { calculateSubtotal, calculateGSTBreakdown, formatCurrency } from "../../utils/calculations"
import { Plus, Minus, Save, ShoppingBag } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const CreatePurchaseBill: React.FC = () => {
  const { addPurchaseBill, updatePurchaseBill, getPurchaseBillById } = useApp()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [vendorName, setVendorName] = useState("")
  const [vendorAddress, setVendorAddress] = useState("")
  const [vendorState, setVendorState] = useState("")
  const [vendorGSTIN, setVendorGSTIN] = useState("")
  const [vendorPAN, setVendorPAN] = useState("")
  const [billNumber, setBillNumber] = useState("")
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0])
  const [items, setItems] = useState<PurchaseBillItem[]>([
    { id: "1", name: "", hsnSac: "", quantity: 1, rate: 0, lineTotal: 0 },
  ])

  useEffect(() => {
    if (isEditing && id) {
      const bill = getPurchaseBillById(id)
      if (bill) {
        setVendorName(bill.vendorName)
        setVendorAddress(bill.vendorAddress)
        setVendorState(bill.vendorState)
        setVendorGSTIN(bill.vendorGSTIN)
        setVendorPAN(bill.vendorPAN)
        setBillNumber(bill.billNumber)
        setBillDate(bill.date.toISOString().split("T")[0])
        setItems(bill.items)
      }
    }
  }, [isEditing, id, getPurchaseBillById])

  const addItem = () => {
    const newItem: PurchaseBillItem = {
      id: Date.now().toString(),
      name: "",
      hsnSac: "",
      quantity: 1,
      rate: 0,
      lineTotal: 0,
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof PurchaseBillItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "rate") {
            updatedItem.lineTotal = updatedItem.quantity * updatedItem.rate
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const subtotal = calculateSubtotal(items)
  const gstBreakdown = calculateGSTBreakdown(subtotal, user?.state || "", vendorState)
  const total = subtotal + gstBreakdown.total

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vendorName || !billNumber || !vendorState || items.some((item) => !item.name || item.rate <= 0)) {
      alert("Please fill in all required fields")
      return
    }

    const validItems = items.filter((item) => item.name && item.rate > 0)

    const billData = {
      billNumber,
      vendorName,
      vendorAddress,
      vendorState,
      vendorGSTIN,
      vendorPAN,
      date: new Date(billDate),
      items: validItems,
      subtotal,
      gst: gstBreakdown.total,
      gstBreakdown,
      total,
      status: "unpaid" as const,
    }

    if (isEditing && id) {
      await updatePurchaseBill(id, billData)
    } else {
      await addPurchaseBill(billData)
    }

    navigate("/purchase-bills")
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
    <div className="pt-24 md:pt-0">
      <motion.div
        className="max-w-4xl mx-auto space-y-6 md:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex items-center gap-3 md:gap-4" variants={itemVariants}>
          <div className="p-2 md:p-3 bg-emerald-500/10 rounded-lg">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isEditing ? "Edit Purchase Bill" : "Enter Purchase Bill"}
            </h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              {isEditing ? "Update bill details" : "Record a new purchase bill from vendor"}
            </p>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6" variants={itemVariants}>
            <Card>
              <h3 className="text-base md:text-lg font-semibold text-white mb-4">Vendor Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vendor Name *</label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter vendor name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vendor Address</label>
                  <textarea
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter vendor address"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                  <input
                    type="text"
                    value={vendorState}
                    onChange={(e) => setVendorState(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter vendor state"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">GSTIN/UIN</label>
                  <input
                    type="text"
                    value={vendorGSTIN}
                    onChange={(e) => setVendorGSTIN(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter GSTIN/UIN (optional)"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-base md:text-lg font-semibold text-white mb-4">Bill Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bill Number *</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter bill number from vendor"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bill Date *</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Vendor PAN</label>
                  <input
                    type="text"
                    value={vendorPAN}
                    onChange={(e) => setVendorPAN(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm md:text-base"
                    placeholder="Enter PAN number (optional)"
                  />
                </div>

                {/* GST Preview */}
                <div className="bg-gray-700 p-3 md:p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">GST Calculation Preview</h4>
                  {vendorState && user?.state ? (
                    <div className="text-sm text-gray-400">
                      {vendorState.toLowerCase().trim() === user.state.toLowerCase().trim() ? (
                        <p>✓ Same state ({user.state}) - CGST @ 9% + SGST @ 9% will be applied</p>
                      ) : (
                        <p>
                          ✓ Different states (Your: {user.state}, Vendor: {vendorState}) - IGST @ 18% will be
                          applied
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Enter vendor state to see GST calculation</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-base md:text-lg font-semibold text-white">Items</h3>
                <Button onClick={addItem} icon={Plus} size="sm">
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="p-3 md:p-4 bg-gray-700 rounded-lg space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Mobile Layout */}
                    <div className="block md:hidden space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">HSN/SAC</label>
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            placeholder="HSN/SAC"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Qty *</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Rate *</label>
                          <input
                            type="number"
                            placeholder="Enter rate"
                            value={item.rate === 0 ? "" : item.rate}
                            onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                          <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm">
                            {formatCurrency(item.lineTotal)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="danger"
                          size="sm"
                          icon={Minus}
                          disabled={items.length === 1}
                        >
                          Remove Item
                        </Button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Item Name *</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Enter item name"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">HSN/SAC</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => updateItem(item.id, "hsnSac", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="HSN/SAC"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Qty *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          min="1"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rate *</label>
                        <input
                          type="number"
                          placeholder="Enter rate"
                          value={item.rate === 0 ? "" : item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                        <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
                          {formatCurrency(item.lineTotal)}
                        </div>
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="danger"
                          size="sm"
                          icon={Minus}
                          disabled={items.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <h3 className="text-base md:text-lg font-semibold text-white mb-4">Bill Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-gray-300 text-sm md:text-base">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {gstBreakdown.isInterState ? (
                  <div className="flex justify-between text-gray-300 text-sm md:text-base">
                    <span>IGST @ 18%:</span>
                    <span>{formatCurrency(gstBreakdown.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-300 text-sm md:text-base">
                      <span>CGST @ 9%:</span>
                      <span>{formatCurrency(gstBreakdown.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 text-sm md:text-base">
                      <span>SGST @ 9%:</span>
                      <span>{formatCurrency(gstBreakdown.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-lg md:text-xl font-semibold text-white border-t border-gray-600 pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div className="flex flex-col sm:flex-row gap-3 md:gap-4" variants={itemVariants}>
            <Button type="submit" icon={Save} size="lg" className="flex-1 sm:flex-none">
              {isEditing ? "Update Bill" : "Save Bill"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/purchase-bills")}
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

export default CreatePurchaseBill
