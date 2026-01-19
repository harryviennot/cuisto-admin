"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Warning,
  Clock,
  Prohibit,
  Shield,
  Check,
  CaretRight,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import {
  getUserModeration,
  warnUser,
  suspendUser,
  unsuspendUser,
  banUser,
  unbanUser,
} from "@/lib/api";
import type { UserModerationDetail, ModerationAction, UserWarning } from "@/types/admin";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

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

function getStatusBadgeVariant(status: string): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "good_standing":
      return "success";
    case "warned":
      return "warning";
    case "suspended":
    case "banned":
      return "danger";
    default:
      return "default";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatActionType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function UserModerationPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<UserModerationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [suspensionDays, setSuspensionDays] = useState(7);

  async function fetchUser() {
    try {
      setLoading(true);
      const userData = await getUserModeration(userId);
      setData(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  function openActionModal(type: string) {
    setActionType(type);
    setActionReason("");
    setShowActionModal(true);
  }

  async function handleAction() {
    if (!actionType || !actionReason) return;

    setActionLoading(actionType);
    try {
      switch (actionType) {
        case "warn":
          await warnUser(userId, { reason: actionReason });
          break;
        case "suspend":
          await suspendUser(userId, { duration_days: suspensionDays, reason: actionReason });
          break;
        case "unsuspend":
          await unsuspendUser(userId, { reason: actionReason });
          break;
        case "ban":
          await banUser(userId, { reason: actionReason });
          break;
        case "unban":
          await unbanUser(userId, { reason: actionReason });
          break;
      }
      // Refresh data
      await fetchUser();
      setShowActionModal(false);
      setActionReason("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to perform action");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Loading user...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-terracotta-500 mb-2">Error loading user</p>
          <p className="text-text-muted text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { user, moderation, warnings, actions } = data;
  const isSuspended = moderation.status === "suspended";
  const isBanned = moderation.status === "banned";

  return (
    <div>
      <Header
        title="User Moderation"
        subtitle={user?.name || `User ${userId.slice(0, 8)}`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      />

      <div className="p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* User Info & Actions */}
          <div className="space-y-6">
            {/* User Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || "User"}
                      className="h-20 w-20 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-surface flex items-center justify-center mb-4">
                      <User size={32} className="text-text-muted" />
                    </div>
                  )}
                  <h2 className="text-xl font-semibold text-text-heading">
                    {user?.name || "Unknown User"}
                  </h2>
                  <p className="text-sm text-text-muted mb-4">{userId}</p>
                  <Badge variant={getStatusBadgeVariant(moderation.status)}>
                    {formatStatus(moderation.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Moderation Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Moderation Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Warnings</span>
                  <span className="font-medium text-text-heading">{moderation.warning_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Reports against</span>
                  <span className="font-medium text-text-heading">{moderation.report_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">False reports made</span>
                  <span className="font-medium text-text-heading">{moderation.false_report_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Reporter reliability</span>
                  <span className="font-medium text-text-heading">
                    {(moderation.reporter_reliability_score * 100).toFixed(0)}%
                  </span>
                </div>
                {moderation.suspended_until && (
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-text-muted">Suspended until</span>
                    <span className="font-medium text-terracotta-500">
                      {formatDate(moderation.suspended_until)}
                    </span>
                  </div>
                )}
                {moderation.ban_reason && (
                  <div className="pt-3 border-t border-border">
                    <span className="text-sm text-text-muted block mb-1">Ban reason</span>
                    <span className="text-sm text-terracotta-500">{moderation.ban_reason}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isBanned && (
                  <>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => openActionModal("warn")}
                    >
                      <Warning size={18} />
                      Issue Warning
                    </Button>

                    {isSuspended ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => openActionModal("unsuspend")}
                      >
                        <Check size={18} />
                        Remove Suspension
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="w-full justify-start"
                        onClick={() => openActionModal("suspend")}
                      >
                        <Clock size={18} />
                        Suspend User
                      </Button>
                    )}

                    <Button
                      variant="danger"
                      className="w-full justify-start"
                      onClick={() => openActionModal("ban")}
                    >
                      <Prohibit size={18} />
                      Ban User
                    </Button>
                  </>
                )}

                {isBanned && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openActionModal("unban")}
                  >
                    <Check size={18} />
                    Remove Ban
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Warnings & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warnings */}
            <Card>
              <CardHeader>
                <CardTitle>Warnings ({warnings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {warnings.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No warnings issued</p>
                ) : (
                  <div className="space-y-4">
                    {warnings.map((warning) => (
                      <div
                        key={warning.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface"
                      >
                        <div className="flex-shrink-0">
                          <Warning size={20} className="text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-heading font-medium">{warning.reason}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                            <span>{formatTimeAgo(warning.created_at)}</span>
                            {warning.issuer && (
                              <span>by {warning.issuer.name || "Moderator"}</span>
                            )}
                            {warning.acknowledged_at && (
                              <Badge variant="success">Acknowledged</Badge>
                            )}
                          </div>
                          {warning.recipes && (
                            <Link
                              href={`/reports?recipe=${warning.recipe_id}`}
                              className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                            >
                              Related recipe: {warning.recipes.title}
                              <CaretRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action History */}
            <Card>
              <CardHeader>
                <CardTitle>Moderation History ({actions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No moderation actions</p>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface"
                      >
                        <div className="flex-shrink-0">
                          <Shield size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{formatActionType(action.action_type)}</Badge>
                            {action.duration_days && (
                              <span className="text-sm text-text-muted">
                                ({action.duration_days} days)
                              </span>
                            )}
                          </div>
                          <p className="text-text-body">{action.reason}</p>
                          {action.notes && (
                            <p className="text-sm text-text-muted mt-1">{action.notes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                            <span>{formatTimeAgo(action.created_at)}</span>
                            {action.moderator && (
                              <span>by {action.moderator.name || "System"}</span>
                            )}
                          </div>
                          {action.target_recipe && (
                            <Link
                              href={`/reports?recipe=${action.target_recipe_id}`}
                              className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                            >
                              Recipe: {action.target_recipe.title}
                              <CaretRight size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {actionType === "warn" && "Issue Warning"}
                {actionType === "suspend" && "Suspend User"}
                {actionType === "unsuspend" && "Remove Suspension"}
                {actionType === "ban" && "Ban User"}
                {actionType === "unban" && "Remove Ban"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Reason *
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {actionType === "suspend" && (
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 7)}
                    min={1}
                    max={365}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {(actionType === "ban" || actionType === "suspend") && (
                <div className="p-3 rounded-lg bg-terracotta-500/10 border border-terracotta-500/20">
                  <p className="text-sm text-terracotta-500">
                    {actionType === "ban"
                      ? "This will permanently ban the user from the platform. This action can be reversed later."
                      : "This will temporarily prevent the user from using the app."}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionType === "ban" || actionType === "suspend" ? "danger" : "primary"}
                  className="flex-1"
                  onClick={handleAction}
                  loading={!!actionLoading}
                  disabled={!actionReason}
                >
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
