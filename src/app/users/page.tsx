"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FunnelSimple,
  CaretRight,
  MagnifyingGlass,
  Crown,
  WarningCircle,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getUsers } from "@/lib/api";
import type { UserListItem, UserModerationStatus } from "@/types/admin";

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ModerationStatusBadge({ status }: { status: UserModerationStatus }) {
  const variants: Record<UserModerationStatus, "success" | "warning" | "danger" | "default"> = {
    good_standing: "success",
    warned: "warning",
    suspended: "danger",
    banned: "danger",
  };

  const labels: Record<UserModerationStatus, string> = {
    good_standing: "Good Standing",
    warned: "Warned",
    suspended: "Suspended",
    banned: "Banned",
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "good_standing", label: "Good Standing" },
  { value: "warned", label: "Warned" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

const PREMIUM_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Users" },
  { value: "true", label: "Premium Only" },
  { value: "false", label: "Free Only" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [premiumFilter, setPremiumFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers({
        status: (statusFilter || undefined) as UserModerationStatus | undefined,
        is_premium: premiumFilter ? premiumFilter === "true" : undefined,
        search: debouncedSearch || undefined,
        limit: 50,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [statusFilter, premiumFilter, debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div>
      <Header
        title="User Management"
        subtitle={`${total} user${total !== 1 ? "s" : ""} total`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelSimple size={16} />
            Filters
          </Button>
        }
      />

      <div className="p-8">
        {/* Search Bar */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <MagnifyingGlass size={20} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-text-body placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </Card>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-body">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-body">Subscription:</label>
                <select
                  value={premiumFilter}
                  onChange={(e) => setPremiumFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PREMIUM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter || premiumFilter || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("");
                    setPremiumFilter("");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-text-muted">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-terracotta-500 mb-2">Error loading users</p>
              <p className="text-text-muted text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchUsers} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Users size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No users found</p>
            </div>
          </div>
        ) : (
          /* Users Table */
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-surface">
                      <td className="px-6 py-4">
                        <Link href={`/users/${user.id}`} className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name || "User"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users size={16} className="text-primary" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-text-heading block">
                              {user.name || "Unknown User"}
                            </span>
                            {user.warning_count > 0 && (
                              <span className="text-xs text-terracotta-500 flex items-center gap-1">
                                <WarningCircle size={12} />
                                {user.warning_count} warning{user.warning_count !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-body">{user.email || "-"}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {user.last_sign_in_at ? formatTimeAgo(user.last_sign_in_at) : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <ModerationStatusBadge status={user.moderation_status} />
                      </td>
                      <td className="px-6 py-4">
                        {user.is_premium ? (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit">
                            <Crown size={12} />
                            {user.is_trial ? "Trial" : "Premium"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Free</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/users/${user.id}`}>
                          <Button variant="outline" size="sm">
                            View
                            <CaretRight size={14} />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
