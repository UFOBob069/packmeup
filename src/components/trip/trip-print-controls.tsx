"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripPrintControlsProps {
  tripId: string;
  destination: string;
}

export function TripPrintControls({ tripId, destination }: TripPrintControlsProps) {
  return (
    <div className="no-print sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="cursor-pointer">
          <Link href={`/trips/${tripId}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to trip
          </Link>
        </Button>
        <p className="hidden truncate text-sm font-medium sm:block">{destination}</p>
        <Button
          type="button"
          size="sm"
          onClick={() => window.print()}
          className="cursor-pointer"
        >
          <Printer className="mr-1.5 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>
    </div>
  );
}
