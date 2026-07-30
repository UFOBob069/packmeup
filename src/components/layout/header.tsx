"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LayoutGrid,
  Plus,
  Layers,
  Backpack,
  Users,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TravelerAvatar } from "@/components/design/traveler-avatar";
import { signOut } from "@/actions/trips";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Packing Lists", icon: LayoutGrid, iconClass: "text-ocean-teal" },
  { href: "/gear", label: "My Gear", icon: Backpack, iconClass: "text-weather-orange" },
  { href: "/group", label: "My Group", icon: Users, iconClass: "text-golf-green" },
  { href: "/trips/new", label: "Start Packing", icon: Plus, highlight: true },
  { href: "/templates", label: "Templates", icon: Layers, iconClass: "text-violet-500 dark:text-violet-400" },
];

interface HeaderProps {
  variant?: "landing" | "app";
  user?: Profile | null;
}

export function Header({ variant = "app", user = null }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, startSignOut] = useTransition();
  const isLanding = variant === "landing" || pathname === "/";
  const firstName = user?.name?.split(" ")[0];
  const isLoggedIn = !!user;

  const handleSignOut = () => {
    startSignOut(async () => {
      await signOut();
      router.refresh();
    });
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href={isLoggedIn ? "/dashboard" : "/"} className="group flex items-center gap-2.5">
            <BrandMark
              size={36}
              priority
              className="transition-transform group-hover:scale-105"
            />
            <span className="text-display hidden text-lg font-semibold tracking-tight sm:inline">
              {APP_NAME}
            </span>
          </Link>

          {isLanding && (
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/#features", label: "Features" },
                { href: "/#for-travel-brands", label: "For Travel Brands" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {!isLanding && (
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map(({ href, label, icon: Icon, highlight, iconClass }) => (
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
                  <Icon className={cn("h-4 w-4", !highlight && iconClass)} />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-2 pl-1.5 pr-3"
                      aria-label="Account menu"
                    >
                      <TravelerAvatar name={user.name ?? "You"} type="adult" index={0} size="sm" />
                      <span className="hidden sm:inline">{firstName ?? "Account"}</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4" />
                    Packing Lists
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                    <LogOut className="h-4 w-4" />
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isLanding ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link href="/login">Get started</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {!isLanding && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {navItems.map(({ href, label, icon: Icon, highlight, iconClass }) => (
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
                  <Icon className={cn("h-4 w-4", !highlight && iconClass)} />
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
