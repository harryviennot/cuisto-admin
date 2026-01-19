"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, ShieldWarning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsAccessDenied(false);
    setSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      // Check if it's an access denied error
      if (error.message.includes("restricted to administrators")) {
        setIsAccessDenied(true);
      }
      setError(error.message);
      setSubmitting(false);
    } else {
      router.push("/");
    }
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Don't render if already logged in as admin (will redirect)
  if (user && isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-white mb-4">
            <span className="text-2xl font-playfair font-bold">C</span>
          </div>
          <h1 className="text-2xl font-playfair font-semibold text-text-heading">
            Cuisto Admin
          </h1>
          <p className="text-text-muted mt-1">Sign in to access the dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className={`p-4 rounded-lg border ${
                    isAccessDenied
                      ? "bg-terracotta-500/10 border-terracotta-500/30"
                      : "bg-terracotta-500/10 border-terracotta-500/20"
                  }`}
                >
                  {isAccessDenied ? (
                    <div className="flex items-start gap-3">
                      <ShieldWarning size={20} className="text-terracotta-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-terracotta-500">Access Denied</p>
                        <p className="text-sm text-terracotta-500/80 mt-1">
                          This account does not have administrator privileges. Please contact your system administrator if you believe this is an error.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-terracotta-500">{error}</p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text-body mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cuisto.app"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-body mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={submitting}
              >
                <SignIn size={18} />
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-text-muted mt-6">
          Access restricted to administrators only
        </p>
      </div>
    </div>
  );
}
