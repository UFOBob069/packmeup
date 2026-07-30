import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "July 30, 2026";

const SECTIONS = [
  {
    title: "1. The service",
    body: "PackForVacation.com provides AI-assisted packing lists, trip checklists, and shared trip-prep tools. Features may change as we improve the product.",
  },
  {
    title: "2. Accounts",
    body: "You must sign in with a Google account you control. You are responsible for activity under your account and for keeping access to that Google account secure.",
  },
  {
    title: "3. Your content",
    body: "You keep ownership of the trip details, packing lists, notes, and messages you create. You give us permission to host and process that content so we can provide the service, including AI suggestions and collaboration features you use.",
  },
  {
    title: "4. Acceptable use",
    body: "Do not misuse the service, attempt to break into or disrupt it, harass others, upload unlawful content, or use AI features to generate harmful material.",
  },
  {
    title: "5. AI suggestions",
    body: "Packing suggestions are generated automatically and may be incomplete or incorrect. You are responsible for what you pack and for travel safety decisions. The service is not medical, legal, or travel-booking advice.",
  },
  {
    title: "6. Sharing",
    body: "When you invite someone to a trip, they can see shared trip content according to the product’s privacy controls. Only share invite links with people you trust.",
  },
  {
    title: "7. Termination",
    body: "You may delete your account anytime from Account in the app or at packforvacation.com/account/delete. We may suspend accounts that violate these terms.",
  },
  {
    title: "8. Contact",
    body: "Questions? Email partners@packforvacation.com.",
  },
];

interface TermsScreenProps {
  backTo?: string;
  backLabel?: string;
}

export function TermsScreen({ backTo = "/", backLabel = "Back" }: TermsScreenProps) {
  return (
    <main className="screen privacy-screen">
      <Link to={backTo} className="back-link">
        <ArrowLeft size={18} /> {backLabel}
      </Link>
      <p className="eyebrow">Legal</p>
      <h1>Terms of Service</h1>
      <p className="privacy-intro">Effective date: {EFFECTIVE_DATE}.</p>
      <div className="privacy-sections">
        {SECTIONS.map((section) => (
          <section key={section.title} className="privacy-section">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
