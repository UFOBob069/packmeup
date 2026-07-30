"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";
import { signInWithGoogle } from "@/actions/trips";
import { APP_NAME } from "@/lib/constants";
import { isDemoMode } from "@/lib/supabase/client";

interface InviteContext {
  inviterName: string;
  destination: string;
  city: string;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
}

interface LoginClientProps {
  nextPath?: string;
  invite?: InviteContext | null;
}

export function LoginClient({ nextPath = "/dashboard", invite = null }: LoginClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const demoMode = isDemoMode();

  const handleGoogle = () => {
    startTransition(async () => {
      const result = await signInWithGoogle(nextPath);
      if (result.url) {
        if (result.url.startsWith("http")) {
          window.location.href = result.url;
        } else {
          router.push(result.url);
        }
      }
    });
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between gradient-hero p-12">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark size={44} priority />
          <span className="text-display text-xl font-semibold">{APP_NAME}</span>
        </Link>
        {invite ? (
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Trip invite
            </p>
            <h2 className="text-display text-4xl font-semibold leading-tight tracking-tight">
              {invite.inviterName} invited you to pack for {invite.city}.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Sign in once and you’ll open their shared packing list automatically — no hunting
              required.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-display text-4xl font-semibold leading-tight tracking-tight">
              Less stress.
              <br />
              Pack with confidence.
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Know exactly what to pack — AI lists, outfits, and shared checklists for every traveler.
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}
          {" · "}
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/terms" className="underline-offset-4 hover:underline">
            Terms
          </Link>
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <BrandMark size={36} priority />
              <span className="text-display font-semibold">{APP_NAME}</span>
            </Link>
          </div>

          {invite && (
            <div className="mb-6 overflow-hidden rounded-2xl border shadow-travel-sm">
              {invite.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invite.coverImageUrl}
                  alt={invite.city}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-end bg-gradient-to-br from-primary/80 to-ocean-teal/70 p-4">
                  <p className="text-display text-xl font-semibold text-white">{invite.city}</p>
                </div>
              )}
              <div className="space-y-1 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  You’re joining
                </p>
                <p className="text-display font-semibold">{invite.destination}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(invite.startDate), "MMM d")} –{" "}
                  {format(parseISO(invite.endDate), "MMM d, yyyy")} · invited by {invite.inviterName}
                </p>
              </div>
            </div>
          )}

          <h1 className="text-display text-2xl font-semibold tracking-tight">
            {invite ? "Join this trip" : "Welcome back"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {demoMode
              ? "Explore the full experience — no setup required."
              : invite
                ? "Create your account or sign in with Google. We’ll take you straight to the shared trip."
                : "Sign in with Google to access your packing lists."}
          </p>

          <div className="mt-8 space-y-4">
            {demoMode ? (
              <Button
                className="h-12 w-full rounded-full text-base"
                size="lg"
                onClick={() => router.push(nextPath)}
              >
                Continue to demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="h-12 w-full rounded-full text-base"
                size="lg"
                onClick={handleGoogle}
                disabled={isPending}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {invite ? "Continue with Google to join" : "Continue with Google"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
