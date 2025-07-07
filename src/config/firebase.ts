// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDzfYMNgXQGK66LLvSeRXJPQTcStYKPlVI",
  authDomain: "ezbill-288e5.firebaseapp.com",
  projectId: "ezbill-288e5",
  storageBucket: "ezbill-288e5.firebasestorage.app",
  messagingSenderId: "153124508270",
  appId: "1:153124508270:web:2fdfa14945b32bf55a8c7f",
  measurementId: "G-RZEX74GM2P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;