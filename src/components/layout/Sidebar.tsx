"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Flag,
  ChatCircleText,
  SignOut,
  User,
} from "@phosphor-icons/react";
import { clsx } from "clsx";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  pendingReports?: number;
  pendingFeedback?: number;
}

export function Sidebar({ pendingReports = 0, pendingFeedback = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: <House size={20} weight="duotone" />,
    },
    {
      href: "/reports",
      label: "Reports",
      icon: <Flag size={20} weight="duotone" />,
      badge: pendingReports,
    },
    {
      href: "/feedback",
      label: "Feedback",
      icon: <ChatCircleText size={20} weight="duotone" />,
      badge: pendingFeedback,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-surface-elevated">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <span className="font-playfair text-xl font-semibold text-text-heading">
            Cuisto Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-200",
              isActive(item.href)
                ? "bg-primary text-white shadow-soft"
                : "text-text-body hover:bg-surface hover:text-text-heading"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={clsx(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  isActive(item.href)
                    ? "bg-white/20 text-white"
                    : "bg-terracotta-500 text-white"
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom section - User info & Sign out */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-heading truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-text-muted transition-colors hover:bg-surface hover:text-terracotta-500"
        >
          <SignOut size={20} weight="duotone" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
