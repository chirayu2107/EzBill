"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom" // ✅ ADDED useNavigate
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { Mail, Lock, LogIn, Receipt } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const Login: React.FC = () => {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate() // ✅ INITIALIZED HERE
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        toast.success("Login Successful", "Welcome back! You have been signed in successfully.")
        navigate("/") // ✅ REDIRECT ON SUCCESS
      } else {
        setError("Invalid email or password. Please check your credentials and try again.")
        toast.error("Sign In Failed", "Please check your email and password")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
      toast.error("Sign In Error", "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-white">
      {/* Left Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">EzBill</h1>
            </div>
            <p className="text-gray-400">Welcome back! Please enter your details.</p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg animate-pulse">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
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
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox text-emerald-500" disabled={loading} />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-emerald-500 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                icon={loading ? undefined : LogIn}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all duration-200"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-gray-400">
                Don’t have an account?{" "}
                <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                  Sign up
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Right Side: Dashboard UI Preview (Hidden on Mobile) */}
      <div className="hidden md:flex w-full md:w-1/2 items-center justify-end bg-gray-800 overflow-hidden px-4 md:px-0">
        <div className="rounded-xl border-[3px] border-gray-700 shadow-2xl w-full max-w-none scale-[1.10] md:ml-14">
          <a href="/"> {/* Replace with your actual route */}
            <img
              src="http://res.cloudinary.com/dkoiyuyhj/image/upload/v1754549620/htp9nm9ywe8hblzrjygd.png"
              alt="Dashboard Preview"
              className="object-contain w-full h-full rounded-xl"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
