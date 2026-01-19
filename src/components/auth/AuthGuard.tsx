"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Redirect to login if not authenticated or not admin
    if (!loading && (!user || !isAdmin) && !isLoginPage) {
      router.push("/login");
    }
  }, [user, isAdmin, loading, router, isLoginPage]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Login page - render without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not logged in or not admin - show redirect message
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Logged in as admin - render with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1">{children}</main>
    </div>
  );
}
