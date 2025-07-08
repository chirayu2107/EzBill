"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import type { InvoiceItem } from "../../types"
import { calculateSubtotal, calculateGSTBreakdown, formatCurrency } from "../../utils/calculations"
import { Plus, Minus, Save, FileText } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const CreateInvoice: React.FC = () => {
  const { addInvoice, updateInvoice, getInvoiceById } = useApp()
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
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "1", name: "", hsnSac: "", quantity: 1, rate: 0, lineTotal: 0 },
  ])

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
        setItems(invoice.items)
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
  const gstBreakdown = calculateGSTBreakdown(subtotal, user?.state || "", customerState)
  const total = subtotal + gstBreakdown.total

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

    navigate("/")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-lg">
          <FileText className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{isEditing ? "Edit Invoice" : "Create New Invoice"}</h1>
          <p className="text-gray-400 mt-1">
            {isEditing ? "Update invoice details" : "Generate a professional invoice for your customer"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Customer Address *</label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter customer address"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                <input
                  type="text"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter customer state"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">GSTIN/UIN</label>
                <input
                  type="text"
                  value={customerGSTIN}
                  onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter GSTIN/UIN (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                <input
                  type="text"
                  value={customerPAN}
                  onChange={(e) => setCustomerPAN(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter PAN number (optional)"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Invoice Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Date *</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Invoice Number Preview */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Invoice Number Preview</h4>
                <div className="text-sm text-gray-400">
                  {user?.invoicePrefix ? (
                    <p>
                      ✓ Next invoice will be numbered:{" "}
                      <span className="text-emerald-400 font-medium">{user.invoicePrefix}-XXXX</span>
                    </p>
                  ) : (
                    <p className="text-yellow-400">⚠ Set your invoice prefix in Profile to customize numbering</p>
                  )}
                </div>
              </div>

              {/* GST Preview */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">GST Calculation Preview</h4>
                {customerState && user?.state ? (
                  <div className="text-sm text-gray-400">
                    {customerState.toLowerCase().trim() === user.state.toLowerCase().trim() ? (
                      <p>✓ Same state ({user.state}) - CGST @ 9% + SGST @ 9% will be applied</p>
                    ) : (
                      <p>
                        ✓ Different states (Your: {user.state}, Customer: {customerState}) - IGST @ 18% will be applied
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Enter customer state to see GST calculation</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Items</h3>
            <Button onClick={addItem} icon={Plus} size="sm">
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-700 rounded-lg">
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
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Invoice Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {gstBreakdown.isInterState ? (
              <div className="flex justify-between text-gray-300">
                <span>IGST @ 18%:</span>
                <span>{formatCurrency(gstBreakdown.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-gray-300">
                  <span>CGST @ 9%:</span>
                  <span>{formatCurrency(gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>SGST @ 9%:</span>
                  <span>{formatCurrency(gstBreakdown.sgst)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-xl font-semibold text-white border-t border-gray-600 pt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" icon={Save} size="lg">
            {isEditing ? "Update Invoice" : "Save Invoice"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/")} size="lg">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateInvoice
