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
  const [authChecked, setAuthChecked] = useState(false)

  // Function to refresh user data from Firestore
  const refreshUserData = async (uid: string) => {
    try {
      console.log("Refreshing user data for UID:", uid)
      const result = await getUserData(uid)

      if (result.success && result.userData) {
        console.log("User data refreshed successfully:", result.userData)
        setUser(result.userData as User)
        return result.userData
      } else {
        console.error("Failed to refresh user data:", result.error)
        return null
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid)

      try {
        if (firebaseUser) {
          // User is signed in, get their data from Firestore
          const userData = await refreshUserData(firebaseUser.uid)

          if (userData) {
            setIsAuthenticated(true)
          } else {
            // If user data doesn't exist, create a basic user object
            console.log("Creating basic user object for new user")
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              fullName: firebaseUser.displayName || "",
              phoneNumber: "",
              panNumber: "",
              address: "",
              state: "",
              bankName: "",
              accountNumber: "",
              ifscCode: "",
              gstNumber: "",
              invoicePrefix: "XUSE",
              signature: "", // Initialize signature field
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
        console.log("Updating profile for user:", auth.currentUser.uid, userData)

        // Log signature data specifically
        if (userData.signature !== undefined) {
          console.log("Signature update - length:", userData.signature?.length || 0)
          console.log("Signature starts with data:image:", userData.signature?.startsWith("data:image/") || false)
        }

        const result = await updateUserData(auth.currentUser.uid, userData)

        if (result.success) {
          // Refresh user data from Firestore to get the latest data
          const refreshedUserData = await refreshUserData(auth.currentUser.uid)

          if (refreshedUserData) {
            console.log("Profile updated and refreshed successfully")
            return { success: true }
          } else {
            // Fallback: update local state if refresh fails
            const updatedUser = {
              ...user,
              ...userData,
              id: user.id,
              createdAt: user.createdAt,
            }
            setUser(updatedUser)
            console.log("Profile updated successfully (local fallback)")
            return { success: true }
          }
        } else {
          console.error("Failed to update profile:", result.error)
          throw new Error(result.error || "Failed to update profile")
        }
      } catch (error: any) {
        console.error("Update profile error:", error)
        throw error
      }
    } else {
      throw new Error("User not authenticated")
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
