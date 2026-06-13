"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { Mail, Lock, UserPlus, Receipt, User } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const avatarUrls = [
  "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032406/n4dpb2qiwgwxpfb2kurc.jpg",
  "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032557/xbkz2uegcbb1k4vw6fqw.jpg",
  "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032858/gteqwkdcagqbxjg6aght.avif",
  "https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753033134/kcsxsijj63cbyufn5kpa.avif",
]

const Signup: React.FC = () => {
  const { signup } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters"
      setError(errorMsg)
      toast.error("Validation Error", errorMsg)
      return
    }

    setLoading(true)

    try {
      const success = await signup({ email, password, fullName: name })
      if (success) {
        toast.success("Account Created Successfully!", `Welcome to EzBill, ${name}!`)
      } else {
        setError("Failed to create account. Please try again.")
        toast.error("Signup Failed", "Failed to create account.")
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.")
      toast.error("Signup Error", "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-light dark:bg-[#0F0F11] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Left Side */}
      <div
        className="relative w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center flex items-center justify-center px-6 py-10 md:py-16"
        style={{
          backgroundImage:
            "url('https://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032282/kmcdusntcqaf6p6o8bqk.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 z-0" />
        {/* Ambient gradient orbs over image */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-green-500/8 rounded-full blur-3xl z-0" />
        
        <div className="relative z-10 text-center max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium mb-4">
            <Receipt className="w-3 h-3" />
            Professional Invoicing
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight text-white tracking-heading-tight">
            Professional Invoicing <br />Made <span className="text-emerald-400">Simple</span>
          </h2>
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base leading-relaxed">
            Streamline your billing with auto GST, brand management, and instant PDF generation.
          </p>
          <div className="hidden sm:flex items-center justify-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {avatarUrls.map((url, index) => (
                <img
                  key={index}
                  className="w-9 h-9 rounded-full border-2 border-emerald-500/50 object-cover"
                  src={url}
                  alt={`user${index + 1}`}
                />
              ))}
            </div>
            <div className="text-sm">
              <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                ★★★★★ <span className="text-white">5.0</span>
              </div>
              <div className="text-gray-300 text-xs">from 200+ reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center min-h-[calc(100vh-16rem)] md:min-h-screen px-4 sm:px-6 py-10 sm:py-12 relative">
        {/* Ambient gradients */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/4 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md my-auto relative z-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-heading-tight text-gray-900 dark:text-white">EzBill</h1>
              </Link>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Start your 30-day free trial</p>
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/6 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1F] border border-gray-200 dark:border-white/[0.07] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 dark:placeholder:text-[#63636E]"
                    placeholder="Your full name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1F] border border-gray-200 dark:border-white/[0.07] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 dark:placeholder:text-[#63636E]"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1F] border border-gray-200 dark:border-white/[0.07] rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 dark:placeholder:text-[#63636E]"
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                icon={loading ? undefined : UserPlus}
                disabled={loading}
                variant="accent"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  "Get started"
                )}
              </Button>

              {/* Link to login */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors">
                  Sign in
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Signup
