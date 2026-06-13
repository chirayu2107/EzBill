// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDzfYMNgXQGK66LLvSeRXJPQTcStYKPlVI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ezbill-288e5.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ezbill-288e5",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ezbill-288e5.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "153124508270",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:153124508270:web:2fdfa14945b32bf55a8c7f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RZEX74GM2P",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;