"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { resetPassword } from "../../services/firebaseService"
import { useToast } from "../../hooks/useToast"
import { Mail, ArrowLeft, Receipt, CheckCircle, Send } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const ForgotPassword: React.FC = () => {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Please enter your email address.")
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(email.trim())
      if (result.success) {
        setSent(true)
        toast.success("Email Sent", "Check your inbox for the password reset link.")
      } else {
        setError(result.error || "Failed to send reset email.")
        toast.error("Reset Failed", result.error || "Could not send reset email.")
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.")
      toast.error("Error", "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    setSent(false)
    setEmail("")
    setError("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-[#0F0F11] text-gray-900 dark:text-white transition-colors duration-300 relative px-4">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/3 w-[500px] h-[500px] bg-transparent dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-transparent dark:bg-green-500/4 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back to login */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-[#A0A0AB] hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Sign In
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-heading-tight text-gray-900 dark:text-white">EzBill</h1>
            </Link>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {sent ? "Check your email" : "Reset your password"}
          </h2>
          <p className="text-gray-500 dark:text-[#A0A0AB] text-sm">
            {sent
              ? "We've sent a password reset link to your email"
              : "Enter your email address and we'll send you a reset link"}
          </p>
        </div>

        <Card padding="lg">
          {sent ? (
            /* ─── Success State ─── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>

              <p className="text-sm text-gray-600 dark:text-[#A0A0AB] mb-2">
                We sent a reset link to
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-6 ez-mono">
                {email}
              </p>

              <div className="bg-amber-50 dark:bg-amber-500/8 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 mb-6 text-left">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>Didn't receive it?</strong> Check your spam folder, or make sure you entered the correct email address.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleResend}
                  variant="secondary"
                  className="w-full"
                  icon={Send}
                >
                  Try a different email
                </Button>

                <Link to="/login" className="block">
                  <Button variant="accent" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* ─── Form State ─── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/6 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1F] border border-gray-200 dark:border-white/[0.07] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 dark:placeholder:text-[#62626B]"
                    placeholder="Enter your email address"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                icon={loading ? undefined : Send}
                disabled={loading}
                variant="accent"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 dark:text-[#A0A0AB]">
                Remember your password?{" "}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword
