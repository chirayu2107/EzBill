"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { Mail, Lock, UserPlus, Receipt, User } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const Signup: React.FC = () => {
  const { signup } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match"
      setError(errorMsg)
      toast.error("Validation Error", errorMsg)
      return
    }

    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters"
      setError(errorMsg)
      toast.error("Validation Error", errorMsg)
      return
    }

    setLoading(true)

    try {
      const signupData = {
        email,
        password,
        fullName: name,
      }

      const success = await signup(signupData)
      if (success) {
        toast.success(
          "Account Created Successfully!",
          `Welcome to EzBill, ${name}! Your account has been created and you're now signed in.`,
        )
        // Don't navigate manually - let the auth context handle it
      } else {
        const errorMsg = "Failed to create account. Please try again."
        setError(errorMsg)
        toast.error("Signup Failed", errorMsg)
      }
    } catch (err: any) {
      const errorMsg = "An error occurred. Please try again."
      setError(errorMsg)
      toast.error("Signup Error", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">EzBill</h1>
          </div>
          <p className="text-gray-400">Create a new account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg animate-pulse">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Your full name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-emerald-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-emerald-500 hover:underline">
                Privacy Policy
              </Link>
              .
            </div>

            <Button
              type="submit"
              icon={loading ? undefined : UserPlus}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 relative overflow-hidden"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating account...
                </div>
              ) : (
                "Sign Up"
              )}
            </Button>

            <div className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default Signup
