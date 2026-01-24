"use client";

import { useState } from "react";
import { Bell, PaperPlaneTilt, Users, User } from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { sendNotification } from "@/lib/api";
import type { SendNotificationResponse, LocalizedContent } from "@/types/admin";

type Language = "en" | "fr";

export default function NotificationsPage() {
  const [mode, setMode] = useState<"broadcast" | "targeted">("targeted");
  const [userId, setUserId] = useState("");
  const [activeLanguage, setActiveLanguage] = useState<Language>("en");
  const [title, setTitle] = useState<LocalizedContent>({ en: "", fr: "" });
  const [body, setBody] = useState<LocalizedContent>({ en: "", fr: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendNotificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSend =
    title.en.trim() &&
    title.fr.trim() &&
    body.en.trim() &&
    body.fr.trim() &&
    (mode === "broadcast" || userId.trim());

  async function handleSend() {
    if (!canSend) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await sendNotification({
        user_id: mode === "targeted" ? userId.trim() : undefined,
        title: {
          en: title.en.trim(),
          fr: title.fr.trim(),
        },
        body: {
          en: body.en.trim(),
          fr: body.fr.trim(),
        },
      });
      setResult(response);

      // Clear form on success
      if (response.success) {
        setTitle({ en: "", fr: "" });
        setBody({ en: "", fr: "" });
        if (mode === "targeted") setUserId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setLoading(false);
    }
  }

  const languageTabs: { key: Language; label: string; flag: string }[] = [
    { key: "en", label: "English", flag: "🇬🇧" },
    { key: "fr", label: "French", flag: "🇫🇷" },
  ];

  return (
    <div>
      <Header
        title="Notifications"
        subtitle="Send push notifications to users in their preferred language"
      />

      <div className="p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode("targeted")}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    mode === "targeted"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-surface text-text-body hover:border-primary/50"
                  }`}
                >
                  <User size={24} weight={mode === "targeted" ? "fill" : "duotone"} />
                  <div className="text-left">
                    <p className="font-medium">Specific User</p>
                    <p className="text-sm text-text-muted">Send to one user</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode("broadcast")}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    mode === "broadcast"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-surface text-text-body hover:border-primary/50"
                  }`}
                >
                  <Users size={24} weight={mode === "broadcast" ? "fill" : "duotone"} />
                  <div className="text-left">
                    <p className="font-medium">Broadcast</p>
                    <p className="text-sm text-text-muted">Send to all users</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Compose Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User ID (only for targeted mode) */}
              {mode === "targeted" && (
                <div>
                  <label className="block text-sm font-medium text-text-body mb-2">
                    User ID *
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user UUID..."
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {/* Language Tabs */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Language
                </label>
                <div className="flex gap-2 p-1 bg-surface rounded-lg border border-border">
                  {languageTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveLanguage(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
                        activeLanguage === tab.key
                          ? "bg-primary text-white shadow-soft"
                          : "text-text-body hover:bg-surface-elevated"
                      }`}
                    >
                      <span>{tab.flag}</span>
                      <span className="font-medium">{tab.label}</span>
                      {/* Indicator if content is filled */}
                      {title[tab.key].trim() && body[tab.key].trim() && (
                        <span className="w-2 h-2 rounded-full bg-primary-light" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Title ({activeLanguage.toUpperCase()}) *
                  <span className="text-text-muted font-normal ml-2">
                    ({title[activeLanguage].length}/100)
                  </span>
                </label>
                <input
                  type="text"
                  value={title[activeLanguage]}
                  onChange={(e) =>
                    setTitle({ ...title, [activeLanguage]: e.target.value.slice(0, 100) })
                  }
                  placeholder={
                    activeLanguage === "en"
                      ? "Notification title..."
                      : "Titre de la notification..."
                  }
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-text-body mb-2">
                  Body ({activeLanguage.toUpperCase()}) *
                  <span className="text-text-muted font-normal ml-2">
                    ({body[activeLanguage].length}/500)
                  </span>
                </label>
                <textarea
                  value={body[activeLanguage]}
                  onChange={(e) =>
                    setBody({ ...body, [activeLanguage]: e.target.value.slice(0, 500) })
                  }
                  placeholder={
                    activeLanguage === "en"
                      ? "Notification message..."
                      : "Message de la notification..."
                  }
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-text-body placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              {/* Content Status */}
              <div className="flex gap-4 text-sm">
                <div className={`flex items-center gap-2 ${title.en.trim() && body.en.trim() ? "text-primary" : "text-text-muted"}`}>
                  <span>🇬🇧</span>
                  <span>{title.en.trim() && body.en.trim() ? "Complete" : "Incomplete"}</span>
                </div>
                <div className={`flex items-center gap-2 ${title.fr.trim() && body.fr.trim() ? "text-primary" : "text-text-muted"}`}>
                  <span>🇫🇷</span>
                  <span>{title.fr.trim() && body.fr.trim() ? "Complete" : "Incomplete"}</span>
                </div>
              </div>

              {/* Warning for broadcast */}
              {mode === "broadcast" && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-accent-dark">
                    This will send a notification to <strong>all users</strong> with active push tokens.
                    Each user will receive the message in their preferred language.
                  </p>
                </div>
              )}

              {/* Send Button */}
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSend}
                loading={loading}
                disabled={!canSend}
              >
                <PaperPlaneTilt size={18} />
                {mode === "broadcast" ? "Send to All Users" : "Send Notification"}
              </Button>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardContent className="pt-6">
                <div className={`text-center p-4 rounded-lg ${
                  result.success ? "bg-primary/10" : "bg-terracotta-500/10"
                }`}>
                  <Badge variant={result.success ? "success" : "danger"} className="mb-2">
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                  <p className="text-text-body mb-2">{result.message}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <span className="text-primary">
                      Sent: {result.sent_count}
                    </span>
                    {result.failed_count > 0 && (
                      <span className="text-terracotta-500">
                        Failed: {result.failed_count}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 rounded-lg bg-terracotta-500/10">
                  <Badge variant="danger" className="mb-2">Error</Badge>
                  <p className="text-terracotta-500">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
