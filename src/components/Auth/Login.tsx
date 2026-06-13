"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useToast } from "../../hooks/useToast"
import { Mail, Lock, LogIn, Receipt } from "lucide-react"
import Button from "../UI/Button"
import Card from "../UI/Card"

const Login: React.FC = () => {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
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
        navigate("/dashboard")
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
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-light dark:bg-[#0f1117] text-gray-900 dark:text-white transition-colors duration-300 relative">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-green-500/4 rounded-full blur-3xl" />
      </div>

      {/* Left Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center min-h-[calc(100vh-2rem)] md:min-h-screen px-6 py-12 relative z-10">
        <div className="w-full max-w-md my-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-heading-tight text-gray-900 dark:text-white">EzBill</h1>
              </Link>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back! Please enter your details.</p>
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/6 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox text-emerald-500 rounded" disabled={loading} />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                icon={loading ? undefined : LogIn}
                disabled={loading}
                variant="accent"
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium transition-colors">
                  Sign up
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Right Side: Dashboard UI Preview (Hidden on Mobile) */}
      <div className="hidden md:flex w-full md:w-1/2 items-center justify-end bg-gray-900 dark:bg-gray-950 overflow-hidden px-4 md:px-0 relative">
        {/* Ambient gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-500/6 rounded-full blur-3xl" />
        
        <div className="rounded-2xl border border-gray-700/50 shadow-2xl shadow-black/20 w-full max-w-none scale-[1.10] md:ml-14 overflow-hidden relative z-10">
          <a href="/">
            <img
              src="https://res.cloudinary.com/dkoiyuyhj/image/upload/v1781378460/zc0xgzmffj78xkykvpst.png"
              alt="Dashboard Preview"
              className="object-contain w-full h-full"
            />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
