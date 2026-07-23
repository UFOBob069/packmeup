import { format, parseISO } from "date-fns";
import { APP_NAME } from "@/lib/constants";

export interface InviteShareDetails {
  inviterName: string;
  destination: string;
  startDate: string;
  endDate: string;
  shareLink: string;
}

/** Short city/place label from a full destination string. */
export function destinationCity(destination: string): string {
  return destination.split(",")[0]?.trim() || destination;
}

export function inviteShareTitle(details: Pick<InviteShareDetails, "inviterName" | "destination">) {
  const city = destinationCity(details.destination);
  return `${details.inviterName} invited you to pack for ${city}`;
}

export function inviteShareDescription(
  details: Pick<InviteShareDetails, "inviterName" | "destination" | "startDate" | "endDate">
) {
  const city = destinationCity(details.destination);
  const dates = formatInviteDateRange(details.startDate, details.endDate);
  return `${details.inviterName} invited you to pack for your trip to ${city} (${dates}). Anyone with the link can join the shared packing list on ${APP_NAME}.`;
}

export function inviteShareMessage(details: InviteShareDetails): string {
  const city = destinationCity(details.destination);
  const dates = formatInviteDateRange(details.startDate, details.endDate);
  return [
    `${details.inviterName} invited you to pack for ${city}`,
    dates,
    "",
    "Anyone with this link can join — send it in a group text if you want:",
    details.shareLink,
  ].join("\n");
}

export function formatInviteDateRange(startDate: string, endDate: string): string {
  try {
    return `${format(parseISO(startDate), "MMM d")} – ${format(parseISO(endDate), "MMM d, yyyy")}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}
