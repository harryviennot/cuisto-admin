"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, FunnelSimple, CaretRight, EyeSlash } from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, ReasonBadge, StatusBadge } from "@/components/ui/Badge";
import { getReports, dismissReport } from "@/lib/api";
import type { ContentReport, ReportStatus, ContentReportReason } from "@/types/admin";

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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
];

const REASON_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Reasons" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "copyright_violation", label: "Copyright Violation" },
  { value: "spam_advertising", label: "Spam / Advertising" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Quick dismiss
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  async function fetchReports() {
    try {
      setLoading(true);
      const data = await getReports({
        status: statusFilter || undefined,
        reason: reasonFilter || undefined,
        limit: 50,
      });
      setReports(data.reports);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, [statusFilter, reasonFilter]);

  async function handleQuickDismiss(reportId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (dismissingId) return;

    setDismissingId(reportId);
    try {
      await dismissReport(reportId, {
        reason: "Quick dismissed from queue",
        is_false_report: false,
      });
      // Remove from list
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to dismiss report");
    } finally {
      setDismissingId(null);
    }
  }

  return (
    <div>
      <Header
        title="Content Reports"
        subtitle={`${total} report${total !== 1 ? "s" : ""} total`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/reports/hidden">
              <Button variant="outline" size="sm">
                <EyeSlash size={16} />
                Hidden Recipes
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelSimple size={16} />
              Filters
            </Button>
          </div>
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
                <label className="text-sm font-medium text-text-body">Reason:</label>
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-body focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter || reasonFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("");
                    setReasonFilter("");
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
              <p className="text-text-muted">Loading reports...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-terracotta-500 mb-2">Error loading reports</p>
              <p className="text-text-muted text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchReports} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Flag size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No reports found</p>
            </div>
          </div>
        ) : (
          /* Reports Table */
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
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Reporter
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
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="transition-colors hover:bg-surface"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/reports/${report.id}`}
                          className="flex items-center gap-3"
                        >
                          {report.recipes?.image_url ? (
                            <img
                              src={report.recipes.image_url}
                              alt={report.recipes.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-surface-texture-light flex items-center justify-center">
                              <Flag size={16} className="text-text-muted" />
                            </div>
                          )}
                          <span className="font-medium text-text-heading line-clamp-1 max-w-[200px]">
                            {report.recipes?.title || "Unknown Recipe"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <ReasonBadge reason={report.reason} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={report.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-text-body">
                        {report.reporter?.name || "Anonymous"}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {formatTimeAgo(report.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {report.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={dismissingId === report.id}
                              onClick={(e) => handleQuickDismiss(report.id, e)}
                            >
                              Dismiss
                            </Button>
                          )}
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              View
                              <CaretRight size={14} />
                            </Button>
                          </Link>
                        </div>
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
