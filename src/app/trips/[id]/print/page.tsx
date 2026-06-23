import { notFound } from "next/navigation";
import { getTripDetails } from "@/actions/trips";
import { TripPrintView } from "@/components/trip/trip-print-view";
import { TripPrintControls } from "@/components/trip/trip-print-controls";

interface TripPrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function TripPrintPage({ params }: TripPrintPageProps) {
  const { id } = await params;
  const trip = await getTripDetails(id);
  if (!trip) notFound();

  return (
    <>
      <TripPrintControls tripId={trip.id} destination={trip.destination} />
      <TripPrintView trip={trip} />
    </>
  );
}
