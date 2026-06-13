"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import {
  User, Mail, Phone, CreditCard, MapPin, Building, Hash,
  Save, AlertCircle, LogOut, Pen, Shield,
  Check, ChevronRight, Briefcase, RefreshCw,
} from "lucide-react"
import SignatureUpload from "./SignatureUpload"
import LogoUpload from "./LogoUpload"

/* ── Tab config ── */
type TabId = "profile" | "business" | "banking"

const TABS: { id: TabId; label: string; icon: React.ComponentType<any> }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "banking", label: "Banking", icon: Building },
]

/* ── Shared input component ── */
function FormInput({
  label,
  value,
  onChange,
  disabled,
  icon: Icon,
  placeholder,
  type = "text",
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  icon?: React.ComponentType<any>
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
        {label}
        {required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors z-10"
          />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5
            bg-white dark:bg-[#1A1A1D] 
            border border-gray-200 dark:border-white/[0.08]
            rounded-xl text-[14px] text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
          `}
        />
      </div>
      {hint && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 transition-colors">{hint}</p>
      )}
    </div>
  )
}

function FormTextarea({
  label,
  value,
  onChange,
  disabled,
  icon: Icon,
  placeholder,
  required = false,
  rows = 3,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  icon?: React.ComponentType<any>
  placeholder?: string
  required?: boolean
  rows?: number
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
        {label}
        {required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon
            size={16}
            className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors z-10"
          />
        )}
        <textarea
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows}
          className={`
            w-full ${Icon ? "pl-10" : "pl-3.5"} pr-3.5 py-2.5
            bg-white dark:bg-[#1A1A1D]
            border border-gray-200 dark:border-white/[0.08]
            rounded-xl text-[14px] text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all duration-200 resize-none
            shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]
          `}
        />
      </div>
    </div>
  )
}


const Profile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("profile")
  const tabsRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

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
    signature: "",
    businessLogo: "",
  })

  // Sync form data with user data
  useEffect(() => {
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
        signature: user.signature || "",
        businessLogo: user.businessLogo || "",
      })
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [user])

  // Tab indicator animation
  useEffect(() => {
    const el = tabsRef.current
    if (!el) return
    const activeEl = el.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement
    if (!activeEl) return
    const rect = activeEl.getBoundingClientRect()
    const parentRect = el.getBoundingClientRect()
    setIndicatorStyle({ left: rect.left - parentRect.left, width: rect.width })
  }, [activeTab])

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignatureChange = (signature: string | null) => {
    setFormData((prev) => ({ ...prev, signature: signature || "" }))
  }

  const handleLogoChange = (logo: string | null) => {
    setFormData((prev) => ({ ...prev, businessLogo: logo || "" }))
  }

  const generatePrefixFromName = () => {
    if (formData.fullName && formData.fullName.length >= 4) {
      const autoPrefix = formData.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
      setFormData((prev) => ({ ...prev, invoicePrefix: autoPrefix }))
      toast.info("Prefix Generated", `Invoice prefix set to "${autoPrefix}" from your name`)
    } else {
      toast.warning("Name Required", "Please enter your full name (at least 4 characters) to generate prefix")
    }
  }

  const validateInvoicePrefix = (prefix: string) => {
    const cleanPrefix = prefix.replace(/\s+/g, "").toUpperCase()
    const validPattern = /^[A-Z0-9]+$/
    if (!validPattern.test(cleanPrefix)) {
      toast.warning("Invalid Prefix", "Invoice prefix can only contain letters and numbers")
      return false
    }
    if (cleanPrefix.length < 2) {
      toast.warning("Prefix Too Short", "Invoice prefix must be at least 2 characters long")
      return false
    }
    if (cleanPrefix.length > 6) {
      toast.warning("Prefix Too Long", "Invoice prefix cannot exceed 6 characters")
      return false
    }
    return true
  }

  const handlePrefixChange = (value: string) => {
    const cleanValue = value.replace(/\s+/g, "").toUpperCase()
    updateField("invoicePrefix", cleanValue)
  }

  const handleSave = async () => {
    if (formData.invoicePrefix && !validateInvoicePrefix(formData.invoicePrefix)) return
    setSaving(true)
    try {
      await updateProfile(formData)
      setIsEditing(false)
      toast.success("Profile Updated", "Your business profile has been saved successfully!")
    } catch (error: any) {
      toast.error("Save Failed", error.message || "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
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
        signature: user.signature || "",
        businessLogo: user.businessLogo || "",
      })
    }
    setIsEditing(false)
  }

  const handleSignOut = async () => {
    try {
      await logout()
    } catch (error) {
      toast.error("Error", "Failed to sign out")
    }
  }

  /* ── Computed ── */
  const initials = formData.fullName
    ? formData.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "?"

  const displayName = formData.fullName || user?.email || "User"
  const displayEmail = user?.email || ""

  const isProfileIncomplete =
    !formData.fullName || !formData.phoneNumber || !formData.panNumber ||
    !formData.address || !formData.state ||
    !formData.bankName || !formData.accountNumber || !formData.ifscCode

  const completionItems = [
    { label: "Personal Details", done: !!(formData.fullName && formData.phoneNumber && formData.panNumber) },
    { label: "Address & Location", done: !!(formData.address && formData.state) },
    { label: "Banking Details", done: !!(formData.bankName && formData.accountNumber && formData.ifscCode) },
    { label: "Invoice Prefix", done: !!formData.invoicePrefix },
    { label: "Digital Signature", done: !!formData.signature, optional: true },
    { label: "Business Logo", done: !!formData.businessLogo, optional: true },
  ]
  const completionCount = completionItems.filter((i) => i.done).length
  const completionTotal = completionItems.length

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pt-24 md:pt-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <div className="size-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto select-none pt-20 lg:pt-0 pb-8">

      {/* ═══════════ HERO BANNER ═══════════ */}
      <div className="relative mb-20">
        {/* Gradient banner */}
        <div
          className="h-36 sm:h-44 rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 30%, #34d399 65%, #10b981 100%)",
          }}
        >
          {/* Dot pattern — subtle */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Soft gradient orbs */}
          <div
            className="absolute -top-16 right-20 w-[350px] h-[350px] rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(167,243,208,0.5), transparent 70%)" }}
          />
          <div
            className="absolute bottom-[-30%] left-[10%] w-[250px] h-[250px] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, rgba(110,231,183,0.4), transparent 70%)" }}
          />
          {/* Specular top edge */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>

        {/* Avatar — overlapping the banner */}
        <div className="absolute -bottom-14 left-6 sm:left-8">
          <div
            className="size-[88px] rounded-full flex items-center justify-center text-white font-bold text-2xl ring-4 ring-white dark:ring-gray-900"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)",
              boxShadow: "0 4px 20px rgba(16,185,129,0.35), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {initials}
          </div>
        </div>
      </div>

      {/* ═══════════ NAME + ACTIONS ROW ═══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between px-2 mb-8 gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
            {displayName}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{displayEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl
                           bg-gray-900 dark:bg-white text-white dark:text-gray-900
                           text-[13px] font-semibold
                           hover:bg-black dark:hover:bg-gray-100 hover:shadow-md
                           transition-all duration-200"
              >
                <Pen size={13} strokeWidth={2} />
                Edit Profile
              </button>
              {/* Separator */}
              <div className="w-px h-5 bg-gray-200 dark:bg-[#212124] mx-0.5" />
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl
                           border border-gray-200 dark:border-white/[0.08]
                           text-[13px] font-medium text-gray-500 dark:text-gray-400
                           hover:bg-red-50 dark:hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400
                           hover:border-red-200 dark:hover:border-red-500/20
                           transition-all duration-200"
              >
                <LogOut size={13} strokeWidth={2} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl
                           text-[13px] font-semibold text-white
                           transition-all duration-200 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                  boxShadow: "0 0 16px rgba(16,185,129,0.3), 0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {saving ? (
                  <>
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={13} strokeWidth={2} />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl
                           border border-gray-200 dark:border-white/[0.08]
                           text-[13px] font-medium text-gray-600 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-white/[0.04]
                           transition-all duration-200 disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════════ TABS ═══════════ */}
      <div className="relative px-2 mb-8">
        <div
          ref={tabsRef}
          className="flex items-center gap-1 border-b border-gray-200 dark:border-white/[0.04]"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium
                  transition-colors duration-200 -mb-px
                  ${isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }
                `}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
              </button>
            )
          })}
          {/* Animated underline */}
          <div
            className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "linear-gradient(90deg, #10b981, #059669)",
            }}
          />
        </div>
      </div>

      {/* ═══════════ COMPLETION ALERT ═══════════ */}
      {isProfileIncomplete && (
        <div className="mx-2 mb-8 rounded-2xl border border-amber-200/60 dark:border-amber-500/20 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.04) 0%, rgba(245,158,11,0.06) 100%)",
          }}
        >
          <div className="flex items-start gap-4 p-5">
            <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-amber-700 dark:text-amber-400 mb-1">Complete Your Profile</h3>
              <p className="text-[13px] text-amber-600/80 dark:text-amber-300/70 leading-relaxed mb-3">
                Fill in your business details to unlock professional invoice generation.
              </p>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 transition-colors"
                >
                  Complete now
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
            {/* Mini progress */}
            <div className="hidden sm:flex flex-col items-end shrink-0">
              <span className="text-[11px] font-mono font-semibold text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest mb-1.5">
                {completionCount}/{completionTotal}
              </span>
              <div className="w-20 h-1.5 bg-amber-200/40 dark:bg-amber-500/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(completionCount / completionTotal) * 100}%`,
                    background: "linear-gradient(90deg, #f59e0b, #d97706)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB CONTENT ═══════════ */}
      <div className="px-2 space-y-6">

        {/* ──── PROFILE TAB ──── */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-fade-up">
            {/* Section: Personal Information */}
            <div
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                         bg-white dark:bg-[#161618]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
            >
              {/* Noise texture */}
              <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay rounded-2xl"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />
              <div className="p-6 relative">
                <div className="mb-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Personal information</h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Update your name and contact details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(v) => updateField("fullName", v)}
                    disabled={!isEditing}
                    icon={User}
                    placeholder="Enter your full name"
                    required
                  />
                  <FormInput
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(v) => updateField("phoneNumber", v)}
                    disabled={!isEditing}
                    icon={Phone}
                    placeholder="Enter your phone number"
                    type="tel"
                    required
                  />
                  <FormInput
                    label="Email Address"
                    value={user?.email || ""}
                    disabled
                    icon={Mail}
                    placeholder="Email address"
                    hint="Email cannot be changed"
                  />
                  <FormInput
                    label="PAN Number"
                    value={formData.panNumber}
                    onChange={(v) => updateField("panNumber", v.toUpperCase())}
                    disabled={!isEditing}
                    icon={CreditCard}
                    placeholder="Enter your PAN number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Address */}
            <div
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                         bg-white dark:bg-[#161618]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
            >
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Address & Location</h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Your registered business address.</p>
                </div>

                <div className="space-y-5">
                  <FormTextarea
                    label="Address"
                    value={formData.address}
                    onChange={(v) => updateField("address", v)}
                    disabled={!isEditing}
                    icon={MapPin}
                    placeholder="Enter your business address"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput
                      label="State"
                      value={formData.state}
                      onChange={(v) => updateField("state", v)}
                      disabled={!isEditing}
                      placeholder="Enter your state"
                      required
                    />
                    <FormInput
                      label="GST Number"
                      value={formData.gstNumber}
                      onChange={(v) => updateField("gstNumber", v.toUpperCase())}
                      disabled={!isEditing}
                      icon={Hash}
                      placeholder="Enter GST number (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── BUSINESS TAB ──── */}
        {activeTab === "business" && (
          <div className="space-y-6 animate-fade-up">
            {/* Invoice Prefix */}
            <div
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                         bg-white dark:bg-[#161618]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
            >
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Invoice Settings</h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Customize how your invoices are numbered.</p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice Prefix<span className="text-emerald-500 ml-0.5">*</span>
                  </label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => handlePrefixChange(e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#1A1A1D] border border-gray-200 dark:border-white/[0.08] rounded-xl text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 disabled:opacity-60 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                      placeholder="e.g. ABCD"
                      minLength={2}
                      maxLength={6}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={generatePrefixFromName}
                        disabled={!formData.fullName || formData.fullName.length < 4}
                        className="inline-flex items-center gap-1.5 h-[42px] px-4 rounded-xl
                                   border border-gray-200 dark:border-white/[0.08]
                                   text-[12px] font-medium text-gray-600 dark:text-gray-300
                                   hover:bg-gray-50 dark:hover:bg-white/[0.04]
                                   disabled:opacity-40 transition-all whitespace-nowrap"
                      >
                        <RefreshCw size={12} />
                        Auto Generate
                      </button>
                    )}
                  </div>
                  {formData.invoicePrefix && (
                    <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 font-mono">
                      Preview: {formData.invoicePrefix}-1, {formData.invoicePrefix}-2, …
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                    {isEditing ? "2–6 characters, letters and numbers only." : `Your invoices: ${formData.invoicePrefix || "XUSE"}-XXXXX`}
                  </p>
                </div>
              </div>
            </div>

            {/* Logo & Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                           bg-white dark:bg-[#161618]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
              >
                <div className="p-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">Business Logo</h2>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-4">Appears on your invoices.</p>
                  <LogoUpload
                    currentLogo={formData.businessLogo || undefined}
                    onLogoChange={handleLogoChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div
                className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                           bg-white dark:bg-[#161618]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
              >
                <div className="p-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">Digital Signature</h2>
                  <p className="text-[12px] text-gray-400 dark:text-gray-500 mb-4">Used to sign invoices digitally.</p>
                  <SignatureUpload
                    currentSignature={formData.signature || undefined}
                    onSignatureChange={handleSignatureChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                         bg-white dark:bg-[#161618]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Profile Completion</h2>
                    <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">Track what's left to fill in.</p>
                  </div>
                  <span className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                    {Math.round((completionCount / completionTotal) * 100)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-100 dark:bg-[#1A1A1D] rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(completionCount / completionTotal) * 100}%`,
                      background: "linear-gradient(90deg, #10b981, #059669)",
                    }}
                  />
                </div>

                <div className="space-y-2.5">
                  {completionItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <span className="text-[13px] text-gray-600 dark:text-gray-400">{item.label}</span>
                      {item.done ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check size={12} strokeWidth={3} />
                          Done
                        </span>
                      ) : item.optional ? (
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Optional</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                          <AlertCircle size={11} />
                          Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──── BANKING TAB ──── */}
        {activeTab === "banking" && (
          <div className="space-y-6 animate-fade-up">
            <div
              className="rounded-2xl border border-gray-200/80 dark:border-white/[0.04] overflow-hidden
                         bg-white dark:bg-[#161618]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)" }}
            >
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Bank Account Details</h2>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Your bank details for invoice payments.</p>
                </div>

                <div className="space-y-5">
                  <FormInput
                    label="Bank Name"
                    value={formData.bankName}
                    onChange={(v) => updateField("bankName", v)}
                    disabled={!isEditing}
                    icon={Building}
                    placeholder="Enter bank name"
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormInput
                      label="Account Number"
                      value={formData.accountNumber}
                      onChange={(v) => updateField("accountNumber", v)}
                      disabled={!isEditing}
                      placeholder="Enter account number"
                      required
                    />
                    <FormInput
                      label="IFSC Code"
                      value={formData.ifscCode}
                      onChange={(v) => updateField("ifscCode", v.toUpperCase())}
                      disabled={!isEditing}
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security info panel */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.06) 100%)",
                border: "1px solid rgba(16,185,129,0.12)",
              }}
            >
              <div className="p-5 flex items-start gap-4">
                <div className="size-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                >
                  <Shield size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">Your data is secure</h3>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    All banking information is encrypted and stored securely. We never share your financial details with third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
