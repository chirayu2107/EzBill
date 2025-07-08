"use client"

import type React from "react"
import { useAuth } from "../../context/AuthContext"
import Login from "./Login"

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  // Simply return children if authenticated, Login if not
  // No additional loading states here since AuthContext handles it
  return isAuthenticated ? <>{children}</> : <Login />
}

export default ProtectedRoute