"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackingChecklist } from "./packing-checklist";
import { OutfitPlanner } from "./outfit-planner";
import { CalendarView } from "./calendar-view";
import { ProgressStats } from "./progress-stats";
import { AiChat } from "./ai-chat";
import { InviteDialog } from "./invite-dialog";
import { RealtimePacking } from "./realtime-packing";
import type { ChatMessage, TripWithDetails } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";

interface TripDetailClientProps {
  trip: TripWithDetails;
  chatMessages: ChatMessage[];
}

export function TripDetailClient({ trip, chatMessages }: TripDetailClientProps) {
  const router = useRouter();
  const progress = calculateProgress(trip.packing_items, trip.travelers);
  const activities = [
    ...new Set(trip.packing_items.map((i) => i.activity_name).filter(Boolean)),
  ] as string[];

  return (
    <div className="space-y-6">
      <RealtimePacking tripId={trip.id} onUpdate={() => router.refresh()} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{trip.destination}</h1>
          <p className="text-muted-foreground">
            {trip.start_date} → {trip.end_date}
          </p>
        </div>
        <InviteDialog tripId={trip.id} />
      </div>

      <ProgressStats progress={progress} />

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="outfits">Outfits</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <Tabs defaultValue="all">
            <TabsList className="mb-4 flex h-auto flex-wrap">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              {trip.travelers.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.name}
                </TabsTrigger>
              ))}
              {activities.map((a) => (
                <TabsTrigger key={a} value={`act-${a}`}>
                  {a}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              <PackingChecklist
                items={trip.packing_items}
                travelers={trip.travelers}
                tripId={trip.id}
              />
            </TabsContent>
            <TabsContent value="shared">
              <PackingChecklist
                items={trip.packing_items}
                travelers={trip.travelers}
                tripId={trip.id}
                filterTraveler="shared"
              />
            </TabsContent>
            {trip.travelers.map((t) => (
              <TabsContent key={t.id} value={t.id}>
                <PackingChecklist
                  items={trip.packing_items}
                  travelers={trip.travelers}
                  tripId={trip.id}
                  filterTraveler={t.id}
                />
              </TabsContent>
            ))}
            {activities.map((a) => (
              <TabsContent key={a} value={`act-${a}`}>
                <PackingChecklist
                  items={trip.packing_items}
                  travelers={trip.travelers}
                  tripId={trip.id}
                  filterActivity={a}
                />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        <TabsContent value="outfits">
          <OutfitPlanner outfits={trip.outfits} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView days={trip.calendar_days} outfits={trip.outfits} />
        </TabsContent>

        <TabsContent value="chat">
          <div className="h-[500px]">
            <AiChat tripId={trip.id} initialMessages={chatMessages} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
