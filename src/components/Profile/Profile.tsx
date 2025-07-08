"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { User, Mail, Phone, CreditCard, MapPin, Building, Hash, Save, AlertCircle, RefreshCw } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    panNumber: "",
    address: "",
    state: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    gstNumber: "",
    invoicePrefix: "",
  })

  // Sync form data with user data whenever user changes
  useEffect(() => {
    console.log("Profile component - user data changed:", user)

    if (user) {
      const newFormData = {
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        panNumber: user.panNumber || "",
        address: user.address || "",
        state: user.state || "",
        bankName: user.bankName || "",
        accountNumber: user.accountNumber || "",
        ifscCode: user.ifscCode || "",
        gstNumber: user.gstNumber || "",
        invoicePrefix: user.invoicePrefix || "XUSE",
      }

      console.log("Setting form data:", newFormData)
      setFormData(newFormData)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [user])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const generatePrefixFromName = () => {
    if (formData.fullName && formData.fullName.length >= 4) {
      const autoPrefix = formData.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
      setFormData((prev) => ({
        ...prev,
        invoicePrefix: autoPrefix,
      }))
      toast.info("Prefix Generated", `Invoice prefix set to "${autoPrefix}" from your name`)
    } else {
      toast.warning("Name Required", "Please enter your full name (at least 4 characters) to generate prefix")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log("Saving profile data:", formData)
      await updateProfile(formData)
      setIsEditing(false)
      toast.success("Profile Updated", "Your business profile has been saved successfully!")
    } catch (error: any) {
      console.error("Profile save error:", error)
      toast.error("Save Failed", error.message || "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        panNumber: user.panNumber || "",
        address: user.address || "",
        state: user.state || "",
        bankName: user.bankName || "",
        accountNumber: user.accountNumber || "",
        ifscCode: user.ifscCode || "",
        gstNumber: user.gstNumber || "",
        invoicePrefix: user.invoicePrefix || "XUSE",
      })
    }
    setIsEditing(false)
  }

  // Check if profile is incomplete
  const isProfileIncomplete =
    !formData.fullName ||
    !formData.phoneNumber ||
    !formData.panNumber ||
    !formData.address ||
    !formData.state ||
    !formData.bankName ||
    !formData.accountNumber ||
    !formData.ifscCode

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <div className="text-white text-lg">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Business Profile</h1>
          <p className="text-gray-400 mt-1">Manage your business information</p>
        </div>
        {!isEditing ? (
          <div className="flex gap-3">
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            <Button onClick={() => window.location.reload()} variant="secondary" icon={RefreshCw} size="sm">
              Refresh
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              icon={saving ? undefined : Save}
              disabled={saving}
              className={saving ? "opacity-75" : ""}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button onClick={handleCancel} variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Completion Alert */}
      {isProfileIncomplete && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-semibold mb-1">Complete Your Profile</h3>
              <p className="text-yellow-300 text-sm mb-3">
                Please complete your business profile to start creating professional invoices. Missing information may
                affect invoice generation.
              </p>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                  Complete Profile
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Personal Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => updateField("phoneNumber", e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white opacity-75"
                  placeholder="Email address"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number *</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter your PAN number"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Address & Location */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Address & Location</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  rows={3}
                  placeholder="Enter your business address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="Enter your state"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">GST Number (optional)</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter GST number"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Banking Details */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Banking Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bank Name *</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter bank name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Number *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => updateField("accountNumber", e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IFSC Code *</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => updateField("ifscCode", e.target.value.toUpperCase())}
                disabled={!isEditing}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                placeholder="Enter IFSC code"
              />
            </div>
          </div>
        </Card>

        {/* Business Settings */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Business Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Invoice Prefix *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.invoicePrefix}
                  onChange={(e) => updateField("invoicePrefix", e.target.value.toUpperCase())}
                  disabled={!isEditing}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  placeholder="Enter invoice prefix (e.g., ABCD)"
                  maxLength={6}
                />
                {isEditing && (
                  <Button
                    onClick={generatePrefixFromName}
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    disabled={!formData.fullName || formData.fullName.length < 4}
                  >
                    Auto Generate
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isEditing
                  ? "Enter a custom prefix or click 'Auto Generate' to create from your name"
                  : "This prefix will be used for all your invoice numbers (e.g., ABCD-5970)"}
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Profile Completion</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Personal Details</span>
                  <span
                    className={`${formData.fullName && formData.phoneNumber && formData.panNumber ? "text-green-400" : "text-yellow-400"}`}
                  >
                    {formData.fullName && formData.phoneNumber && formData.panNumber ? "✓ Complete" : "⚠ Incomplete"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Address & Location</span>
                  <span className={`${formData.address && formData.state ? "text-green-400" : "text-yellow-400"}`}>
                    {formData.address && formData.state ? "✓ Complete" : "⚠ Incomplete"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Banking Details</span>
                  <span
                    className={`${formData.bankName && formData.accountNumber && formData.ifscCode ? "text-green-400" : "text-yellow-400"}`}
                  >
                    {formData.bankName && formData.accountNumber && formData.ifscCode ? "✓ Complete" : "⚠ Incomplete"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Invoice Prefix</span>
                  <span className={`${formData.invoicePrefix ? "text-green-400" : "text-yellow-400"}`}>
                    {formData.invoicePrefix ? "✓ Set" : "⚠ Not Set"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Profile
