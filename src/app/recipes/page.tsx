"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CookingPot,
  FunnelSimple,
  MagnifyingGlass,
  User,
  Eye,
  EyeSlash,
  PencilSimple,
  Link as LinkIcon,
  VideoCamera,
  Camera,
  Microphone,
  ClipboardText,
  CaretRight,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getAdminRecipes } from "@/lib/api";
import type { AdminRecipeListItem } from "@/types/admin";

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

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Recipes" },
  { value: "hidden", label: "Hidden Only" },
  { value: "visible", label: "Visible Only" },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<AdminRecipeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 50;

  async function fetchRecipes() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminRecipes({
        search: debouncedSearch || undefined,
        is_hidden: visibilityFilter === "hidden" ? true : visibilityFilter === "visible" ? false : undefined,
        limit,
        offset,
      });
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  // Fetch recipes when filters change
  useEffect(() => {
    setOffset(0); // Reset pagination when filters change
  }, [visibilityFilter, debouncedSearch]);

  useEffect(() => {
    fetchRecipes();
  }, [visibilityFilter, debouncedSearch, offset]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <Header
        title="Recipes"
        subtitle={`${total} recipe${total !== 1 ? "s" : ""} total`}
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
              placeholder="Search by recipe title..."
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
                <label className="text-sm font-medium text-text-body">Visibility:</label>
                <select
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(visibilityFilter || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVisibilityFilter("");
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
              <p className="text-text-muted">Loading recipes...</p>
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
              <CookingPot size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No recipes found</p>
            </div>
          </div>
        ) : (
          <>
            {/* Recipes Table */}
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Recipe
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Uploader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Created
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
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-surface-elevated flex items-center justify-center">
                                <CookingPot size={20} className="text-text-muted" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-text-heading block truncate max-w-[300px]">
                                {recipe.title}
                              </span>
                              <span className="text-xs text-text-muted">{recipe.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {recipe.uploader ? (
                            <Link
                              href={`/users/${recipe.created_by}`}
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              {recipe.uploader.avatar_url ? (
                                <img
                                  src={recipe.uploader.avatar_url}
                                  alt={recipe.uploader.name || "User"}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User size={14} className="text-primary" />
                                </div>
                              )}
                              <span className="text-sm text-text-body">
                                {recipe.uploader.name || "Unknown User"}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-sm text-text-muted">Unknown</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <SourceTypeBadge sourceType={recipe.source_type} />
                        </td>
                        <td className="px-6 py-4">
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
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="text-text-body block">{formatDate(recipe.created_at)}</span>
                            <span className="text-text-muted text-xs">{formatTimeAgo(recipe.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/recipes/${recipe.id}`}>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-text-muted">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} recipes
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
