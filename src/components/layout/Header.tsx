"use client";

import { useLocale } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface-elevated/80 px-8 backdrop-blur-sm">
      <div>
        <h1 className="font-playfair text-xl font-semibold text-text-heading">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-text-muted">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
