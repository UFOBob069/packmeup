import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/layout/shells";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, uses, and protects your information.`,
};

const EFFECTIVE_DATE = "July 29, 2026";
const CONTACT_EMAIL = "partners@packforvacation.com";

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="text-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}. This policy explains how {APP_NAME} (“we”, “us”, or
          “our”) handles information when you use our website and mobile apps.
        </p>

        <div className="prose-privacy mt-10 space-y-10 text-[15px] leading-relaxed text-foreground/90">
          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">1. Who we are</h2>
            <p>
              {APP_NAME} helps travelers build AI-assisted packing lists, trip checklists, and
              shared trip prep workspaces. Our service is available at{" "}
              <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                packforvacation.com
              </Link>{" "}
              and through our iOS/Android apps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              2. Information we collect
            </h2>
            <p>Depending on how you use the product, we may collect:</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Account information</span> — such as
                name, email address, and profile photo provided through Google sign-in.
              </li>
              <li>
                <span className="font-medium text-foreground">Trip content you create</span> —
                destinations, dates, travelers (including pet details you enter), packing items,
                outfits, day plans, activities, groceries, reminders, notes, and chat messages.
              </li>
              <li>
                <span className="font-medium text-foreground">Collaboration data</span> — invite
                links, trip membership, and content shared with people you invite to a trip.
              </li>
              <li>
                <span className="font-medium text-foreground">Usage and device data</span> —
                approximate logs needed to operate the service (for example authentication tokens,
                basic request metadata, and crash/performance signals from hosting providers).
              </li>
            </ul>
            <p>
              We do not ask for payment card numbers in the current product. Do not put highly
              sensitive personal data (for example government ID numbers or medical records) into
              trip notes unless you understand it may be stored with your trip and visible to
              people you share the trip with.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              3. How we use information
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Provide, maintain, and improve packing lists and trip workspaces</li>
              <li>Generate and refine AI packing suggestions based on your trip details</li>
              <li>Enable realtime collaboration with people you invite</li>
              <li>Show relevant weather, destination imagery, and location typeahead</li>
              <li>Authenticate your account and keep the service secure</li>
              <li>Respond to support requests and important service notices</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              4. AI processing
            </h2>
            <p>
              When you create or refine a packing list, trip details and related prompts may be
              sent to our AI provider (currently OpenAI) to generate suggestions. We use that
              processing to operate the feature you requested. Do not include information in prompts
              or notes that you are not comfortable sharing with our service providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              5. Sharing and third parties
            </h2>
            <p>We share information only as needed to run the product:</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Trip members you invite</span> — can
                see shared trip content (and not your personal packing items that remain private to
                you, where the product supports that).
              </li>
              <li>
                <span className="font-medium text-foreground">Service providers</span> — such as
                Supabase (authentication and database), Vercel (hosting), OpenAI (AI features),
                Google (sign-in), Mapbox (destination search), Unsplash (destination cover images),
                and weather data providers.
              </li>
              <li>
                <span className="font-medium text-foreground">Legal requirements</span> — if we are
                required to disclose information to comply with law, enforce our terms, or protect
                users.
              </li>
            </ul>
            <p>We do not sell your personal information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              6. Cookies and similar technologies
            </h2>
            <p>
              We use cookies and local storage that are necessary for sign-in sessions and basic
              product functionality (for example keeping you logged in and remembering preferences
              like theme). We do not use advertising trackers in the current product.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">7. Data retention</h2>
            <p>
              We keep account and trip data while your account is active so you can reuse packing
              lists and shared trips. If you delete a trip or ask us to delete your account, we will
              remove or anonymize associated personal data within a reasonable period, except where
              we must retain limited records for security, abuse prevention, or legal obligations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">8. Your choices</h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Update profile details through your signed-in account where available</li>
              <li>Remove packing items, notes, or delete trips you own</li>
              <li>Leave shared trips or ask an owner to remove your access</li>
              <li>
                Permanently delete your account in the mobile app under Account, or on the web at{" "}
                <Link
                  href="/account/delete"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  /account/delete
                </Link>
              </li>
              <li>
                Or email{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">9. Children’s privacy</h2>
            <p>
              The service is intended for adults planning travel. Children may appear as travelers
              on a packing list when an adult adds them. We do not knowingly collect personal
              information directly from children under 13 for account creation. If you believe a
              child created an account, contact us and we will take appropriate steps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">10. Security</h2>
            <p>
              We use industry-standard safeguards provided by our hosting and database providers,
              including encrypted connections (HTTPS) and access controls. No method of transmission
              or storage is 100% secure, so please use a strong Google account and share invite links
              only with people you trust.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              11. International users
            </h2>
            <p>
              Our infrastructure may process data in the United States and other countries where our
              providers operate. If you use the service from another country, you understand your
              information may be transferred to and processed in those locations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">
              12. Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will change the effective date
              above and, when changes are material, provide additional notice in the product or by
              email when appropriate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-display text-2xl font-semibold tracking-tight">13. Contact us</h2>
            <p>
              Questions about privacy? Email{" "}
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
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </div>
      </footer>
    </MarketingShell>
  );
}
