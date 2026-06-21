"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Luggage, LayoutDashboard, Plus, FileStack } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Trips", icon: LayoutDashboard },
  { href: "/trips/new", label: "New Trip", icon: Plus },
  { href: "/templates", label: "Templates", icon: FileStack },
];

export function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Luggage className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        {!isLanding && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                  pathname.startsWith(href) && "bg-muted font-medium"
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
            <Button asChild size="sm">
              <Link href="/login">Get Started</Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="md:hidden">
              <Link href="/trips/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
