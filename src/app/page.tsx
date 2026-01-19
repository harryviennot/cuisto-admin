"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flag,
  ChatCircleText,
  Warning,
  Prohibit,
  CaretRight,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/stats/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PriorityBadge, ReasonBadge } from "@/components/ui/Badge";
import { getStatistics, getReports } from "@/lib/api";
import type { ModerationStatistics, ContentReport } from "@/types/admin";

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

export default function Dashboard() {
  const [stats, setStats] = useState<ModerationStatistics | null>(null);
  const [recentReports, setRecentReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [statsData, reportsData] = await Promise.all([
          getStatistics(),
          getReports({ status: "pending", limit: 5 }),
        ]);
        setStats(statsData);
        setRecentReports(reportsData.reports);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-terracotta-500 mb-2">Error loading dashboard</p>
          <p className="text-text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const pendingReports = stats?.reports.by_status.pending || 0;
  const pendingFeedback = stats?.feedback.by_status.pending || 0;
  const warnedUsers = stats?.users.warned || 0;
  const bannedUsers = stats?.users.banned || 0;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of moderation activity"
      />

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Reports"
            value={pendingReports}
            variant={pendingReports > 10 ? "danger" : pendingReports > 5 ? "warning" : "default"}
            icon={<Flag size={24} className="text-primary" weight="duotone" />}
          />
          <StatCard
            title="Pending Feedback"
            value={pendingFeedback}
            variant={pendingFeedback > 20 ? "warning" : "default"}
            icon={<ChatCircleText size={24} className="text-primary" weight="duotone" />}
          />
          <StatCard
            title="Warned Users"
            value={warnedUsers}
            variant="warning"
            icon={<Warning size={24} className="text-accent-dark" weight="duotone" />}
          />
          <StatCard
            title="Banned Users"
            value={bannedUsers}
            variant="danger"
            icon={<Prohibit size={24} className="text-terracotta-500" weight="duotone" />}
          />
        </div>

        {/* Recent Reports */}
        <div className="mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent High-Priority Reports</CardTitle>
              <Link
                href="/reports"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light"
              >
                View all
                <CaretRight size={16} />
              </Link>
            </CardHeader>
            <CardContent>
              {recentReports.length === 0 ? (
                <p className="py-8 text-center text-text-muted">
                  No pending reports
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/reports/${report.id}`}
                      className="flex items-center justify-between py-4 transition-colors hover:bg-surface -mx-6 px-6 first:-mt-2 last:-mb-2"
                    >
                      <div className="flex items-center gap-4">
                        {report.recipes?.image_url ? (
                          <img
                            src={report.recipes.image_url}
                            alt={report.recipes.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-surface flex items-center justify-center">
                            <Flag size={20} className="text-text-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-heading line-clamp-1">
                            {report.recipes?.title || "Unknown Recipe"}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <ReasonBadge reason={report.reason} />
                            <PriorityBadge priority={report.priority} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-muted">
                          {formatTimeAgo(report.created_at)}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          by {report.reporter?.name || "Anonymous"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Breakdown */}
        {stats && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Pending by Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.reports.pending_by_reason)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([reason, count]) => (
                      <div key={reason} className="flex items-center justify-between">
                        <ReasonBadge reason={reason} />
                        <span className="font-medium text-text-heading">{count}</span>
                      </div>
                    ))}
                  {Object.values(stats.reports.pending_by_reason).every((v) => v === 0) && (
                    <p className="text-center text-text-muted py-4">No pending reports</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.feedback.pending_by_category)
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-text-body">
                          {category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="font-medium text-text-heading">{count}</span>
                      </div>
                    ))}
                  {Object.values(stats.feedback.pending_by_category).every((v) => v === 0) && (
                    <p className="text-center text-text-muted py-4">No pending feedback</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
