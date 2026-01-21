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
  "http://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032406/n4dpb2qiwgwxpfb2kurc.jpg",
  "http://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032557/xbkz2uegcbb1k4vw6fqw.jpg",
  "http://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032858/gteqwkdcagqbxjg6aght.avif",
  "http://res.cloudinary.com/dkoiyuyhj/image/upload/v1753033134/kcsxsijj63cbyufn5kpa.avif",
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Left Side */}
      <div
        className="relative w-full md:w-1/2 h-64 md:h-auto bg-cover bg-center flex items-center justify-center px-6 py-10 md:py-16"
        style={{
          backgroundImage:
            "url('http://res.cloudinary.com/dkoiyuyhj/image/upload/v1753032282/kmcdusntcqaf6p6o8bqk.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 z-0"></div>
        <div className="relative z-10 text-center max-w-md">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight text-white">
            Professional Invoicing <br /> Made Simple
          </h2>
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
            Streamline your billing with auto GST, brand management, and instant PDF generation.
          </p>
          <div className="hidden sm:flex items-center justify-center gap-3 mt-4">
            <div className="flex -space-x-2">
              {avatarUrls.map((url, index) => (
                <img
                  key={index}
                  className="w-9 h-9 rounded-full border-2 border-emerald-500 object-cover"
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
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">EzBill</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Start your 30-day free trial</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg animate-pulse text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Your full name"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-emerald-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                icon={loading ? undefined : UserPlus}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating account...
                  </div>
                ) : (
                  "Get started"
                )}
              </Button>

              {/* Link to login */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
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
