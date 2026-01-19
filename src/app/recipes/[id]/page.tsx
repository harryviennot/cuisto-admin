"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Eye,
  EyeSlash,
  Clock,
  Warning,
  Prohibit,
  Check,
  CookingPot,
  VideoCamera,
  Camera,
  Microphone,
  ClipboardText,
  Link as LinkIcon,
  PencilSimple,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminRecipe,
  hideRecipe,
  unhideRecipe,
  warnUser,
  suspendUser,
  banUser,
} from "@/lib/api";
import type { AdminRecipeDetail } from "@/types/admin";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function SourceTypeBadge({ sourceType }: { sourceType: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; variant: "default" | "info" | "success" | "warning" }> = {
    video: { icon: <VideoCamera size={12} />, label: "Video", variant: "info" },
    url: { icon: <LinkIcon size={12} />, label: "URL", variant: "default" },
    link: { icon: <LinkIcon size={12} />, label: "Link", variant: "default" },
    photo: { icon: <Camera size={12} />, label: "Photo", variant: "success" },
    voice: { icon: <Microphone size={12} />, label: "Voice", variant: "warning" },
    paste: { icon: <ClipboardText size={12} />, label: "Paste", variant: "default" },
  };

  const { icon, label, variant } = config[sourceType] || { icon: null, label: sourceType, variant: "default" as const };

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {label}
    </Badge>
  );
}

const SUSPENSION_DURATIONS = [
  { value: 1, label: "24 hours" },
  { value: 7, label: "7 days" },
  { value: 30, label: "1 month" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<AdminRecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Action modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"hide" | "unhide" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [userAction, setUserAction] = useState<string>("none");
  const [suspensionDays, setSuspensionDays] = useState(7);

  useEffect(() => {
    async function fetchRecipe() {
      try {
        setLoading(true);
        const data = await getAdminRecipe(recipeId);
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipe");
      } finally {
        setLoading(false);
      }
    }

    if (recipeId) {
      fetchRecipe();
    }
  }, [recipeId]);

  async function handleHideRecipe() {
    if (!recipe) return;
    setActionLoading("hide");
    try {
      // Hide the recipe
      await hideRecipe(recipe.id, {
        reason: actionReason || "Hidden by moderator",
      });

      // If user action is selected, also take action on the user
      if (userAction !== "none" && recipe.created_by) {
        if (userAction === "warn") {
          await warnUser(recipe.created_by, {
            reason: actionReason,
            recipe_id: recipe.id,
          });
        } else if (userAction === "suspend") {
          await suspendUser(recipe.created_by, {
            duration_days: suspensionDays,
            reason: actionReason,
          });
        } else if (userAction === "ban") {
          await banUser(recipe.created_by, {
            reason: actionReason,
          });
        }
      }

      // Refresh recipe data
      const data = await getAdminRecipe(recipeId);
      setRecipe(data);
      setShowActionModal(false);
      resetModalState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to hide recipe");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnhideRecipe() {
    if (!recipe) return;
    setActionLoading("unhide");
    try {
      await unhideRecipe(recipe.id, {
        reason: actionReason || "Unhidden by moderator",
      });

      // Refresh recipe data
      const data = await getAdminRecipe(recipeId);
      setRecipe(data);
      setShowActionModal(false);
      resetModalState();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unhide recipe");
    } finally {
      setActionLoading(null);
    }
  }

  function resetModalState() {
    setActionReason("");
    setUserAction("none");
    setSuspensionDays(7);
  }

  function openActionModal(type: "hide" | "unhide") {
    setActionType(type);
    resetModalState();
    setShowActionModal(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-terracotta-500 mb-2">Error loading recipe</p>
          <p className="text-text-muted text-sm">{error}</p>
          <Link href="/recipes">
            <Button variant="outline" size="sm" className="mt-4">
              Back to Recipes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Recipe Details"
        subtitle={`Recipe #${recipe.id.slice(0, 8)}`}
        actions={
          <Link href="/recipes">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={16} />
              Back to Recipes
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
                  <CardTitle>Recipe Content</CardTitle>
                  {recipe.source_url && (
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
                <div>
                  {/* Recipe Image */}
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-64 object-cover rounded-lg mb-6"
                    />
                  ) : (
                    <div className="w-full h-64 bg-surface-elevated rounded-lg mb-6 flex items-center justify-center">
                      <CookingPot size={48} className="text-text-muted" />
                    </div>
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recipe Info & Actions */}
          <div className="space-y-6">
            {/* Recipe Info */}
            <Card>
              <CardHeader>
                <CardTitle>Recipe Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Status</span>
                  <div className="flex flex-wrap gap-1">
                    {recipe.is_hidden ? (
                      <Badge variant="danger" className="flex items-center gap-1">
                        <EyeSlash size={12} />
                        Hidden
                      </Badge>
                    ) : (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Eye size={12} />
                        Visible
                      </Badge>
                    )}
                    {recipe.is_draft && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <PencilSimple size={12} />
                        Draft
                      </Badge>
                    )}
                    {!recipe.is_public && !recipe.is_draft && (
                      <Badge variant="outline">Private</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Source Type</span>
                  <SourceTypeBadge sourceType={recipe.source_type} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Created</span>
                  <span className="text-sm text-text-body">{formatDate(recipe.created_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Uploader Info */}
            <Card>
              <CardHeader>
                <CardTitle>Uploader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {recipe.uploader?.avatar_url ? (
                    <img
                      src={recipe.uploader.avatar_url}
                      alt={recipe.uploader.name || "User"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-surface flex items-center justify-center">
                      <User size={20} className="text-text-muted" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-heading">
                      {recipe.uploader?.name || "Unknown User"}
                    </p>
                    {recipe.created_by && (
                      <Link
                        href={`/users/${recipe.created_by}`}
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
            {!recipe.is_hidden && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    onClick={() => openActionModal("hide")}
                  >
                    <EyeSlash size={18} />
                    Hide Recipe
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Hidden Info & Unhide */}
            {recipe.is_hidden && (
              <Card>
                <CardHeader>
                  <CardTitle>Hidden Recipe</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-terracotta-500">
                    <EyeSlash size={20} />
                    <span className="text-text-body">This recipe is hidden</span>
                  </div>
                  {recipe.hidden_at && (
                    <p className="text-sm text-text-muted">
                      Hidden on {formatDate(recipe.hidden_at)}
                    </p>
                  )}
                  {recipe.hidden_reason && (
                    <p className="text-text-body pt-2 border-t border-border">
                      <span className="text-sm text-text-muted block mb-1">Reason:</span>
                      {recipe.hidden_reason}
                    </p>
                  )}
                  {recipe.hidden_by && (
                    <p className="text-sm text-text-muted">
                      By {recipe.hidden_by.name || "Unknown moderator"}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-4"
                    onClick={() => openActionModal("unhide")}
                  >
                    <Eye size={18} />
                    Unhide Recipe
                  </Button>
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
                {actionType === "hide" && "Hide Recipe"}
                {actionType === "unhide" && "Unhide Recipe"}
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

              {/* User action dropdown (only for hide) */}
              {actionType === "hide" && (
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
                    <option value="warn">Warn user</option>
                    <option value="suspend">Suspend user</option>
                    <option value="ban">Ban user</option>
                  </select>
                </div>
              )}

              {/* Suspension duration */}
              {userAction === "suspend" && (
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

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant={actionType === "hide" ? "danger" : "primary"}
                  className="flex-1"
                  onClick={actionType === "hide" ? handleHideRecipe : handleUnhideRecipe}
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
