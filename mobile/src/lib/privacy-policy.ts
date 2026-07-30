export const PRIVACY_EFFECTIVE_DATE = "July 29, 2026";
export const PRIVACY_CONTACT_EMAIL = "partners@packforvacation.com";

export const PRIVACY_SECTIONS: { title: string; body: string; bullets?: string[] }[] = [
  {
    title: "1. Who we are",
    body: "PackForVacation.com helps travelers build AI-assisted packing lists, trip checklists, and shared trip prep workspaces on the web and in our iOS/Android apps.",
  },
  {
    title: "2. Information we collect",
    body: "Depending on how you use the product, we may collect:",
    bullets: [
      "Account information — name, email, and profile photo from Google sign-in",
      "Trip content you create — destinations, dates, travelers, packing items, outfits, day plans, activities, groceries, reminders, notes, and chat messages",
      "Collaboration data — invite links, trip membership, and content shared with people you invite",
      "Usage and device data needed to operate the service (authentication tokens, basic request metadata, and crash/performance signals from hosting providers)",
    ],
  },
  {
    title: "3. How we use information",
    body: "We use your information to:",
    bullets: [
      "Provide, maintain, and improve packing lists and trip workspaces",
      "Generate and refine AI packing suggestions based on your trip details",
      "Enable realtime collaboration with people you invite",
      "Show relevant weather, destination imagery, and location typeahead",
      "Authenticate your account and keep the service secure",
      "Respond to support requests and important service notices",
    ],
  },
  {
    title: "4. AI processing",
    body: "When you create or refine a packing list, trip details and related prompts may be sent to our AI provider (currently OpenAI) to generate suggestions. Do not include information in prompts or notes that you are not comfortable sharing with our service providers.",
  },
  {
    title: "5. Sharing and third parties",
    body: "We share information only as needed to run the product. We do not sell your personal information.",
    bullets: [
      "Trip members you invite can see shared trip content (personal packing items stay private where the product supports that)",
      "Service providers such as Supabase, Vercel, OpenAI, Google, Mapbox, Unsplash, and weather data providers",
      "Legal disclosures when required to comply with law, enforce our terms, or protect users",
    ],
  },
  {
    title: "6. Cookies and similar technologies",
    body: "We use cookies and local storage that are necessary for sign-in sessions and basic product functionality. We do not use advertising trackers in the current product.",
  },
  {
    title: "7. Data retention",
    body: "We keep account and trip data while your account is active. If you delete a trip or ask us to delete your account, we will remove or anonymize associated personal data within a reasonable period, except where limited records must be retained for security or legal obligations.",
  },
  {
    title: "8. Your choices",
    body: "You can update profile details where available, remove packing items or delete trips you own, leave shared trips, or permanently delete your account in the app (Account) or at packforvacation.com/account/delete. You can also email partners@packforvacation.com.",
  },
  {
    title: "9. Children’s privacy",
    body: "The service is intended for adults planning travel. Children may appear as travelers when an adult adds them. We do not knowingly collect personal information directly from children under 13 for account creation.",
  },
  {
    title: "10. Security",
    body: "We use industry-standard safeguards including HTTPS and access controls. No method of transmission or storage is 100% secure — use a strong Google account and share invite links only with people you trust.",
  },
  {
    title: "11. International users",
    body: "Our infrastructure may process data in the United States and other countries where our providers operate.",
  },
  {
    title: "12. Changes to this policy",
    body: "We may update this Privacy Policy from time to time. We will change the effective date and, when changes are material, provide additional notice in the product when appropriate.",
  },
  {
    title: "13. Contact us",
    body: "Questions about privacy? Email partners@packforvacation.com.",
  },
];
