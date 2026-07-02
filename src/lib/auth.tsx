'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

// Check if we are in local auth mode
const isLocalAuth = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'local';

async function syncUserToDb(user: AuthUser) {
  try {
    await fetch('/api/users/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }),
    });
  } catch (err) {
    console.error('Failed to sync user to DB:', err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 1. LOCAL AUTH SYSTEM ---
  useEffect(() => {
    if (!isLocalAuth) return;

    try {
      const savedUser = localStorage.getItem('cookbro_local_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load local user', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- 2. FIREBASE AUTH SYSTEM ---
  useEffect(() => {
    if (isLocalAuth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const mappedUser: AuthUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(mappedUser);
        await syncUserToDb(mappedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 3. ACTIONS ---
  const signInWithGoogle = async () => {
    if (isLocalAuth) {
      throw new Error('本地登录模式不支持谷歌登录');
    }
    const result = await signInWithPopup(auth, googleProvider);
    const mappedUser: AuthUser = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    };
    setUser(mappedUser);
    await syncUserToDb(mappedUser);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isLocalAuth) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '登录失败');
      }
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('cookbro_local_user', JSON.stringify(userData));
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const mappedUser: AuthUser = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      setUser(mappedUser);
      await syncUserToDb(mappedUser);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    if (isLocalAuth) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '注册失败');
      }
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('cookbro_local_user', JSON.stringify(userData));
    } else {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      const mappedUser: AuthUser = {
        uid: result.user.uid,
        displayName: displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      setUser(mappedUser);
      await syncUserToDb(mappedUser);
    }
  };

  const signOut = async () => {
    if (isLocalAuth) {
      setUser(null);
      localStorage.removeItem('cookbro_local_user');
    } else {
      await firebaseSignOut(auth);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
