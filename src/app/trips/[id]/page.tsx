import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/header";
import { TripDetailClient } from "@/components/trip/trip-detail-client";
import { getChatHistory } from "@/actions/packing";
import { getTripDetails } from "@/actions/trips";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const trip = await getTripDetails(id);
  if (!trip) notFound();

  const chatMessages = await getChatHistory(id);

  return (
    <AppShell>
      <TripDetailClient trip={trip} chatMessages={chatMessages} />
    </AppShell>
  );
}
