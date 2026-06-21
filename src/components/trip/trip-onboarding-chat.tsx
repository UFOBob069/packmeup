"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTrip } from "@/actions/trips";
import { ACTIVITY_OPTIONS } from "@/lib/types";
import type {
  LaundryAccess,
  PackingMode,
  StylePreference,
  TravelType,
  TravelerType,
  TripOnboardingData,
  TripTemplateData,
} from "@/lib/types";
import {
  PACKING_MODE_LABELS,
  STYLE_LABELS,
  TRAVEL_TYPE_LABELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Step =
  | "destination"
  | "dates"
  | "travelers"
  | "travel_type"
  | "laundry"
  | "style"
  | "activities"
  | "packing_mode"
  | "notes"
  | "review";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const STEP_PROMPTS: Record<Step, string> = {
  destination: "Where are you headed? Tell me your destination.",
  dates: "When are you traveling? Pick your departure and return dates.",
  travelers: "Who's coming along? Add everyone — including pets!",
  travel_type: "How are you packing?",
  laundry: "Will you have access to laundry?",
  style: "What's your style vibe for this trip?",
  activities: "What activities are you planning?",
  packing_mode: "How should I optimize your packing?",
  notes: "Anything else I should know?",
  review: "Here's your trip summary. Ready to generate your packing list?",
};

const TRAVEL_TYPES: TravelType[] = ["carry_on", "checked_bag", "multiple_bags", "road_trip"];
const LAUNDRY_OPTIONS: LaundryAccess[] = ["none", "limited", "full"];
const STYLE_OPTIONS: StylePreference[] = [
  "casual",
  "smart_casual",
  "business",
  "formal",
  "athletic",
  "minimalist",
];
const PACKING_MODES: PackingMode[] = ["standard", "minimalist", "comfort", "carry_on_optimized"];
const TRAVELER_TYPES: { value: TravelerType; label: string }[] = [
  { value: "adult", label: "Adult" },
  { value: "child", label: "Child" },
  { value: "infant", label: "Infant" },
  { value: "pet", label: "Pet" },
];

interface TripOnboardingChatProps {
  templateData?: TripTemplateData;
}

export function TripOnboardingChat({ templateData }: TripOnboardingChatProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("destination");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: STEP_PROMPTS.destination },
  ]);
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<Partial<TripOnboardingData>>({
    travelers: templateData?.travelers ?? [{ name: "", traveler_type: "adult" }],
    activities: templateData?.activities ?? [],
    travel_type: templateData?.travel_type ?? "checked_bag",
    laundry_access: templateData?.laundry_access ?? "limited",
    style_preference: templateData?.style_preference ?? "casual",
    packing_mode: templateData?.packing_mode ?? "standard",
    special_notes: templateData?.special_notes ?? "",
  });

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [travelerInput, setTravelerInput] = useState({ name: "", type: "adult" as TravelerType });

  const addMessage = (role: "assistant" | "user", content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const goToStep = (next: Step, userResponse: string) => {
    addMessage("user", userResponse);
    setTimeout(() => {
      addMessage("assistant", STEP_PROMPTS[next]);
      setStep(next);
    }, 300);
  };

  const handleDestination = () => {
    if (!destination.trim()) return;
    setData((d) => ({ ...d, destination: destination.trim() }));
    goToStep("dates", destination.trim());
  };

  const handleDates = () => {
    if (!startDate || !endDate) return;
    setData((d) => ({
      ...d,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    }));
    goToStep(
      "travelers",
      `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`
    );
  };

  const addTraveler = () => {
    if (!travelerInput.name.trim()) return;
    const travelers = [
      ...(data.travelers ?? []),
      { name: travelerInput.name.trim(), traveler_type: travelerInput.type },
    ];
    setData((d) => ({ ...d, travelers }));
    setTravelerInput({ name: "", type: "adult" });
  };

  const handleTravelers = () => {
    const valid = (data.travelers ?? []).filter((t) => t.name.trim());
    if (valid.length === 0) return;
    setData((d) => ({ ...d, travelers: valid }));
    goToStep("travel_type", valid.map((t) => t.name).join(", "));
  };

  const handleTravelType = (type: TravelType) => {
    setData((d) => ({ ...d, travel_type: type }));
    goToStep("laundry", TRAVEL_TYPE_LABELS[type]);
  };

  const handleLaundry = (access: LaundryAccess) => {
    setData((d) => ({ ...d, laundry_access: access }));
    goToStep("style", access.charAt(0).toUpperCase() + access.slice(1) + " access");
  };

  const handleStyle = (style: StylePreference) => {
    setData((d) => ({ ...d, style_preference: style }));
    goToStep("activities", STYLE_LABELS[style]);
  };

  const toggleActivity = (activity: string) => {
    setData((d) => {
      const current = d.activities ?? [];
      const next = current.includes(activity)
        ? current.filter((a) => a !== activity)
        : [...current, activity];
      return { ...d, activities: next };
    });
  };

  const handleActivities = () => {
    goToStep("packing_mode", (data.activities ?? []).join(", ") || "General sightseeing");
  };

  const handlePackingMode = (mode: PackingMode) => {
    setData((d) => ({ ...d, packing_mode: mode }));
    goToStep("notes", PACKING_MODE_LABELS[mode]);
  };

  const handleNotes = (notes: string) => {
    setData((d) => ({ ...d, special_notes: notes }));
    goToStep("review", notes || "No special notes");
  };

  const handleGenerate = () => {
    startTransition(async () => {
      const tripData = data as TripOnboardingData;
      const trip = await createTrip(tripData);
      if (trip) router.push(`/trips/${trip.id}`);
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              msg.role === "assistant"
                ? "bg-muted"
                : "ml-auto bg-primary text-primary-foreground"
            )}
          >
            {msg.content}
          </div>
        ))}

        {/* Step inputs */}
        <div className="rounded-xl border bg-card p-4">
          {step === "destination" && (
            <div className="flex gap-2">
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Scottsdale, Arizona"
                onKeyDown={(e) => e.key === "Enter" && handleDestination()}
              />
              <Button onClick={handleDestination}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "dates" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Departure</p>
                  <Popover>
                    <PopoverTrigger render={<Button variant="outline" className="w-full justify-start" />}>
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Return</p>
                  <Popover>
                    <PopoverTrigger render={<Button variant="outline" className="w-full justify-start" />}>
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => (startDate ? date < startDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button onClick={handleDates} disabled={!startDate || !endDate} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === "travelers" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(data.travelers ?? [])
                  .filter((t) => t.name.trim())
                  .map((t, i) => (
                    <Badge key={i} variant="secondary">
                      {t.name} ({t.traveler_type})
                    </Badge>
                  ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={travelerInput.name}
                  onChange={(e) => setTravelerInput((t) => ({ ...t, name: e.target.value }))}
                  placeholder="Name"
                  onKeyDown={(e) => e.key === "Enter" && addTraveler()}
                />
                <select
                  value={travelerInput.type}
                  onChange={(e) =>
                    setTravelerInput((t) => ({ ...t, type: e.target.value as TravelerType }))
                  }
                  className="rounded-md border bg-background px-2 text-sm"
                >
                  {TRAVELER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button variant="outline" onClick={addTraveler}>
                  Add
                </Button>
              </div>
              <Button onClick={handleTravelers} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === "travel_type" && (
            <div className="grid grid-cols-2 gap-2">
              {TRAVEL_TYPES.map((type) => (
                <Button key={type} variant="outline" onClick={() => handleTravelType(type)}>
                  {TRAVEL_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          )}

          {step === "laundry" && (
            <div className="grid grid-cols-3 gap-2">
              {LAUNDRY_OPTIONS.map((opt) => (
                <Button key={opt} variant="outline" onClick={() => handleLaundry(opt)}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Button>
              ))}
            </div>
          )}

          {step === "style" && (
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((style) => (
                <Button key={style} variant="outline" onClick={() => handleStyle(style)}>
                  {STYLE_LABELS[style]}
                </Button>
              ))}
            </div>
          )}

          {step === "activities" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => toggleActivity(activity)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      (data.activities ?? []).includes(activity)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {activity}
                  </button>
                ))}
              </div>
              <Button onClick={handleActivities} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === "packing_mode" && (
            <div className="grid grid-cols-2 gap-2">
              {PACKING_MODES.map((mode) => (
                <Button key={mode} variant="outline" onClick={() => handlePackingMode(mode)}>
                  {PACKING_MODE_LABELS[mode]}
                </Button>
              ))}
            </div>
          )}

          {step === "notes" && (
            <div className="space-y-3">
              <Textarea
                placeholder="I get cold easily, need room for souvenirs, traveling with my dog..."
                defaultValue={data.special_notes}
                onBlur={(e) => handleNotes(e.target.value)}
              />
              <Button onClick={() => handleNotes(data.special_notes ?? "")} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Destination:</strong> {data.destination}
                </p>
                <p>
                  <strong>Dates:</strong> {data.start_date} → {data.end_date}
                </p>
                <p>
                  <strong>Travelers:</strong>{" "}
                  {(data.travelers ?? []).map((t) => t.name).join(", ")}
                </p>
                <p>
                  <strong>Style:</strong> {STYLE_LABELS[data.style_preference!]}
                </p>
                <p>
                  <strong>Activities:</strong>{" "}
                  {(data.activities ?? []).join(", ") || "General"}
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={isPending} className="w-full" size="lg">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating your packing list...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Packing List
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
