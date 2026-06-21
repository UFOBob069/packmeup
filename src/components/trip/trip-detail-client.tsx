"use client";

import { useRouter } from "next/navigation";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  Luggage,
  ListChecks,
  Shirt,
  CalendarDays,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackingChecklist } from "./packing-checklist";
import { SharedItemsSection } from "./shared-items-section";
import { PetTravelCard } from "./pet-travel-card";
import { OutfitPlanner } from "./outfit-planner";
import { CalendarView } from "./calendar-view";
import { ProgressStats } from "./progress-stats";
import { AiChat } from "./ai-chat";
import { InviteDialog } from "./invite-dialog";
import { RealtimePacking } from "./realtime-packing";
import { CollaborationFeed } from "./collaboration-feed";
import { PackingTimeline } from "./packing-timeline";
import { CountdownWidget } from "@/components/design/countdown-widget";
import { WeatherPreview } from "@/components/design/weather-card";
import { AiSuggestionList } from "@/components/design/ai-suggestion-card";
import { ActivityTag } from "@/components/design/activity-tag";
import { TravelerAvatarGroup } from "@/components/design/traveler-avatar";
import type { ChatMessage, TripWithDetails, WeatherData } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";
import { generateAiRecommendations, generatePackingTimeline } from "@/lib/design-system";

interface TripDetailClientProps {
  trip: TripWithDetails;
  chatMessages: ChatMessage[];
}

const tabItems = [
  { value: "pack", label: "Pack", icon: ListChecks },
  { value: "outfits", label: "Outfits", icon: Shirt },
  { value: "timeline", label: "Timeline", icon: CalendarDays },
  { value: "concierge", label: "Concierge", icon: MessageCircle },
];

export function TripDetailClient({ trip, chatMessages }: TripDetailClientProps) {
  const router = useRouter();
  const progress = calculateProgress(trip.packing_items, trip.travelers);
  const weather = trip.weather_data as WeatherData | null;
  const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
  const activities = [...new Set(trip.activities.map((a) => a.activity_name))];
  const pets = trip.travelers.filter((t) => t.traveler_type === "pet");
  const aiRecs = generateAiRecommendations(trip.packing_items, trip.travelers, weather);
  const timeline = generatePackingTimeline(daysUntil);

  return (
    <div className="space-y-6">
      <RealtimePacking tripId={trip.id} onUpdate={() => router.refresh()} />

      {/* Trip hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/8 via-background to-warm-sand/20 p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sky-blue/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {activities.map((a) => (
                <ActivityTag key={a} name={a} />
              ))}
            </div>
            <h1 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {trip.destination}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {format(parseISO(trip.start_date), "MMMM d")} –{" "}
              {format(parseISO(trip.end_date), "MMMM d, yyyy")}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <TravelerAvatarGroup
                travelers={trip.travelers.map((t) => ({
                  name: t.name,
                  traveler_type: t.traveler_type,
                }))}
                size="md"
              />
              <InviteDialog tripId={trip.id} />
            </div>
          </div>
          {daysUntil >= 0 && (
            <CountdownWidget days={daysUntil} destination={trip.destination.split(",")[0]} className="lg:min-w-[200px]" />
          )}
        </div>
      </div>

      <ProgressStats progress={progress} />

      {/* Tabs */}
      <Tabs defaultValue="pack" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/50 p-1.5">
          {tabItems.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 rounded-xl px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-travel-sm sm:flex-none"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pack" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <SharedItemsSection items={trip.packing_items} />
              {pets.map((pet) => (
                <PetTravelCard key={pet.id} pet={pet} items={trip.packing_items} />
              ))}

              <Tabs defaultValue="all">
                <TabsList className="mb-4 flex h-auto flex-wrap gap-1 rounded-xl bg-muted/40 p-1">
                  <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                  {trip.travelers
                    .filter((t) => t.traveler_type !== "pet")
                    .map((t) => (
                      <TabsTrigger key={t.id} value={t.id} className="rounded-lg">
                        {t.name}
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
                {trip.travelers
                  .filter((t) => t.traveler_type !== "pet")
                  .map((t) => (
                    <TabsContent key={t.id} value={t.id}>
                      <PackingChecklist
                        items={trip.packing_items}
                        travelers={trip.travelers}
                        tripId={trip.id}
                        filterTraveler={t.id}
                      />
                    </TabsContent>
                  ))}
              </Tabs>
            </div>

            <div className="space-y-6">
              <CollaborationFeed items={trip.packing_items} travelers={trip.travelers} />
              {aiRecs.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <AiSuggestionList recommendations={aiRecs} />
                </div>
              )}
              <PackingTimeline milestones={timeline} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="outfits">
          <OutfitPlanner outfits={trip.outfits} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {weather?.daily && weather.daily.length > 0 && (
            <WeatherPreview location={weather.location ?? trip.destination} days={weather.daily} />
          )}
          <CalendarView days={trip.calendar_days} outfits={trip.outfits} />
        </TabsContent>

        <TabsContent value="concierge">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="h-[min(560px,70vh)]">
                <AiChat tripId={trip.id} initialMessages={chatMessages} />
              </div>
            </div>
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-2xl border bg-warm-sand/20 p-5 dark:bg-warm-sand/5">
                <div className="mb-3 flex items-center gap-2">
                  <Luggage className="h-4 w-4 text-primary" />
                  <p className="text-display font-semibold">Your travel concierge</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ask me to optimize for carry-on, add activity gear, adjust for weather, or
                  reduce overpacking. I&apos;ll update your list without rebuilding the trip.
                </p>
              </div>
              {aiRecs.length > 0 && <AiSuggestionList recommendations={aiRecs} />}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
