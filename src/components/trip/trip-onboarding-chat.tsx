"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DestinationAutocomplete } from "./destination-autocomplete";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTrip } from "@/actions/trips";
import { ACTIVITY_OPTIONS } from "@/lib/types";
import type {
  LaundryAccess,
  OnboardingTraveler,
  PackingMode,
  PetSize,
  PetSpecies,
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
  destination: "First things first — where are you headed? I'll figure out what to pack.",
  dates: "When do you leave and come back? Trip length changes what you need to bring.",
  travelers: "Who's coming? Start with yourself, then add anyone else — pets included 🐾",
  travel_type: "How are you traveling — carry-on only or checking bags?",
  laundry: "Will you have laundry access? This helps me pack the right amount.",
  style: "What's your vibe? Pick everything that applies — casual, business, athletic, and more.",
  activities: "What will you be doing? I'll add the right gear to your list.",
  packing_mode: "How should I optimize your packing?",
  notes: "Anything I should know? Cold sensitivity, souvenirs, special needs...",
  review: "Ready to build your packing list?",
};

const STEP_ORDER: Step[] = [
  "destination", "dates", "travelers", "travel_type", "laundry",
  "style", "activities", "packing_mode", "notes", "review",
];

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

const PET_SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
];
const PET_SIZES: { value: PetSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

interface TripOnboardingChatProps {
  templateData?: TripTemplateData;
  userName?: string;
}

export function TripOnboardingChat({ templateData, userName }: TripOnboardingChatProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("destination");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: STEP_PROMPTS.destination },
  ]);
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<Partial<TripOnboardingData>>({
    travelers:
      templateData?.travelers ??
      (userName ? [{ name: userName, traveler_type: "adult" as TravelerType }] : []),
    activities: templateData?.activities ?? [],
    travel_type: templateData?.travel_type ?? "checked_bag",
    laundry_access: templateData?.laundry_access ?? "limited",
    style_preference: templateData?.style_preference ?? "casual",
    style_preferences: templateData?.style_preference
      ? [templateData.style_preference]
      : ["casual"],
    packing_mode: templateData?.packing_mode ?? "standard",
    special_notes: templateData?.special_notes ?? "",
  });

  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [travelerInput, setTravelerInput] = useState<OnboardingTraveler>({
    name: "",
    traveler_type: "adult",
    pet_species: "dog",
    pet_size: "medium",
  });
  const [travelerError, setTravelerError] = useState<string | null>(null);

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

  const handleDestination = (selected?: string) => {
    const value = (selected ?? destination).trim();
    if (!value) return;
    setDestination(value);
    setData((d) => ({ ...d, destination: value }));
    goToStep("dates", value);
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
    const entry: OnboardingTraveler = {
      name: travelerInput.name.trim(),
      traveler_type: travelerInput.traveler_type,
      ...(travelerInput.traveler_type === "pet"
        ? {
            pet_species: travelerInput.pet_species ?? "dog",
            pet_size: travelerInput.pet_size ?? "medium",
          }
        : {}),
    };
    setData((d) => ({ ...d, travelers: [...(d.travelers ?? []), entry] }));
    setTravelerInput({
      name: "",
      traveler_type: "adult",
      pet_species: "dog",
      pet_size: "medium",
    });
    setTravelerError(null);
  };

  const removeTraveler = (index: number) => {
    setData((d) => ({
      ...d,
      travelers: (d.travelers ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleTravelers = () => {
    const valid = (data.travelers ?? []).filter((t) => t.name.trim());
    const hasHuman = valid.some((t) => t.traveler_type !== "pet");
    if (valid.length === 0) {
      setTravelerError("Add at least one traveler to continue.");
      return;
    }
    if (!hasHuman) {
      setTravelerError("Don't forget to add yourself — pets can't pack their own bags!");
      return;
    }
    setTravelerError(null);
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

  const toggleStyle = (style: StylePreference) => {
    setData((d) => {
      const current = d.style_preferences ?? [d.style_preference ?? "casual"];
      const next = current.includes(style)
        ? current.filter((s) => s !== style)
        : [...current, style];
      return {
        ...d,
        style_preferences: next.length ? next : [style],
        style_preference: (next.length ? next : [style])[0],
      };
    });
  };

  const handleStyles = () => {
    const styles = data.style_preferences?.length
      ? data.style_preferences
      : [data.style_preference ?? "casual"];
    setData((d) => ({
      ...d,
      style_preferences: styles,
      style_preference: styles[0],
    }));
    goToStep("activities", styles.map((s) => STYLE_LABELS[s]).join(", "));
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
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Building your packing list</span>
          <span>{Math.round(((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${((STEP_ORDER.indexOf(step) + 1) / STEP_ORDER.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "assistant"
                ? "rounded-bl-md bg-muted/70"
                : "ml-auto rounded-br-md bg-primary text-primary-foreground"
            )}
          >
            {msg.content}
          </div>
        ))}

        {/* Step inputs */}
        <div className="rounded-2xl border bg-card p-5 shadow-travel-sm">
          {step === "destination" && (
            <div className="flex gap-2">
              <DestinationAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={(place) => handleDestination(place.shortLabel)}
                onSubmit={() => handleDestination()}
                placeholder="Scottsdale, Arizona"
              />
              <Button onClick={() => handleDestination()} disabled={!destination.trim()}>
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
              <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                {userName
                  ? `We added you (${userName}) to get started. Add partners, kids, or pets below.`
                  : "Add yourself first, then anyone else joining the trip."}
              </p>
              <div className="space-y-2">
                {(data.travelers ?? []).map((t, i) => (
                  <div
                    key={`${t.name}-${i}`}
                    className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {t.traveler_type === "pet" ? "🐾" : "👤"}
                      </Badge>
                      <span className="text-sm font-medium">
                        {t.name}
                        {i === 0 && userName && t.name === userName ? " (you)" : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t.traveler_type}
                        {t.traveler_type === "pet" && t.pet_species
                          ? ` · ${t.pet_species}${t.pet_size ? `, ${t.pet_size}` : ""}`
                          : ""}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeTraveler(i)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 rounded-xl border p-3">
                <p className="text-xs font-medium text-muted-foreground">Add another traveler</p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={travelerInput.name}
                    onChange={(e) =>
                      setTravelerInput((t) => ({ ...t, name: e.target.value }))
                    }
                    placeholder="Name"
                    className="min-w-[120px] flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addTraveler()}
                  />
                  <select
                    value={travelerInput.traveler_type}
                    onChange={(e) =>
                      setTravelerInput((t) => ({
                        ...t,
                        traveler_type: e.target.value as TravelerType,
                      }))
                    }
                    className="rounded-md border bg-background px-2 text-sm"
                  >
                    {TRAVELER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {travelerInput.traveler_type === "pet" && (
                    <>
                      <select
                        value={travelerInput.pet_species ?? "dog"}
                        onChange={(e) =>
                          setTravelerInput((t) => ({
                            ...t,
                            pet_species: e.target.value as PetSpecies,
                          }))
                        }
                        className="rounded-md border bg-background px-2 text-sm"
                      >
                        {PET_SPECIES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={travelerInput.pet_size ?? "medium"}
                        onChange={(e) =>
                          setTravelerInput((t) => ({
                            ...t,
                            pet_size: e.target.value as PetSize,
                          }))
                        }
                        className="rounded-md border bg-background px-2 text-sm"
                      >
                        {PET_SIZES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <Button variant="outline" onClick={addTraveler}>
                    Add
                  </Button>
                </div>
              </div>
              {travelerError && (
                <p className="text-sm text-destructive">{travelerError}</p>
              )}
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
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      (data.style_preferences ?? []).includes(style)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {STYLE_LABELS[style]}
                  </button>
                ))}
              </div>
              <Button onClick={handleStyles} className="w-full">
                Continue
              </Button>
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
                  <strong>Style:</strong>{" "}
                  {(data.style_preferences ?? [data.style_preference!])
                    .map((s) => STYLE_LABELS[s])
                    .join(", ")}
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
