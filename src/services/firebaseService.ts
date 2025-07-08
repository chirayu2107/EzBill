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
import type { Invoice, User, SignupData } from "../types"

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
    }

    // Save user data to Firestore using the user's UID as document ID
    const userDoc = {
      uid: userCredential.user.uid,
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
      invoicePrefix: userData.invoicePrefix || "XUSE",
      createdAt: Timestamp.now(),
    }

    // Use setDoc with the user's UID as the document ID
    await setDoc(doc(db, "users", userCredential.user.uid), userDoc)
    console.log("User data saved to Firestore")

    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("Signup error:", error)
    return { success: false, error: error.message }
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
    return { success: false, error: error.message }
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

    // First try to get user by document ID (UID)
    const userDocRef = doc(db, "users", uid)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      console.log("User data found by document ID:", userData)
      return {
        success: true,
        userData: {
          id: userDocSnap.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
        },
      }
    }

    // Fallback: query by uid field
    console.log("User not found by document ID, trying uid field query")
    const q = query(collection(db, "users"), where("uid", "==", uid))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      console.log("User data found by uid field:", userData)
      return {
        success: true,
        userData: {
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
        },
      }
    }

    console.log("User data not found")
    return { success: false, error: "User data not found" }
  } catch (error: any) {
    console.error("Get user data error:", error)
    return { success: false, error: error.message }
  }
}

export const updateUserData = async (uid: string, userData: Partial<User>) => {
  try {
    console.log("Updating user data for UID:", uid, userData)

    // Try to update using UID as document ID first
    const userDocRef = doc(db, "users", uid)
    await updateDoc(userDocRef, userData)
    console.log("User data updated successfully")
    return { success: true }
  } catch (error: any) {
    console.error("Update user data error:", error)
    // Fallback: find by uid field
    try {
      const q = query(collection(db, "users"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        await updateDoc(doc(db, "users", userDoc.id), userData)
        console.log("User data updated successfully (fallback)")
        return { success: true }
      }

      return { success: false, error: "User not found" }
    } catch (fallbackError: any) {
      console.error("Fallback update error:", fallbackError)
      return { success: false, error: fallbackError.message }
    }
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
