import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Shield, Trash2 } from "lucide-react";
import { MarketingShell } from "@/components/layout/shells";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Support",
  description: `Get help with ${APP_NAME}.`,
};

const CONTACT_EMAIL = "partners@packforvacation.com";

export default function SupportPage() {
  return (
    <MarketingShell>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Help</p>
        <h1 className="text-display mt-3 text-4xl font-semibold tracking-tight">Support</h1>
        <p className="mt-4 text-muted-foreground">
          Need help with packing lists, sharing a trip, or your account? We’re here.
        </p>

        <div className="mt-10 grid gap-4">
          <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-display text-lg font-semibold">Email us</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The fastest way to reach a human for account or product questions.
                </p>
                <Button asChild className="mt-4 rounded-full">
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-display text-lg font-semibold">Delete your account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permanently remove your account and owned trips from the web (no app install
                  required).
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full">
                  <Link href="/account/delete">Account deletion</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-display text-lg font-semibold">Policies</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  How we handle data and the rules for using {APP_NAME}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                  <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </footer>
    </MarketingShell>
  );
}
