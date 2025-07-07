// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  signUpUser,
  signInUser,
  signOutUser,
  getUserData,
  updateUserData,
} from '../services/firebaseService';
import { User, AuthContextType, SignupData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUser(result.userData as User);
          setIsAuthenticated(true);
        } else {
          console.error('Failed to fetch user data');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInUser(email, password);
      if (result.success && result.user) {
        const userData = await getUserData(result.user.uid);
        if (userData.success) {
          setUser(userData.userData as User);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error.message || error);
      return false;
    }
  };

  const signup = async (signupData: SignupData): Promise<boolean> => {
    try {
      const result = await signUpUser(signupData);
      if (result.success && result.user) {
        const userData = await getUserData(result.user.uid);
        if (userData.success) {
          setUser(userData.userData as User);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error('Signup error:', error.message || error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error: any) {
      console.error('Logout error:', error.message || error);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    if (user && auth.currentUser) {
      try {
        const result = await updateUserData(auth.currentUser.uid, userData);
        if (result.success) {
          setUser((prev) => ({ ...prev!, ...userData }));
        }
      } catch (error: any) {
        console.error('Update profile error:', error.message || error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
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
  );
};
