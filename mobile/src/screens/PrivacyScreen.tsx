import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_SECTIONS,
} from "../lib/privacy-policy";

interface PrivacyScreenProps {
  backTo?: string;
  backLabel?: string;
}

export function PrivacyScreen({
  backTo = "/",
  backLabel = "Back",
}: PrivacyScreenProps) {
  return (
    <main className="screen privacy-screen">
      <Link to={backTo} className="back-link">
        <ArrowLeft size={18} /> {backLabel}
      </Link>

      <p className="eyebrow">Legal</p>
      <h1>Privacy Policy</h1>
      <p className="privacy-intro">
        Effective date: {PRIVACY_EFFECTIVE_DATE}. This policy explains how PackForVacation.com
        handles information when you use our website and mobile apps.
      </p>

      <div className="privacy-sections">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.title} className="privacy-section">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <a className="privacy-contact" href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
        Email {PRIVACY_CONTACT_EMAIL}
      </a>
    </main>
  );
}
