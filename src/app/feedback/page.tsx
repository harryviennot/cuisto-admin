"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatCircleText, FunnelSimple, Check } from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { getFeedback, resolveFeedback } from "@/lib/api";
import type { ExtractionFeedback } from "@/types/admin";

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

function formatCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "wrong_ingredients", label: "Wrong Ingredients" },
  { value: "missing_steps", label: "Missing Steps" },
  { value: "incorrect_steps", label: "Incorrect Steps" },
  { value: "bad_formatting", label: "Bad Formatting" },
  { value: "wrong_measurements", label: "Wrong Measurements" },
  { value: "ai_hallucination", label: "AI Hallucination" },
  { value: "wrong_title", label: "Wrong Title" },
  { value: "wrong_image", label: "Wrong Image" },
  { value: "other", label: "Other" },
];

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<ExtractionFeedback[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Quick resolve
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Detail modal
  const [selectedFeedback, setSelectedFeedback] = useState<ExtractionFeedback | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [wasHelpful, setWasHelpful] = useState(false);

  async function fetchFeedback() {
    try {
      setLoading(true);
      const data = await getFeedback({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        limit: 50,
      });
      setFeedback(data.feedback);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, categoryFilter]);

  async function handleResolve() {
    if (!selectedFeedback) return;

    setResolvingId(selectedFeedback.id);
    try {
      await resolveFeedback(selectedFeedback.id, {
        resolution_notes: resolutionNotes || undefined,
        was_helpful: wasHelpful,
      });
      // Refresh list
      await fetchFeedback();
      setSelectedFeedback(null);
      setResolutionNotes("");
      setWasHelpful(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve feedback");
    } finally {
      setResolvingId(null);
    }
  }

  async function handleQuickResolve(feedbackId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setResolvingId(feedbackId);
    try {
      await resolveFeedback(feedbackId, {
        was_helpful: false,
      });
      // Remove from list or refresh
      setFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve feedback");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div>
      <Header
        title="Extraction Feedback"
        subtitle={`${total} feedback item${total !== 1 ? "s" : ""} total`}
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
                <label className="text-sm font-medium text-text-body">Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter || categoryFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("");
                    setCategoryFilter("");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Loading / Error */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-text-muted">Loading feedback...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-terracotta-500 mb-2">Error loading feedback</p>
              <p className="text-text-muted text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchFeedback} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <ChatCircleText size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No feedback found</p>
            </div>
          </div>
        ) : (
          /* Feedback Table */
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Recipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Time
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {feedback.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface cursor-pointer"
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.recipes?.image_url ? (
                            <img
                              src={item.recipes.image_url}
                              alt={item.recipes.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-surface-texture-light flex items-center justify-center">
                              <ChatCircleText size={16} className="text-text-muted" />
                            </div>
                          )}
                          <span className="font-medium text-text-heading line-clamp-1 max-w-[200px]">
                            {item.recipes?.title || "Unknown Recipe"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{formatCategory(item.category)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-text-body">
                        {item.user?.name || "Anonymous"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {formatTimeAgo(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={resolvingId === item.id}
                            onClick={(e) => handleQuickResolve(item.id, e)}
                          >
                            <Check size={14} />
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Feedback Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipe Info */}
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                {selectedFeedback.recipes?.image_url ? (
                  <img
                    src={selectedFeedback.recipes.image_url}
                    alt={selectedFeedback.recipes.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-surface-texture-light flex items-center justify-center">
                    <ChatCircleText size={24} className="text-text-muted" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-text-heading">
                    {selectedFeedback.recipes?.title || "Unknown Recipe"}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {formatCategory(selectedFeedback.category)}
                  </Badge>
                </div>
              </div>

              {/* Feedback Description */}
              {selectedFeedback.description && (
                <div>
                  <p className="text-sm font-medium text-text-muted mb-2">User Description</p>
                  <p className="text-text-body p-3 bg-surface rounded-lg">
                    {selectedFeedback.description}
                  </p>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Submitted by</span>
                <span className="text-text-body">{selectedFeedback.user?.name || "Anonymous"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Submitted</span>
                <span className="text-text-body">{formatTimeAgo(selectedFeedback.created_at)}</span>
              </div>

              {/* Resolution Form (if pending) */}
              {selectedFeedback.status === "pending" && (
                <div className="pt-4 border-t border-border space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-body mb-2">
                      Resolution Notes (optional)
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Notes about how this was addressed..."
                      rows={3}
                      className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wasHelpful}
                      onChange={(e) => setWasHelpful(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text-body">
                      This feedback was helpful for improvement
                    </span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedFeedback(null);
                        setResolutionNotes("");
                        setWasHelpful(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleResolve}
                      loading={!!resolvingId}
                    >
                      <Check size={16} />
                      Resolve
                    </Button>
                  </div>
                </div>
              )}

              {/* Already resolved */}
              {selectedFeedback.status === "resolved" && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-forest-500 mb-2">
                    <Check size={18} />
                    <span className="font-medium">Resolved</span>
                  </div>
                  {selectedFeedback.was_helpful && (
                    <Badge variant="success">Marked as helpful</Badge>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      setSelectedFeedback(null);
                      setResolutionNotes("");
                      setWasHelpful(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
