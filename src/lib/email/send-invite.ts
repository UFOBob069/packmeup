import { APP_NAME } from "@/lib/constants";
import {
  destinationCity,
  formatInviteDateRange,
  inviteShareTitle,
} from "@/lib/invite-share";

interface InviteEmailParams {
  to: string;
  destination: string;
  inviterName: string;
  role: "editor" | "viewer";
  shareLink: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string | null;
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
  const city = destinationCity(params.destination);
  const dates = formatInviteDateRange(params.startDate, params.endDate);
  const roleLabel = params.role === "viewer" ? "view" : "edit";
  const subject = inviteShareTitle({
    inviterName: params.inviterName,
    destination: params.destination,
  });
  const cover = params.coverImageUrl
    ? `<img src="${params.coverImageUrl}" alt="${city}" width="520" style="display:block;width:100%;max-width:520px;height:220px;object-fit:cover;border-radius:16px 16px 0 0;" />`
    : "";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #16312f;">
      ${cover}
      <div style="padding: 24px; border: 1px solid #e5ebe8; border-top: none; border-radius: ${params.coverImageUrl ? "0 0 16px 16px" : "16px"};">
        <p style="font-family: system-ui, sans-serif; margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #83918d;">
          Shared packing invite
        </p>
        <h1 style="font-size: 26px; line-height: 1.2; margin: 0 0 12px;">
          ${params.inviterName} invited you to pack for ${city}
        </h1>
        <p style="font-family: system-ui, sans-serif; color: #4a605b; line-height: 1.6; margin: 0 0 8px;">
          Join the shared ${APP_NAME} trip so you can ${roleLabel} the packing list, weather,
          outfits, and trip prep together.
        </p>
        <p style="font-family: system-ui, sans-serif; color: #4a605b; margin: 0;">
          ${dates}
        </p>
        <p style="margin: 28px 0;">
          <a href="${params.shareLink}"
             style="display:inline-block;background:#145c58;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-family:system-ui,sans-serif;font-weight:700;">
            Join this trip
          </a>
        </p>
        <p style="font-family: system-ui, sans-serif; font-size: 12px; color: #83918d; margin: 0;">
          New here? Create your account with Google and you’ll land right on this trip.
        </p>
      </div>
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
