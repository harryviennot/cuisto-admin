"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EyeSlash, Eye, User, ArrowLeft } from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getHiddenRecipes, unhideRecipe } from "@/lib/api";
import type { HiddenRecipe } from "@/types/admin";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HiddenRecipesPage() {
  const [recipes, setRecipes] = useState<HiddenRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unhidingId, setUnhidingId] = useState<string | null>(null);

  // Unhide modal state
  const [showUnhideModal, setShowUnhideModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<HiddenRecipe | null>(null);
  const [unhideReason, setUnhideReason] = useState("");

  async function fetchRecipes() {
    try {
      setLoading(true);
      const data = await getHiddenRecipes({ limit: 50 });
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hidden recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecipes();
  }, []);

  function openUnhideModal(recipe: HiddenRecipe) {
    setSelectedRecipe(recipe);
    setUnhideReason("");
    setShowUnhideModal(true);
  }

  async function handleUnhide() {
    if (!selectedRecipe || !unhideReason.trim()) return;

    setUnhidingId(selectedRecipe.id);
    try {
      await unhideRecipe(selectedRecipe.id, { reason: unhideReason });
      // Remove from list
      setRecipes((prev) => prev.filter((r) => r.id !== selectedRecipe.id));
      setTotal((prev) => prev - 1);
      setShowUnhideModal(false);
      setSelectedRecipe(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unhide recipe");
    } finally {
      setUnhidingId(null);
    }
  }

  return (
    <div>
      <Header
        title="Hidden Recipes"
        subtitle={`${total} hidden recipe${total !== 1 ? "s" : ""}`}
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
        {/* Loading / Error / Empty states */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-text-muted">Loading hidden recipes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-terracotta-500 mb-2">Error loading recipes</p>
              <p className="text-text-muted text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchRecipes} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <EyeSlash size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No hidden recipes</p>
            </div>
          </div>
        ) : (
          /* Recipes Table */
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Recipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Hidden At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Hidden By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recipes.map((recipe) => (
                    <tr key={recipe.id} className="transition-colors hover:bg-surface">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt={recipe.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-surface-texture-light flex items-center justify-center">
                              <EyeSlash size={16} className="text-text-muted" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-text-heading line-clamp-1 max-w-[200px]">
                              {recipe.title}
                            </span>
                            {recipe.source_url && (
                              <a
                                href={recipe.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline block"
                              >
                                View source
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-body line-clamp-2 max-w-[200px]">
                          {recipe.hidden_reason || "No reason provided"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {recipe.hidden_at ? formatDate(recipe.hidden_at) : "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        {recipe.hidden_by ? (
                          <div className="flex items-center gap-2">
                            {recipe.hidden_by.avatar_url ? (
                              <img
                                src={recipe.hidden_by.avatar_url}
                                alt={recipe.hidden_by.name || "Moderator"}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-surface flex items-center justify-center">
                                <User size={12} className="text-text-muted" />
                              </div>
                            )}
                            <span className="text-sm text-text-body">
                              {recipe.hidden_by.name || "Moderator"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {recipe.owner ? (
                          <Link
                            href={`/users/${recipe.owner.id}`}
                            className="flex items-center gap-2 hover:text-primary"
                          >
                            {recipe.owner.avatar_url ? (
                              <img
                                src={recipe.owner.avatar_url}
                                alt={recipe.owner.name || "User"}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-surface flex items-center justify-center">
                                <User size={12} className="text-text-muted" />
                              </div>
                            )}
                            <span className="text-sm text-text-body">
                              {recipe.owner.name || "Unknown"}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-sm text-text-muted">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUnhideModal(recipe)}
                        >
                          <Eye size={14} />
                          Unhide
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Unhide Modal */}
      {showUnhideModal && selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-text-heading mb-4">
                Unhide Recipe
              </h3>
              <p className="text-text-body mb-4">
                Are you sure you want to unhide &quot;{selectedRecipe.title}&quot;?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-body mb-2">
                  Reason for unhiding *
                </label>
                <input
                  type="text"
                  value={unhideReason}
                  onChange={(e) => setUnhideReason(e.target.value)}
                  placeholder="Enter reason for unhiding this recipe"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUnhideModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleUnhide}
                  loading={unhidingId === selectedRecipe.id}
                  disabled={!unhideReason.trim()}
                >
                  Unhide Recipe
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
