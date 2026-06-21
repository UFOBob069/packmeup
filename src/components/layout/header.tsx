"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Luggage, LayoutGrid, Plus, Layers, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Packing Lists", icon: LayoutGrid },
  { href: "/trips/new", label: "Start Packing", icon: Plus, highlight: true },
  { href: "/templates", label: "Templates", icon: Layers },
];

export function Header({ variant = "app" }: { variant?: "landing" | "app" }) {
  const pathname = usePathname();
  const isLanding = variant === "landing" || pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-travel-sm transition-transform group-hover:scale-105">
              <Luggage className="h-4.5 w-4.5" />
            </div>
            <span className="text-display hidden text-lg font-semibold tracking-tight sm:inline">
              {APP_NAME}
            </span>
          </Link>

          {!isLanding && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ href, label, icon: Icon, highlight }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                    highlight
                      ? "bg-primary text-primary-foreground shadow-travel-sm hover:bg-primary/90"
                      : pathname.startsWith(href)
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLanding ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex rounded-full">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link href="/login">Get started</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" size="icon" className="rounded-full md:hidden">
                <Link href="/login">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      {!isLanding && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {navItems.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-[10px] font-medium transition-colors",
                  highlight
                    ? "text-primary"
                    : pathname.startsWith(href)
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    highlight && "bg-primary text-primary-foreground shadow-travel-sm"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="app" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8">
        {children}
      </main>
    </div>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="landing" />
      {children}
    </div>
  );
}
