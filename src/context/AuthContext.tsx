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
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid)

      try {
        if (firebaseUser) {
          // User is signed in, get their data from Firestore
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
        } else {
          // User is signed out
          console.log("User signed out")
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", email)
      const result = await signInUser(email, password)
      console.log("Login result:", result)

      if (result.success) {
        // The onAuthStateChanged listener will handle setting the user data
        return true
      } else {
        console.error("Login failed:", result.error)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      console.log("Attempting signup for:", userData.email)
      const result = await signUpUser(userData)
      console.log("Signup result:", result)

      if (result.success) {
        // Don't sign out immediately - let the user stay signed in after signup
        console.log("Signup successful, user should be signed in")
        return true
      } else {
        console.error("Signup failed:", result.error)
        return false
      }
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await signOutUser()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
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

  // Show loading screen only during initial auth check
  if (!authChecked) {
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
