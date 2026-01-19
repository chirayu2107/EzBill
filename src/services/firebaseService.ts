import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
} from "firebase/firestore"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { auth, db } from "../config/firebase"
import type { Invoice, User, SignupData, PurchaseBill } from "../types"

// Auth Services
export const signUpUser = async (userData: SignupData) => {
  try {
    console.log("Creating user with email:", userData.email)
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    console.log("User created successfully:", userCredential.user.uid)

    // Update the user's display name
    if (userData.fullName) {
      await updateProfile(userCredential.user, {
        displayName: userData.fullName,
      })
      console.log("Display name updated:", userData.fullName)
    }

    // Generate invoice prefix from full name
    const invoicePrefix =
      userData.invoicePrefix && userData.invoicePrefix.trim()
        ? userData.invoicePrefix.trim().toUpperCase()
        : userData.fullName && userData.fullName.length >= 4
          ? userData.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
          : "XUSE"

    // Save user data to Firestore using the user's UID as document ID
    const userDoc = {
      email: userData.email,
      fullName: userData.fullName || "",
      phoneNumber: userData.phoneNumber || "",
      panNumber: userData.panNumber || "",
      address: userData.address || "",
      state: userData.state || "",
      bankName: userData.bankName || "",
      accountNumber: userData.accountNumber || "",
      ifscCode: userData.ifscCode || "",
      gstNumber: userData.gstNumber || "",
      invoicePrefix: invoicePrefix,
      signature: "", // Initialize signature as empty string
      businessLogo: "", // Initialize logo field
      createdAt: Timestamp.now(),
    }

    // Use setDoc with the user's UID as the document ID
    await setDoc(doc(db, "users", userCredential.user.uid), userDoc)
    console.log("User data saved to Firestore successfully")

    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Signup error:", error)
    let errorMessage = "An error occurred during signup"

    // Handle specific Firebase auth errors
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "This email is already registered. Please use a different email or try signing in."
        break
      case "auth/weak-password":
        errorMessage = "Password is too weak. Please use at least 6 characters."
        break
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address."
        break
      case "auth/operation-not-allowed":
        errorMessage = "Email/password accounts are not enabled. Please contact support."
        break
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your internet connection and try again."
        break
      default:
        errorMessage = error.message || errorMessage
    }

    return { success: false, error: errorMessage }
  }
}

export const signInUser = async (email: string, password: string) => {
  try {
    console.log("Signing in user with email:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("User signed in successfully:", userCredential.user.uid)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Sign in error:", error)
    let errorMessage = "An error occurred during sign in"

    // Handle specific Firebase auth errors
    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email address. Please check your email or sign up."
        break
      case "auth/wrong-password":
        errorMessage = "Incorrect password. Please try again."
        break
      case "auth/invalid-email":
        errorMessage = "Please enter a valid email address."
        break
      case "auth/user-disabled":
        errorMessage = "This account has been disabled. Please contact support."
        break
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later."
        break
      case "auth/invalid-credential":
        errorMessage = "Invalid email or password. Please check your credentials and try again."
        break
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your internet connection and try again."
        break
      default:
        errorMessage = error.message || errorMessage
    }

    return { success: false, error: errorMessage }
  }
}

export const signOutUser = async () => {
  try {
    await signOut(auth)
    console.log("User signed out successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Sign out error:", error)
    return { success: false, error: error.message }
  }
}

export const getUserData = async (uid: string) => {
  try {
    console.log("Getting user data for UID:", uid)

    if (!uid) {
      console.error("No UID provided")
      return { success: false, error: "No user ID provided" }
    }

    // Get user by document ID (UID)
    const userDocRef = doc(db, "users", uid)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      console.log("Raw user data from Firestore:", userData)

      // Ensure all fields have default values
      const processedUserData: User = {
        id: userDocSnap.id,
        email: userData.email || "",
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || "",
        panNumber: userData.panNumber || "",
        address: userData.address || "",
        state: userData.state || "",
        bankName: userData.bankName || "",
        accountNumber: userData.accountNumber || "",
        ifscCode: userData.ifscCode || "",
        gstNumber: userData.gstNumber || "",
        invoicePrefix: userData.invoicePrefix || "XUSE",
        signature: userData.signature || "", // Handle signature field
        businessLogo: userData.businessLogo || "", // Handle logo field
        createdAt: userData.createdAt?.toDate() || new Date(),
      }

      console.log("Processed user data:", processedUserData)
      return {
        success: true,
        userData: processedUserData,
      }
    }

    console.log("User document not found for UID:", uid)
    return { success: false, error: "User document not found" }
  } catch (error: any) {
    console.error("Get user data error:", error)
    return { success: false, error: error.message }
  }
}

export const updateUserData = async (uid: string, userData: Partial<User>) => {
  try {
    console.log("Updating user data for UID:", uid, userData)

    if (!uid) {
      console.error("No UID provided for update")
      return { success: false, error: "No user ID provided" }
    }

    // Generate invoice prefix if fullName is being updated
    const updateData: Record<string, any> = {}

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined && key !== "id" && key !== "createdAt") {
        // Handle signature field specifically
        if (key === "signature") {
          updateData[key] = value || "" // Ensure signature is always a string
        } else {
          updateData[key] = value
        }
      }
    })

    // Handle invoice prefix - use custom value if provided, otherwise auto-generate
    if (userData.invoicePrefix !== undefined) {
      // User explicitly set a prefix (could be empty string to clear it)
      updateData.invoicePrefix = userData.invoicePrefix.trim().toUpperCase() || "XUSE"
    } else if (userData.fullName && userData.fullName.length >= 4) {
      // Only auto-generate if no custom prefix is set and fullName is being updated
      const userDocRef = doc(db, "users", uid)
      const existingDoc = await getDoc(userDocRef)
      const existingData = existingDoc.exists() ? existingDoc.data() : {}

      // Only auto-generate if user doesn't have a custom prefix already
      if (!existingData.invoicePrefix || existingData.invoicePrefix === "XUSE") {
        updateData.invoicePrefix = userData.fullName.replace(/\s+/g, "").substring(0, 4).toUpperCase()
      }
    }

    console.log("Clean user data to update:", updateData)

    // Update using UID as document ID
    const userDocRef = doc(db, "users", uid)

    // Check if document exists
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists()) {
      await updateDoc(userDocRef, updateData)
      console.log("User data updated successfully")
      return { success: true }
    } else {
      // If document doesn't exist, create it
      console.log("Document doesn't exist, creating new one")
      const newUserData = {
        email: "",
        fullName: "",
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
        createdAt: Timestamp.now(),
        ...updateData,
      }

      await setDoc(userDocRef, newUserData)
      console.log("New user document created successfully")
      return { success: true }
    }
  } catch (error: any) {
    console.error("Update user data error:", error)
    return { success: false, error: error.message }
  }
}

// Invoice Services
export const addInvoice = async (invoiceData: Omit<Invoice, "id">, userId: string) => {
  try {
    console.log("Adding invoice for user:", userId, invoiceData)

    const invoiceDoc = {
      ...invoiceData,
      userId,
      date: Timestamp.fromDate(invoiceData.date),
      createdAt: Timestamp.fromDate(invoiceData.createdAt),
    }

    const docRef = await addDoc(collection(db, "invoices"), invoiceDoc)
    console.log("Invoice added successfully with ID:", docRef.id)
    return { success: true, id: docRef.id }
  } catch (error: any) {
    console.error("Add invoice error:", error)
    return { success: false, error: error.message }
  }
}

export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>) => {
  try {
    console.log("Updating invoice:", invoiceId, invoiceData)

    const invoiceRef = doc(db, "invoices", invoiceId)

    // Create update data with proper type handling
    const updateData: Record<string, any> = {}

    // Copy all fields except dates first
    Object.keys(invoiceData).forEach((key) => {
      if (key !== "date" && key !== "createdAt") {
        updateData[key] = (invoiceData as any)[key]
      }
    })

    // Handle date conversions separately
    if (invoiceData.date) {
      updateData.date = invoiceData.date instanceof Date ? Timestamp.fromDate(invoiceData.date) : invoiceData.date
    }

    if (invoiceData.createdAt) {
      updateData.createdAt =
        invoiceData.createdAt instanceof Date ? Timestamp.fromDate(invoiceData.createdAt) : invoiceData.createdAt
    }

    await updateDoc(invoiceRef, updateData)
    console.log("Invoice updated successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Update invoice error:", error)
    return { success: false, error: error.message }
  }
}

export const deleteInvoice = async (invoiceId: string) => {
  try {
    console.log("Deleting invoice:", invoiceId)
    await deleteDoc(doc(db, "invoices", invoiceId))
    console.log("Invoice deleted successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Delete invoice error:", error)
    return { success: false, error: error.message }
  }
}

export const getUserInvoices = async (userId: string) => {
  try {
    console.log("Fetching invoices for user:", userId)

    // Check if we can access the collection
    const invoicesCollection = collection(db, "invoices")
    console.log("Invoices collection reference:", invoicesCollection)

    // Try with ordering first (requires composite index)
    try {
      const q = query(invoicesCollection, where("userId", "==", userId), orderBy("createdAt", "desc"))
      console.log("Trying query with ordering...")

      const querySnapshot = await getDocs(q)
      console.log("Query with ordering executed successfully, found documents:", querySnapshot.size)

      const invoices = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          console.log("Processing invoice document:", doc.id, data)

          try {
            const processedInvoice = {
              id: doc.id,
              ...data,
              // Safely convert Firestore Timestamps to Date objects
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as Invoice

            console.log("Processed invoice:", processedInvoice)
            return processedInvoice
          } catch (docError) {
            console.error("Error processing invoice document:", doc.id, docError)
            return null
          }
        })
        .filter(Boolean) as Invoice[]

      console.log("Final processed invoices:", invoices.length)
      return { success: true, invoices }
    } catch (indexError: any) {
      console.log("Query with ordering failed (likely missing index), trying without ordering:", indexError.message)

      // Fallback: Query without ordering (doesn't require composite index)
      const simpleQuery = query(invoicesCollection, where("userId", "==", userId))
      const querySnapshot = await getDocs(simpleQuery)
      console.log("Simple query executed, found documents:", querySnapshot.size)

      if (querySnapshot.empty) {
        console.log("No invoices found for user")
        return { success: true, invoices: [] }
      }

      const invoices = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          console.log("Processing invoice document:", doc.id, data)

          try {
            const processedInvoice = {
              id: doc.id,
              ...data,
              // Safely convert Firestore Timestamps to Date objects
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as Invoice

            console.log("Processed invoice:", processedInvoice)
            return processedInvoice
          } catch (docError) {
            console.error("Error processing invoice document:", doc.id, docError)
            return null
          }
        })
        .filter(Boolean) as Invoice[]

      // Sort manually by createdAt (newest first)
      invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      console.log("Final processed invoices (manually sorted):", invoices.length)
      return { success: true, invoices }
    }
  } catch (error: any) {
    console.error("Get user invoices error:", error)

    // More detailed error logging
    if (error.code) {
      console.error("Firebase error code:", error.code)
    }
    if (error.message) {
      console.error("Firebase error message:", error.message)
    }

    return { success: false, error: error.message, invoices: [] }
  }
}

// Purchase Bill Services
export const addPurchaseBill = async (billData: Omit<PurchaseBill, "id">, userId: string) => {
  try {
    console.log("Adding purchase bill for user:", userId, billData)

    const billDoc = {
      ...billData,
      userId,
      date: Timestamp.fromDate(billData.date),
      createdAt: Timestamp.fromDate(billData.createdAt),
    }

    const docRef = await addDoc(collection(db, "purchaseBills"), billDoc)
    console.log("Purchase bill added successfully with ID:", docRef.id)
    return { success: true, id: docRef.id }
  } catch (error: any) {
    console.error("Add purchase bill error:", error)
    return { success: false, error: error.message }
  }
}

export const updatePurchaseBill = async (billId: string, billData: Partial<PurchaseBill>) => {
  try {
    console.log("Updating purchase bill:", billId, billData)

    const billRef = doc(db, "purchaseBills", billId)

    // Create update data with proper type handling
    const updateData: Record<string, any> = {}

    // Copy all fields except dates first
    Object.keys(billData).forEach((key) => {
      if (key !== "date" && key !== "createdAt") {
        updateData[key] = (billData as any)[key]
      }
    })

    // Handle date conversions separately
    if (billData.date) {
      updateData.date = billData.date instanceof Date ? Timestamp.fromDate(billData.date) : billData.date
    }

    if (billData.createdAt) {
      updateData.createdAt =
        billData.createdAt instanceof Date ? Timestamp.fromDate(billData.createdAt) : billData.createdAt
    }

    await updateDoc(billRef, updateData)
    console.log("Purchase bill updated successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Update purchase bill error:", error)
    return { success: false, error: error.message }
  }
}

export const deletePurchaseBill = async (billId: string) => {
  try {
    console.log("Deleting purchase bill:", billId)
    await deleteDoc(doc(db, "purchaseBills", billId))
    console.log("Purchase bill deleted successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Delete purchase bill error:", error)
    return { success: false, error: error.message }
  }
}

export const getUserPurchaseBills = async (userId: string) => {
  try {
    console.log("Fetching purchase bills for user:", userId)

    const billsCollection = collection(db, "purchaseBills")

    // Try with ordering first (requires composite index)
    try {
      const q = query(billsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"))

      const querySnapshot = await getDocs(q)

      const purchaseBills = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          try {
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as PurchaseBill
          } catch (docError) {
            console.error("Error processing purchase bill document:", doc.id, docError)
            return null
          }
        })
        .filter(Boolean) as PurchaseBill[]

      return { success: true, purchaseBills }
    } catch (indexError: any) {
      console.log("Query with ordering failed (likely missing index), trying without ordering:", indexError.message)

      // Fallback: Query without ordering
      const simpleQuery = query(billsCollection, where("userId", "==", userId))
      const querySnapshot = await getDocs(simpleQuery)

      if (querySnapshot.empty) {
        return { success: true, purchaseBills: [] }
      }

      const purchaseBills = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          try {
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            } as PurchaseBill
          } catch (docError) {
            console.error("Error processing purchase bill document:", doc.id, docError)
            return null
          }
        })
        .filter(Boolean) as PurchaseBill[]

      // Sort manually
      purchaseBills.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      return { success: true, purchaseBills }
    }
  } catch (error: any) {
    console.error("Get user purchase bills error:", error)
    return { success: false, error: error.message, purchaseBills: [] }
  }
}
