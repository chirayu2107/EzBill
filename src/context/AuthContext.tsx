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
      const result = await getUserData(uid)

      if (result.success && result.userData) {
        setUser(result.userData as User)
        return result.userData
      } else {
        return null
      }
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, get their data from Firestore
          const userData = await refreshUserData(firebaseUser.uid)

          if (userData) {
            setIsAuthenticated(true)
          } else {
            // If user data doesn't exist, create a basic user object
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
              businessLogo: "", // Initialize logo field
              createdAt: new Date(),
            }
            setUser(basicUser)
            setIsAuthenticated(true)
          }
        } else {
          // User is signed out
          setUser(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
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
      const result = await signInUser(email, password)

      if (result.success) {
        // The onAuthStateChanged listener will handle setting the user data
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      const result = await signUpUser(userData)

      if (result.success) {
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      await signOutUser()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      // Silent fail — user will see they're still logged in
    }
  }

  const updateProfile = async (userData: Partial<User>) => {
    if (user && auth.currentUser) {
      try {
        const result = await updateUserData(auth.currentUser.uid, userData)

        if (result.success) {
          // Refresh user data from Firestore to get the latest data
          const refreshedUserData = await refreshUserData(auth.currentUser.uid)

          if (refreshedUserData) {
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
            return { success: true }
          }
        } else {
          throw new Error(result.error || "Failed to update profile")
        }
      } catch (error: any) {
        throw error
      }
    } else {
      throw new Error("User not authenticated")
    }
  }

  // Show loading screen only during initial auth check
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-gray-900 dark:text-white text-lg transition-colors">Loading...</div>
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
