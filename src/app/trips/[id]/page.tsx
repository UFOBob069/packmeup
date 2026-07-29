import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shells";
import { TripDetailClient } from "@/components/trip/trip-detail-client";
import { getChatHistory, getGroupChatHistory } from "@/actions/packing";
import { getUserGearItems } from "@/actions/gear";
import { getCurrentUser, getTripDetails, ensureTripWeather } from "@/actions/trips";
import type { MemberRole } from "@/lib/types";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

function resolveMemberRole(
  trip: Awaited<ReturnType<typeof getTripDetails>>,
  userId: string | undefined
): MemberRole {
  if (!trip || !userId) return "viewer";
  if (trip.owner_id === userId) return "owner";
  const membership = trip.members.find((member) => member.user_id === userId);
  return membership?.role ?? "viewer";
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const [trip, user] = await Promise.all([getTripDetails(id), getCurrentUser()]);
  if (!trip) notFound();
  if (!user) notFound();

  const now = new Date().toISOString().split("T")[0];
  if (trip.end_date >= now) {
    const weather = await ensureTripWeather(trip);
    if (weather) trip.weather_data = weather;
  }

  const [chatMessages, groupChatMessages, gearItems] = await Promise.all([
    getChatHistory(id),
    getGroupChatHistory(id),
    getUserGearItems(),
  ]);
  const role = resolveMemberRole(trip, user.id);
  const canEdit = role === "owner" || role === "editor";
  const canManage = role === "owner";

  return (
    <AppShell>
      <TripDetailClient
        trip={trip}
        chatMessages={chatMessages}
        groupChatMessages={groupChatMessages}
        currentUserId={user.id}
        gearItems={gearItems}
        canEdit={canEdit}
        canManage={canManage}
        memberRole={role}
      />
    </AppShell>
  );
}
