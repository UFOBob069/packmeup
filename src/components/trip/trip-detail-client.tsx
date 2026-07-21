"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays, format, parseISO } from "date-fns";
import {
  CloudSun,
  Compass,
  Home,
  Luggage,
  ListChecks,
  CalendarDays,
  MessageCircle,
  Printer,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackingChecklist } from "./packing-checklist";
import { DayPlanner } from "./day-planner";
import { AiChat } from "./ai-chat";
import { InviteDialog } from "./invite-dialog";
import { TripSettingsMenu } from "./trip-settings-menu";
import { RealtimePacking } from "./realtime-packing";
import { TripPrepWorkspace } from "./trip-prep-workspace";
import { ActivityHub } from "./activity-hub";
import { WeatherHub } from "./weather-hub";
import { PackingSidebar } from "./packing-sidebar";
import { TravelerPackingFilters } from "./packing-traveler-filters";
import { CountdownWidget } from "@/components/design/countdown-widget";
import { ActivityTag } from "@/components/design/activity-tag";
import { DestinationCover } from "./destination-cover";
import type { ChatMessage, GearItem, MemberRole, TripWithDetails, WeatherData } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";
import { generatePackingTimeline } from "@/lib/design-system";

interface TripDetailClientProps {
  trip: TripWithDetails;
  chatMessages: ChatMessage[];
  gearItems: GearItem[];
  canEdit?: boolean;
  canManage?: boolean;
  memberRole?: MemberRole;
}

const tabItems = [
  { value: "pack", label: "Checklist", icon: ListChecks },
  { value: "days", label: "By Day", icon: CalendarDays },
  { value: "activities", label: "Activities", icon: Compass },
  { value: "groceries", label: "Groceries", icon: ShoppingCart },
  { value: "check-in", label: "Check-in", icon: Home },
  { value: "weather", label: "Weather", icon: CloudSun },
  { value: "concierge", label: "Packing Help", icon: MessageCircle },
];

export function TripDetailClient({
  trip,
  chatMessages,
  gearItems,
  canEdit = true,
  canManage = true,
  memberRole = "owner",
}: TripDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pack");
  const [travelerFilter, setTravelerFilter] = useState("all");
  const progress = calculateProgress(trip.packing_items, trip.travelers);
  const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
  const activities = [...new Set(trip.activities.map((a) => a.activity_name))];
  const timeline = generatePackingTimeline(daysUntil);
  const weather = trip.weather_data as WeatherData | null;
  const visibleTabs = canEdit
    ? tabItems
    : tabItems.filter((tab) => tab.value !== "concierge");

  const checklistFilter =
    travelerFilter === "all"
      ? undefined
      : travelerFilter === "shared"
        ? "shared"
        : travelerFilter;

  const sidebarProps = {
    trip,
    progress,
    daysUntil,
    timeline,
    gearItems,
    onOptimize: canEdit ? () => setActiveTab("concierge") : undefined,
  };

  return (
    <div className="space-y-5">
      <RealtimePacking tripId={trip.id} onUpdate={() => router.refresh()} />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-travel-sm">
        <DestinationCover
          destination={trip.destination}
          coverImageUrl={trip.cover_image_url}
          variant="hero"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {activities.map((a) => (
                  <ActivityTag key={a} name={a} className="border-white/20 bg-black/30 text-white" />
                ))}
              </div>
              <h1 className="text-display truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {trip.destination}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {format(parseISO(trip.start_date), "MMM d")} –{" "}
                {format(parseISO(trip.end_date), "MMM d, yyyy")}
                {memberRole === "viewer" ? " · View only" : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {daysUntil >= 0 && (
                <CountdownWidget
                  days={daysUntil}
                  destination={trip.destination.split(",")[0]}
                  compact
                  className="border-white/20 bg-black/30 text-white"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/trips/${trip.id}/print`, "_blank", "noopener,noreferrer")
                }
                className="cursor-pointer border-white/20 bg-black/30 text-white hover:bg-black/40 hover:text-white"
              >
                <Printer className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              {canManage && (
                <>
                  <InviteDialog
                    tripId={trip.id}
                    destination={trip.destination}
                    coverImageUrl={trip.cover_image_url}
                    startDate={trip.start_date}
                    endDate={trip.end_date}
                  />
                  <TripSettingsMenu tripId={trip.id} destination={trip.destination} />
                </>
              )}
            </div>
          </div>
        </DestinationCover>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/50 p-1.5">
          {visibleTabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 rounded-xl px-4 py-2.5 transition-colors hover:bg-background/80 data-active:bg-background data-active:shadow-travel-sm data-active:hover:bg-background sm:flex-none"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pack">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <TravelerPackingFilters
                travelers={trip.travelers}
                progress={progress}
                value={travelerFilter}
                onChange={setTravelerFilter}
              />

              <PackingChecklist
                items={trip.packing_items}
                travelers={trip.travelers}
                tripId={trip.id}
                filterTraveler={checklistFilter ?? null}
                gearItems={gearItems}
                readOnly={!canEdit}
              />

              <div className="lg:hidden">
                <PackingSidebar {...sidebarProps} />
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto pb-4">
                <PackingSidebar {...sidebarProps} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="days">
          <DayPlanner
            tripId={trip.id}
            startDate={trip.start_date}
            endDate={trip.end_date}
            destination={trip.destination}
            days={trip.calendar_days}
            outfits={trip.outfits}
            weather={weather}
            gearItems={gearItems}
            tripActivities={activities}
            workspaceItems={trip.workspace_items ?? []}
            fallbackArrivalNotes={trip.special_notes}
            editable={canEdit}
          />
        </TabsContent>

        <TabsContent value="activities">
          <ActivityHub
            tripId={trip.id}
            startDate={trip.start_date}
            endDate={trip.end_date}
            activities={trip.activities}
            days={trip.calendar_days}
            readOnly={!canEdit}
          />
        </TabsContent>

        <TabsContent value="groceries">
          <TripPrepWorkspace
            tripId={trip.id}
            items={trip.workspace_items ?? []}
            fallbackArrivalNotes={trip.special_notes}
            readOnly={!canEdit}
            view="grocery"
          />
        </TabsContent>

        <TabsContent value="check-in">
          <TripPrepWorkspace
            tripId={trip.id}
            items={trip.workspace_items ?? []}
            fallbackArrivalNotes={trip.special_notes}
            readOnly={!canEdit}
            view="arrival"
          />
        </TabsContent>

        <TabsContent value="weather">
          <WeatherHub destination={trip.destination} weather={weather} />
        </TabsContent>

        {canEdit && (
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
                    <p className="text-display font-semibold">Your packing expert</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ask me to optimize for carry-on, add gear for an activity, adjust for weather,
                    or trim what you don&apos;t need.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
