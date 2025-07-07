import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Invoice, User, SignupData } from '../types';

// Auth Services
export const signUpUser = async (userData: SignupData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: userData.email.split('@')[0] // Use email prefix as temporary display name
    });

    // Save minimal user data to Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      email: userData.email,
      gstNumber: userData.gstNumber || '',
      createdAt: Timestamp.now(),
      // Set default values for required fields
      fullName: '',
      phoneNumber: '',
      panNumber: '',
      address: '',
      state: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      invoicePrefix: 'XUSE'
    };

    await addDoc(collection(db, 'users'), userDoc);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserData = async (uid: string) => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { success: true, userData: { id: userDoc.id, ...userDoc.data() } };
    }
    
    return { success: false, error: 'User data not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (uid: string, userData: Partial<User>) => {
  try {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), userData);
      return { success: true };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Invoice Services
export const addInvoice = async (invoiceData: Omit<Invoice, 'id'>, userId: string) => {
  try {
    const invoiceDoc = {
      ...invoiceData,
      userId,
      date: Timestamp.fromDate(invoiceData.date),
      createdAt: Timestamp.fromDate(invoiceData.createdAt)
    };
    
    const docRef = await addDoc(collection(db, 'invoices'), invoiceDoc);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>) => {
  try {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const updateData = { ...invoiceData };
    
    if (updateData.date) {
      updateData.date = Timestamp.fromDate(updateData.date as Date);
    }
    if (updateData.createdAt) {
      updateData.createdAt = Timestamp.fromDate(updateData.createdAt as Date);
    }
    
    await updateDoc(invoiceRef, updateData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteInvoice = async (invoiceId: string) => {
  try {
    await deleteDoc(doc(db, 'invoices', invoiceId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserInvoices = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'invoices'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const invoices = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate()
      } as Invoice;
    });
    
    return { success: true, invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};