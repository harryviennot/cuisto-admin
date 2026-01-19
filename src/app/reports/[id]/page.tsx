"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Flag,
  User,
  Clock,
  Eye,
  EyeSlash,
  Warning,
  Prohibit,
  Check,
  X,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, ReasonBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import {
  getReport,
  dismissReport,
  takeActionOnReport,
  hideRecipe,
} from "@/lib/api";
import type { ContentReportDetail } from "@/types/admin";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

const SUSPENSION_DURATIONS = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "1 month" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
  { value: 1825, label: "5 years" },
];

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<ContentReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [alsoHideRecipe, setAlsoHideRecipe] = useState(false);
  const [userAction, setUserAction] = useState<string>("none"); // "none", "warn", "suspend", "ban"

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const data = await getReport(reportId);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  async function handleDismiss() {
    if (!report) return;
    setActionLoading("dismiss");
    try {
      await dismissReport(report.id, {
        reason: actionReason || "Dismissed by moderator",
        notes: actionNotes || undefined,
        is_false_report: false,
      });
      router.push("/reports");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to dismiss report");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleHideRecipe() {
    if (!report?.recipe_id) return;
    setActionLoading("hide");
    try {
      // Hide the recipe
      await hideRecipe(report.recipe_id, {
        reason: actionReason || "Hidden due to content report",
      });

      // If user action is selected, also take action on the user
      if (userAction !== "none") {
        await takeActionOnReport(report.id, {
          action: userAction as "warn_user" | "suspend_user" | "ban_user",
          reason: actionReason,
          notes: actionNotes || undefined,
          suspension_days: userAction === "suspend_user" ? suspensionDays : undefined,
        });
        router.push("/reports");
        return;
      }

      // Update report status
      const data = await getReport(reportId);
      setReport(data);
      setShowActionModal(false);
      resetModalState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete action");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTakeAction() {
    if (!report || !actionType) return;
    setActionLoading(actionType);
    try {
      // If also hiding recipe, do that first
      if (alsoHideRecipe && report.recipe_id) {
        await hideRecipe(report.recipe_id, {
          reason: actionReason || "Hidden due to content report",
        });
      }

      await takeActionOnReport(report.id, {
        action: actionType as "hide_recipe" | "warn_user" | "suspend_user" | "ban_user",
        reason: actionReason,
        notes: actionNotes || undefined,
        suspension_days: actionType === "suspend_user" ? suspensionDays : undefined,
      });
      router.push("/reports");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to take action");
    } finally {
      setActionLoading(null);
      setShowActionModal(false);
    }
  }

  function resetModalState() {
    setActionReason("");
    setActionNotes("");
    setAlsoHideRecipe(false);
    setUserAction("none");
    setSuspensionDays(7);
  }

  function openActionModal(type: string) {
    setActionType(type);
    resetModalState();
    setShowActionModal(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-terracotta-500 mb-2">Error loading report</p>
          <p className="text-text-muted text-sm">{error}</p>
          <Link href="/reports">
            <Button variant="outline" size="sm" className="mt-4">
              Back to Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const recipe = report.recipes;

  return (
    <div>
      <Header
        title="Report Details"
        subtitle={`Report #${report.id.slice(0, 8)}`}
        actions={
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to Reports
            </Button>
          </Link>
        }
      />

      <div className="p-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content - Recipe Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipe Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reported Recipe</CardTitle>
                  {recipe?.source_url && (
                    <a
                      href={recipe.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View Source
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recipe ? (
                  <div>
                    {/* Recipe Image */}
                    {recipe.image_url && (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-64 object-cover rounded-lg mb-6"
                      />
                    )}

                    {/* Recipe Title & Description */}
                    <h2 className="text-2xl font-playfair font-semibold text-text-heading mb-2">
                      {recipe.title}
                    </h2>
                    {recipe.description && (
                      <p className="text-text-body mb-6">{recipe.description}</p>
                    )}

                    {/* Ingredients */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-text-heading mb-3">Ingredients</h3>
                        <ul className="space-y-2">
                          {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="text-text-body">
                              {ing.quantity && `${ing.quantity} `}
                              {ing.unit && `${ing.unit} `}
                              <span className="font-medium">{ing.name}</span>
                              {ing.notes && <span className="text-text-muted"> ({ing.notes})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {recipe.instructions && recipe.instructions.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-text-heading mb-3">Instructions</h3>
                        <ol className="space-y-4">
                          {recipe.instructions.map((step, idx) => (
                            <li key={idx} className="flex gap-4">
                              <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-sm font-medium">
                                {step.step_number}
                              </span>
                              <div>
                                {step.title && (
                                  <p className="font-medium text-text-heading">{step.title}</p>
                                )}
                                <p className="text-text-body">{step.description}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-8">Recipe not found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Report Info & Actions */}
          <div className="space-y-6">
            {/* Report Info */}
            <Card>
              <CardHeader>
                <CardTitle>Report Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Status</span>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Reason</span>
                  <ReasonBadge reason={report.reason} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Priority</span>
                  <PriorityBadge priority={report.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Created</span>
                  <span className="text-sm text-text-body">{formatDate(report.created_at)}</span>
                </div>
                {report.description && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-text-muted mb-2">Description</p>
                    <p className="text-text-body">{report.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reporter Info */}
            <Card>
              <CardHeader>
                <CardTitle>Reporter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {report.reporter?.avatar_url ? (
                    <img
                      src={report.reporter.avatar_url}
                      alt={report.reporter.name || "Reporter"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center">
                      <User size={20} className="text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-heading">
                      {report.reporter?.name || "Anonymous"}
                    </p>
                    {report.reporter?.id && (
                      <Link
                        href={`/users/${report.reporter.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View user
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {report.status === "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDismiss}
                    loading={actionLoading === "dismiss"}
                  >
                    <X size={18} />
                    Dismiss Report
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => openActionModal("hide_recipe")}
                  >
                    <EyeSlash size={18} />
                    Hide Recipe
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    onClick={() => openActionModal("warn_user")}
                  >
                    <Warning size={18} />
                    Warn User
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={() => openActionModal("suspend_user")}
                  >
                    <Clock size={18} />
                    Suspend User
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={() => openActionModal("ban_user")}
                  >
                    <Prohibit size={18} />
                    Ban User
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Resolution Info */}
            {report.status === "resolved" && report.resolved_by_user && (
              <Card>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-forest-500" />
                    <span className="text-text-body">
                      Resolved by {report.resolved_by_user.name || "Moderator"}
                    </span>
                  </div>
                  {report.resolved_at && (
                    <p className="text-sm text-text-muted">
                      {formatDate(report.resolved_at)}
                    </p>
                  )}
                  {report.resolution_notes && (
                    <p className="text-text-body pt-2 border-t border-border">
                      {report.resolution_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {actionType === "hide_recipe" && "Hide Recipe"}
                {actionType === "warn_user" && "Warn User"}
                {actionType === "suspend_user" && "Suspend User"}
                {actionType === "ban_user" && "Ban User"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Reason *
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* For user actions (warn/suspend/ban), show "Also hide recipe" checkbox */}
              {(actionType === "warn_user" || actionType === "suspend_user" || actionType === "ban_user") && report?.recipe_id && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alsoHideRecipe}
                    onChange={(e) => setAlsoHideRecipe(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-body">Also hide the recipe</span>
                </label>
              )}

              {/* For hide recipe action, show user action dropdown */}
              {actionType === "hide_recipe" && (
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    Also take action on user
                  </label>
                  <select
                    value={userAction}
                    onChange={(e) => setUserAction(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="none">No additional action</option>
                    <option value="warn_user">Warn user</option>
                    <option value="suspend_user">Suspend user</option>
                    <option value="ban_user">Ban user</option>
                  </select>
                </div>
              )}

              {/* Show suspension duration for suspend actions */}
              {(actionType === "suspend_user" || userAction === "suspend_user") && (
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    Suspension Duration
                  </label>
                  <select
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {SUSPENSION_DURATIONS.map((duration) => (
                      <option key={duration.value} value={duration.value}>
                        {duration.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionType?.includes("ban") || actionType?.includes("suspend") || userAction?.includes("ban") || userAction?.includes("suspend") ? "danger" : "primary"}
                  className="flex-1"
                  onClick={actionType === "hide_recipe" ? handleHideRecipe : handleTakeAction}
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
