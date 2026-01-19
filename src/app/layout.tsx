import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { LocaleProvider } from "@/i18n/context";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cuisto Admin",
  description: "Cuisto Administration Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-surface text-text-body`}
      >
        <AuthProvider>
          <LocaleProvider>
            <AuthGuard>{children}</AuthGuard>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
