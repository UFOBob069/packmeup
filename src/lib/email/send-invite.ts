import { APP_NAME } from "@/lib/constants";

interface InviteEmailParams {
  to: string;
  destination: string;
  inviterName: string;
  role: "editor" | "viewer";
  shareLink: string;
  startDate: string;
  endDate: string;
}

export async function sendTripInviteEmail(
  params: InviteEmailParams
): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured" };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "PackForVacation <onboarding@resend.dev>";
  const roleLabel = params.role === "viewer" ? "view" : "edit";
  const subject = `${params.inviterName} invited you to pack for ${params.destination}`;
  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #16312f;">
      <h1 style="font-size: 24px; line-height: 1.2;">You're invited to ${params.destination}</h1>
      <p style="font-family: system-ui, sans-serif; color: #4a605b; line-height: 1.6;">
        ${params.inviterName} shared a ${APP_NAME} trip with you so you can ${roleLabel} the
        packing list, weather, and trip prep together.
      </p>
      <p style="font-family: system-ui, sans-serif; color: #4a605b;">
        ${params.startDate} – ${params.endDate}
      </p>
      <p style="margin: 28px 0;">
        <a href="${params.shareLink}"
           style="display:inline-block;background:#145c58;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:system-ui,sans-serif;font-weight:700;">
          Open trip
        </a>
      </p>
      <p style="font-family: system-ui, sans-serif; font-size: 12px; color: #83918d;">
        Or paste this link: ${params.shareLink}
      </p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend invite failed:", body);
    return { sent: false, reason: "Email provider rejected the invite" };
  }

  return { sent: true };
}
