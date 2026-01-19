"use client";

import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
}

const variantStyles = {
  default: "text-primary",
  warning: "text-accent-dark",
  danger: "text-terracotta-500",
  success: "text-forest-500",
};

const iconBgStyles = {
  default: "bg-forest-100",
  warning: "bg-accent/20",
  danger: "bg-terracotta-500/15",
  success: "bg-forest-100",
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={clsx("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className={clsx("mt-2 text-3xl font-semibold", variantStyles[variant])}>
            {value}
          </p>
          {trend && (
            <p
              className={clsx(
                "mt-1 text-sm font-medium",
                trend.isPositive ? "text-forest-500" : "text-terracotta-500"
              )}
            >
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%{" "}
              <span className="text-text-muted">vs last week</span>
            </p>
          )}
        </div>
        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconBgStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
