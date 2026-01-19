"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { verifyAdmin, ApiError } from "./api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify admin status when session changes
  async function checkAdminStatus(currentSession: Session | null) {
    if (!currentSession) {
      setIsAdmin(false);
      return;
    }

    try {
      const adminInfo = await verifyAdmin();
      setIsAdmin(adminInfo.is_admin);
    } catch (err) {
      // If 403, user is not admin
      if (err instanceof ApiError && err.status === 403) {
        setIsAdmin(false);
      } else {
        // For other errors, assume not admin
        console.error("Error verifying admin status:", err);
        setIsAdmin(false);
      }
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session and verify admin
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await checkAdminStatus(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      await checkAdminStatus(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) {
      return { error: new Error("Supabase not configured") };
    }

    // Step 1: Authenticate with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: new Error(authError.message) };
    }

    // Step 2: Verify user is admin
    try {
      const adminInfo = await verifyAdmin();
      if (!adminInfo.is_admin) {
        // Not an admin - sign out and return error
        await supabase.auth.signOut();
        return { error: new Error("Access restricted to administrators") };
      }
      setIsAdmin(true);
      return { error: null };
    } catch (err) {
      // Failed to verify - sign out
      await supabase.auth.signOut();
      if (err instanceof ApiError && err.status === 403) {
        return { error: new Error("Access restricted to administrators") };
      }
      return { error: new Error("Failed to verify admin access") };
    }
  }

  async function signOut() {
    if (!supabase) return;
    setIsAdmin(false);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
