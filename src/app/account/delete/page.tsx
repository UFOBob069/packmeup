import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/shells";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/trips";
import { APP_NAME } from "@/lib/constants";
import { isDemoMode } from "@/lib/supabase/client";

export const metadata: Metadata = {
  title: "Delete account",
  description: `Delete your ${APP_NAME} account and associated trip data.`,
};

const CONTACT_EMAIL = "partners@packforvacation.com";

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();

  return (
    <MarketingShell>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Account</p>
        <h1 className="text-display mt-3 text-4xl font-semibold tracking-tight">Delete account</h1>
        <p className="mt-4 text-muted-foreground">
          You can permanently delete your {APP_NAME} account and the trips you own. This page is
          available on the web so you can request deletion without installing the mobile app.
        </p>

        <div className="mt-8 space-y-6">
          {user && !isDemoMode() ? (
            <DeleteAccountForm email={user.email} />
          ) : (
            <div className="rounded-2xl border bg-card p-5 shadow-travel-sm">
              <h2 className="text-display text-lg font-semibold">Sign in to delete</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in with the Google account you used for {APP_NAME}, then return here to confirm
                deletion. Or email{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Delete%20PackForVacation%20account`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>{" "}
                from that address and we will help.
              </p>
              <Button asChild className="mt-4 rounded-full">
                <Link href="/login?next=/account/delete">Sign in to continue</Link>
              </Button>
            </div>
          )}

          <div className="rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What gets deleted</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your profile and login</li>
              <li>Trips you own and their packing lists</li>
              <li>Your membership on trips others shared with you</li>
              <li>My Gear and My Group entries tied to your account</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:gap-6 sm:px-6">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </div>
      </footer>
    </MarketingShell>
  );
}
