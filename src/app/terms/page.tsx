import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/shells";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${APP_NAME}.`,
};

const EFFECTIVE_DATE = "July 30, 2026";
const CONTACT_EMAIL = "partners@packforvacation.com";

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="text-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}. These terms govern your use of {APP_NAME} on the web and
          in our mobile apps.
        </p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">1. The service</h2>
            <p>
              {APP_NAME} provides AI-assisted packing lists, trip checklists, and shared trip-prep
              tools. Features may change as we improve the product.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">2. Accounts</h2>
            <p>
              You must sign in with a Google account you control. You are responsible for activity
              under your account and for keeping access to that Google account secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">3. Your content</h2>
            <p>
              You keep ownership of the trip details, packing lists, notes, and messages you create.
              You give us permission to host and process that content so we can provide the service,
              including AI suggestions and collaboration features you use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">4. Acceptable use</h2>
            <p>Do not misuse the service. For example, do not:</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Attempt to break into, scrape, or disrupt the service</li>
              <li>Harass others through trip chat or invites</li>
              <li>Upload unlawful content or content you do not have rights to share</li>
              <li>Use the AI features to generate harmful or abusive material</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">5. AI suggestions</h2>
            <p>
              Packing suggestions are generated automatically and may be incomplete or incorrect.
              You are responsible for what you pack, travel documents, and safety decisions. The
              service is not medical, legal, or travel-booking advice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">6. Sharing</h2>
            <p>
              When you invite someone to a trip, they can see shared trip content according to the
              product’s privacy controls. Only share invite links with people you trust.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">7. Availability</h2>
            <p>
              We aim for reliable uptime but do not guarantee uninterrupted access. Features may be
              limited during maintenance or outages of third-party providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              8. Disclaimers and liability
            </h2>
            <p>
              The service is provided “as is” without warranties of any kind to the fullest extent
              permitted by law. To the fullest extent permitted by law, {APP_NAME} is not liable for
              indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">9. Termination</h2>
            <p>
              You may delete your account at any time from{" "}
              <Link
                href="/account/delete"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                the account deletion page
              </Link>{" "}
              or in the mobile app. We may suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">10. Changes</h2>
            <p>
              We may update these terms. The effective date above will change when we do. Continued
              use after updates means you accept the revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">11. Contact</h2>
            <p>
              Questions? Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </article>

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
