"use client";

import { clsx } from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-forest-100 text-forest-700",
  success: "bg-forest-100 text-forest-700",
  warning: "bg-accent/20 text-brown-700",
  danger: "bg-terracotta-500/15 text-terracotta-500",
  info: "bg-forest-50 text-forest-600",
  outline: "border border-border text-text-muted bg-transparent",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Priority badge helper
export function PriorityBadge({ priority }: { priority: number }) {
  let variant: BadgeVariant = "default";
  let label = "Low";

  if (priority >= 8) {
    variant = "danger";
    label = "High";
  } else if (priority >= 4) {
    variant = "warning";
    label = "Medium";
  } else {
    variant = "success";
    label = "Low";
  }

  return <Badge variant={variant}>{label}</Badge>;
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  let variant: BadgeVariant = "outline";

  switch (status) {
    case "pending":
      variant = "warning";
      break;
    case "in_review":
      variant = "info";
      break;
    case "resolved":
      variant = "success";
      break;
    case "escalated":
      variant = "danger";
      break;
  }

  const label = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return <Badge variant={variant}>{label}</Badge>;
}

// Reason badge helper
export function ReasonBadge({ reason }: { reason: string }) {
  let variant: BadgeVariant = "outline";

  switch (reason) {
    case "hate_speech":
      variant = "danger";
      break;
    case "inappropriate_content":
    case "misinformation":
      variant = "warning";
      break;
    case "copyright_violation":
    case "spam_advertising":
      variant = "info";
      break;
  }

  const label = reason.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return <Badge variant={variant}>{label}</Badge>;
}
