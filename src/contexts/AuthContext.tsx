import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, authService } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string, role?: 'customer' | 'worker') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await authService.signIn({ email, password });
      // User state will be updated by the auth state change listener
      // Don't set loading to false here - let the auth state change handle it
    } catch (error) {
      // On error, immediately set loading to false and keep user as null
      setLoading(false);
      setUser(null);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, role?: 'customer' | 'worker') => {
    setLoading(true);
    try {
      await authService.signUp({ email, password, fullName, phone, role });
      // User state will be updated by the auth state change listener
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      // Avoid blank screen after signup (no session while awaiting email confirmation)
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
