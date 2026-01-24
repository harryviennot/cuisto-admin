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
  Crown,
  Envelope,
  Calendar,
  ChatCircleText,
  Trash,
  Flag,
  CookingPot,
  Eye,
  EyeSlash,
  PencilSimple,
  Bell,
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
  deleteUser,
  getAdminRecipes,
  sendNotification,
} from "@/lib/api";
import type { UserModerationDetailEnhanced, AdminRecipeListItem } from "@/types/admin";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string): string {
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

function formatCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function UserModerationPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<UserModerationDetailEnhanced | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // User recipes
  const [userRecipes, setUserRecipes] = useState<AdminRecipeListItem[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);

  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [suspensionDays, setSuspensionDays] = useState(7);

  // Notification modal
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState({ en: "", fr: "" });
  const [notificationBody, setNotificationBody] = useState({ en: "", fr: "" });
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationLanguage, setNotificationLanguage] = useState<"en" | "fr">("en");

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

  async function fetchUserRecipes() {
    try {
      setRecipesLoading(true);
      const recipesData = await getAdminRecipes({ user_id: userId, limit: 20 });
      setUserRecipes(recipesData.recipes);
    } catch (err) {
      // Silent fail for recipes - not critical
      console.error("Failed to load user recipes:", err);
    } finally {
      setRecipesLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserRecipes();
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
        case "delete":
          await deleteUser(userId, actionReason);
          router.push("/users");
          return;
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

  async function handleSendNotification() {
    if (
      !notificationTitle.en.trim() ||
      !notificationTitle.fr.trim() ||
      !notificationBody.en.trim() ||
      !notificationBody.fr.trim()
    ) return;

    setNotificationLoading(true);
    try {
      const result = await sendNotification({
        user_id: userId,
        title: {
          en: notificationTitle.en.trim(),
          fr: notificationTitle.fr.trim(),
        },
        body: {
          en: notificationBody.en.trim(),
          fr: notificationBody.fr.trim(),
        },
      });

      if (result.success) {
        alert("Notification sent successfully!");
        setShowNotificationModal(false);
        setNotificationTitle({ en: "", fr: "" });
        setNotificationBody({ en: "", fr: "" });
      } else {
        alert(result.message || "Failed to send notification");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setNotificationLoading(false);
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

  const { user, moderation, warnings, actions, feedback } = data;
  const isSuspended = moderation.status === "suspended";
  const isBanned = moderation.status === "banned";

  return (
    <div>
      <Header
        title="User Management"
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

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.email && (
                  <div className="flex items-center gap-3">
                    <Envelope size={16} className="text-text-muted" />
                    <span className="text-sm text-text-body">{data.email}</span>
                  </div>
                )}
                {data.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-text-muted" />
                    <div className="text-sm">
                      <span className="text-text-muted">Joined: </span>
                      <span className="text-text-body">{formatDate(data.created_at)}</span>
                    </div>
                  </div>
                )}
                {data.last_sign_in_at && (
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-text-muted" />
                    <div className="text-sm">
                      <span className="text-text-muted">Last active: </span>
                      <span className="text-text-body">{formatTimeAgo(data.last_sign_in_at)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Card */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {data.is_premium ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Crown size={18} className="text-accent" />
                      <span className="font-medium text-text-heading">
                        {data.is_trial ? "Trial" : "Premium"}
                      </span>
                    </div>
                    {data.subscription_expires_at && (
                      <div className="text-sm text-text-muted">
                        Expires: {formatDate(data.subscription_expires_at)}
                      </div>
                    )}
                    {data.subscription_product_id && (
                      <div className="text-sm text-text-muted">
                        Product: {data.subscription_product_id}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant="outline">Free User</Badge>
                  </div>
                )}
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
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-text-muted">Reports submitted</span>
                  <span className="font-medium text-text-heading">{data.reports_submitted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">False reports made</span>
                  <span className="font-medium text-text-heading">{moderation.false_report_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Reporter reliability</span>
                  <span className="font-medium text-text-heading">
                    {moderation.reporter_reliability_score}%
                  </span>
                </div>
                {moderation.suspended_until && (
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm text-text-muted">Suspended until</span>
                    <span className="font-medium text-terracotta-500">
                      {formatDateTime(moderation.suspended_until)}
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
                {/* Send Notification - always available */}
                <Button
                  variant="primary"
                  className="w-full justify-start"
                  onClick={() => setShowNotificationModal(true)}
                >
                  <Bell size={18} />
                  Send Notification
                </Button>

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

                <div className="pt-3 border-t border-border">
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={() => openActionModal("delete")}
                  >
                    <Trash size={18} />
                    Delete User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings, History & Feedback */}
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

            {/* User Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>User Feedback ({feedback?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {!feedback || feedback.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No feedback submitted</p>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface"
                      >
                        <div className="flex-shrink-0">
                          <ChatCircleText size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{formatCategory(item.category)}</Badge>
                            <StatusBadge status={item.status} />
                          </div>
                          {item.description && (
                            <p className="text-text-body text-sm mt-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                            <span>{formatTimeAgo(item.created_at)}</span>
                            {item.recipes && <span>Recipe: {item.recipes.title}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Recipes */}
            <Card>
              <CardHeader>
                <CardTitle>User Recipes ({userRecipes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {recipesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : userRecipes.length === 0 ? (
                  <p className="text-center text-text-muted py-8">No recipes created</p>
                ) : (
                  <div className="space-y-4">
                    {userRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface"
                      >
                        {recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                            <CookingPot size={24} className="text-text-muted" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-text-heading font-medium truncate">{recipe.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">{recipe.source_type}</Badge>
                            {recipe.is_hidden ? (
                              <Badge variant="danger" className="flex items-center gap-1">
                                <EyeSlash size={10} />
                                Hidden
                              </Badge>
                            ) : (
                              <Badge variant="success" className="flex items-center gap-1">
                                <Eye size={10} />
                                Visible
                              </Badge>
                            )}
                            {recipe.is_draft && (
                              <Badge variant="warning" className="flex items-center gap-1">
                                <PencilSimple size={10} />
                                Draft
                              </Badge>
                            )}
                            {!recipe.is_public && !recipe.is_draft && (
                              <Badge variant="outline">Private</Badge>
                            )}
                          </div>
                          <span className="text-sm text-text-muted mt-1 block">
                            {formatTimeAgo(recipe.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {userRecipes.length >= 20 && (
                      <Link
                        href={`/recipes?user_id=${userId}`}
                        className="block text-center text-sm text-primary hover:underline pt-2"
                      >
                        View all recipes
                      </Link>
                    )}
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
                {actionType === "delete" && "Delete User"}
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

              {actionType === "delete" && (
                <div className="p-3 rounded-lg bg-terracotta-500/10 border border-terracotta-500/20">
                  <p className="text-sm text-terracotta-500 font-medium mb-2">
                    This action is irreversible!
                  </p>
                  <p className="text-sm text-terracotta-500">
                    The user account will be permanently deleted. Video-extracted recipes will be
                    transferred to the system account. Personal recipes will be deleted.
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
                  variant={
                    actionType === "ban" || actionType === "suspend" || actionType === "delete"
                      ? "danger"
                      : "primary"
                  }
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

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Tabs */}
              <div className="flex gap-2 p-1 bg-surface rounded-lg border border-border">
                <button
                  onClick={() => setNotificationLanguage("en")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                    notificationLanguage === "en"
                      ? "bg-primary text-white shadow-soft"
                      : "text-text-body hover:bg-surface-elevated"
                  }`}
                >
                  <span>🇬🇧</span>
                  <span className="font-medium">English</span>
                  {notificationTitle.en.trim() && notificationBody.en.trim() && (
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                  )}
                </button>
                <button
                  onClick={() => setNotificationLanguage("fr")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                    notificationLanguage === "fr"
                      ? "bg-primary text-white shadow-soft"
                      : "text-text-body hover:bg-surface-elevated"
                  }`}
                >
                  <span>🇫🇷</span>
                  <span className="font-medium">French</span>
                  {notificationTitle.fr.trim() && notificationBody.fr.trim() && (
                    <span className="w-2 h-2 rounded-full bg-white/50" />
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Title ({notificationLanguage.toUpperCase()}) *
                  <span className="text-text-muted font-normal ml-2">
                    ({notificationTitle[notificationLanguage].length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  value={notificationTitle[notificationLanguage]}
                  onChange={(e) =>
                    setNotificationTitle({
                      ...notificationTitle,
                      [notificationLanguage]: e.target.value.slice(0, 100),
                    })
                  }
                  placeholder={
                    notificationLanguage === "en"
                      ? "Notification title..."
                      : "Titre de la notification..."
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Message ({notificationLanguage.toUpperCase()}) *
                  <span className="text-text-muted font-normal ml-2">
                    ({notificationBody[notificationLanguage].length}/500)
                  </span>
                </label>
                <textarea
                  value={notificationBody[notificationLanguage]}
                  onChange={(e) =>
                    setNotificationBody({
                      ...notificationBody,
                      [notificationLanguage]: e.target.value.slice(0, 500),
                    })
                  }
                  placeholder={
                    notificationLanguage === "en"
                      ? "Notification message..."
                      : "Message de la notification..."
                  }
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Content Status */}
              <div className="flex gap-4 text-sm">
                <div className={`flex items-center gap-2 ${notificationTitle.en.trim() && notificationBody.en.trim() ? "text-primary" : "text-text-muted"}`}>
                  <span>🇬🇧</span>
                  <span>{notificationTitle.en.trim() && notificationBody.en.trim() ? "Complete" : "Incomplete"}</span>
                </div>
                <div className={`flex items-center gap-2 ${notificationTitle.fr.trim() && notificationBody.fr.trim() ? "text-primary" : "text-text-muted"}`}>
                  <span>🇫🇷</span>
                  <span>{notificationTitle.fr.trim() && notificationBody.fr.trim() ? "Complete" : "Incomplete"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">
                  This notification will be sent to <strong>{user?.name || "this user"}</strong> in their preferred language.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationTitle({ en: "", fr: "" });
                    setNotificationBody({ en: "", fr: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSendNotification}
                  loading={notificationLoading}
                  disabled={
                    !notificationTitle.en.trim() ||
                    !notificationTitle.fr.trim() ||
                    !notificationBody.en.trim() ||
                    !notificationBody.fr.trim()
                  }
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
