import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
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
    <>
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <TripDetailClient trip={trip} chatMessages={chatMessages} />
      </main>
    </>
  );
}
