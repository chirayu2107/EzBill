"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../config/firebase"
import { signUpUser, signInUser, signOutUser, getUserData, updateUserData } from "../services/firebaseService"
import type { User, AuthContextType, SignupData } from "../types"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid)

      if (firebaseUser) {
        // User is signed in, get their data from Firestore
        try {
          const result = await getUserData(firebaseUser.uid)
          console.log("User data result:", result)

          if (result.success && result.userData) {
            setUser(result.userData as User)
            setIsAuthenticated(true)
          } else {
            console.error("Failed to get user data:", result.error)
            // If user data doesn't exist, create a basic user object
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              fullName: firebaseUser.displayName || "",
              createdAt: new Date(),
            }
            setUser(basicUser)
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error("Error getting user data:", error)
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        // User is signed out
        console.log("User signed out")
        setUser(null)
        setIsAuthenticated(false)
      }

      setLoading(false)
      setInitializing(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const result = await signInUser(email, password)
      console.log("Login result:", result)

      if (result.success) {
        // Don't set loading to false here - let onAuthStateChanged handle it
        return true
      } else {
        console.error("Login failed:", result.error)
        setLoading(false)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
      return false
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      setLoading(true)
      const result = await signUpUser(userData)
      console.log("Signup result:", result)

      if (result.success) {
        // Don't set loading to false here - let onAuthStateChanged handle it
        return true
      } else {
        console.error("Signup failed:", result.error)
        setLoading(false)
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      setLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOutUser()
      setUser(null)
      setIsAuthenticated(false)
      setLoading(false)
    } catch (error) {
      console.error("Logout error:", error)
      setLoading(false)
    }
  }

  const updateProfile = async (userData: Partial<User>) => {
    if (user && auth.currentUser) {
      try {
        const result = await updateUserData(auth.currentUser.uid, userData)
        if (result.success) {
          setUser({ ...user, ...userData })
        }
      } catch (error) {
        console.error("Update profile error:", error)
      }
    }
  }

  // Show loading screen during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
