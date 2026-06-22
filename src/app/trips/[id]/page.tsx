import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/shells";
import { TripDetailClient } from "@/components/trip/trip-detail-client";
import { getChatHistory } from "@/actions/packing";
import { getTripDetails, ensureTripWeather } from "@/actions/trips";

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const trip = await getTripDetails(id);
  if (!trip) notFound();

  const now = new Date().toISOString().split("T")[0];
  if (trip.end_date >= now && !trip.weather_data?.daily?.length) {
    const weather = await ensureTripWeather(trip);
    if (weather) trip.weather_data = weather;
  }

  const chatMessages = await getChatHistory(id);

  return (
    <AppShell>
      <TripDetailClient trip={trip} chatMessages={chatMessages} />
    </AppShell>
  );
}
