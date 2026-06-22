"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  MapPin,
  Pencil,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DestinationAutocomplete } from "./destination-autocomplete";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTrip } from "@/actions/trips";
import { getDestinationQuestion } from "@/actions/onboarding";
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
import { fireCelebrationConfetti } from "@/lib/confetti";

type GenerationState = "idle" | "generating" | "complete";

type Step =
  | "destination"
  | "destination_details"
  | "dates"
  | "travelers"
  | "travel_type"
  | "laundry"
  | "style"
  | "activities"
  | "packing_mode"
  | "notes"
  | "review";

const STEP_PROMPTS: Record<Step, string> = {
  destination: "Where are you headed?",
  destination_details: "Tell us a bit more about the trip",
  dates: "When do you leave and come back?",
  travelers: "Who's coming along?",
  travel_type: "How are you traveling?",
  laundry: "Will you have laundry access?",
  style: "What's your vibe?",
  activities: "What will you be doing?",
  packing_mode: "How should we optimize packing?",
  notes: "Anything else we should know?",
  review: "Ready to build your list?",
};

const STEP_HINTS: Record<Step, string> = {
  destination: "I'll use this for weather and local packing tips.",
  destination_details: "We’ll pull the forecast once you pick dates — this is for plans weather can’t tell us.",
  dates: "Trip length changes how much clothing you need.",
  travelers: "Start with yourself — add partners, kids, or pets.",
  travel_type: "Carry-on vs checked bags changes what we suggest.",
  laundry: "More laundry access means fewer items to pack.",
  style: "Pick everything that applies.",
  activities: "We'll add the right gear for each activity.",
  packing_mode: "Light packer or bring-it-all?",
  notes: "Cold sensitivity, souvenirs, special needs...",
  review: "Review your trip details, then we'll build your list.",
};

const STEP_ORDER: Step[] = [
  "destination",
  "destination_details",
  "dates",
  "travelers",
  "travel_type",
  "laundry",
  "style",
  "activities",
  "packing_mode",
  "notes",
  "review",
];

const STEP_SHORT_LABELS: Record<Step, string> = {
  destination: "Destination",
  destination_details: "Trip details",
  dates: "Dates",
  travelers: "Travelers",
  travel_type: "Travel",
  laundry: "Laundry",
  style: "Style",
  activities: "Activities",
  packing_mode: "Packing",
  notes: "Notes",
  review: "Review",
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

const GENERATION_MESSAGES = [
  "Checking weather at your destination...",
  "Counting outfits for your trip length...",
  "Matching gear to your activities...",
  "Balancing shoes, layers, and toiletries...",
  "Adding shared essentials everyone needs...",
  "Optimizing for your bag type...",
  "Building your personalized checklist...",
];

interface TripOnboardingChatProps {
  templateData?: TripTemplateData;
  userName?: string;
}

function GenerationProgress() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % GENERATION_MESSAGES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 py-4 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <div>
        <p className="text-display text-lg font-semibold">Building your packing list</p>
        <p className="mt-2 text-sm text-muted-foreground transition-opacity duration-300">
          {GENERATION_MESSAGES[messageIndex]}
        </p>
      </div>
      <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}

function GenerationComplete() {
  useEffect(() => {
    void fireCelebrationConfetti();
  }, []);

  return (
    <div className="space-y-4 py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-4 ring-primary/10">
        <Check className="h-8 w-8 text-primary" />
      </div>
      <div>
        <p className="text-display text-xl font-semibold">Your list is ready!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Opening your packing command center...
        </p>
      </div>
    </div>
  );
}

export function TripOnboardingChat({ templateData, userName }: TripOnboardingChatProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("destination");
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [, startTransition] = useTransition();

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
  const [departureOpen, setDepartureOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [travelerInput, setTravelerInput] = useState<OnboardingTraveler>({
    name: "",
    traveler_type: "adult",
    pet_species: "dog",
    pet_size: "medium",
  });
  const [travelerError, setTravelerError] = useState<string | null>(null);
  const [notes, setNotes] = useState(data.special_notes ?? "");
  const [destinationQuestion, setDestinationQuestion] = useState<string | null>(null);
  const [questionHints, setQuestionHints] = useState<string[]>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [isMultiDestination, setIsMultiDestination] = useState<boolean | null>(
    data.is_multi_destination ?? null
  );
  const [additionalDestinations, setAdditionalDestinations] = useState(
    data.additional_destinations ?? ""
  );
  const [destinationContext, setDestinationContext] = useState(
    data.destination_context ?? ""
  );
  const [destinationDetailsError, setDestinationDetailsError] = useState<string | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const progress = Math.round(((stepIndex + 1) / STEP_ORDER.length) * 100);

  const goToStep = (next: Step) => setStep(next);

  const goBack = () => {
    if (stepIndex > 0) setStep(STEP_ORDER[stepIndex - 1]);
  };

  const getStepSummary = (s: Step): string | null => {
    switch (s) {
      case "destination":
        return data.destination || destination || null;
      case "destination_details": {
        const parts: string[] = [];
        if (data.is_multi_destination) {
          parts.push(
            data.additional_destinations?.trim()
              ? `Multi-stop: ${data.additional_destinations}`
              : "Multi-destination"
          );
        } else if (data.is_multi_destination === false) {
          parts.push("Single destination");
        }
        if (data.destination_context?.trim()) {
          parts.push(data.destination_context.trim());
        }
        return parts.length ? parts.join(" · ") : null;
      }
      case "dates":
        return startDate && endDate
          ? `${format(startDate, "MMM d")} – ${format(endDate, "MMM d, yyyy")}`
          : data.start_date && data.end_date
            ? `${data.start_date} → ${data.end_date}`
            : null;
      case "travelers":
        return (data.travelers ?? []).map((t) => t.name).join(", ") || null;
      case "travel_type":
        return data.travel_type ? TRAVEL_TYPE_LABELS[data.travel_type] : null;
      case "laundry":
        return data.laundry_access
          ? data.laundry_access.charAt(0).toUpperCase() + data.laundry_access.slice(1)
          : null;
      case "style":
        return (data.style_preferences ?? []).map((st) => STYLE_LABELS[st]).join(", ") || null;
      case "activities":
        return (data.activities ?? []).join(", ") || "General sightseeing";
      case "packing_mode":
        return data.packing_mode ? PACKING_MODE_LABELS[data.packing_mode] : null;
      case "notes":
        return data.special_notes?.trim() || "None";
      default:
        return null;
    }
  };

  const handleDestination = async (selected?: string) => {
    const value = (selected ?? destination).trim();
    if (!value) return;
    setDestination(value);
    setData((d) => ({ ...d, destination: value }));
    setDestinationDetailsError(null);
    setLoadingQuestion(true);
    goToStep("destination_details");
    try {
      const result = await getDestinationQuestion(value);
      setDestinationQuestion(result.question);
      setQuestionHints(result.hints);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleDestinationDetails = () => {
    if (isMultiDestination === null) {
      setDestinationDetailsError("Let us know if you're visiting more than one place.");
      return;
    }
    if (isMultiDestination && !additionalDestinations.trim()) {
      setDestinationDetailsError("Add your other stops so we can plan for each leg.");
      return;
    }
    setDestinationDetailsError(null);
    setData((d) => ({
      ...d,
      is_multi_destination: isMultiDestination,
      additional_destinations: isMultiDestination ? additionalDestinations.trim() : undefined,
      destination_context: destinationContext.trim() || undefined,
    }));
    goToStep("dates");
  };

  const appendHint = (hint: string) => {
    setDestinationContext((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return hint;
      if (trimmed.toLowerCase().includes(hint.toLowerCase())) return prev;
      return `${trimmed}, ${hint.toLowerCase()}`;
    });
  };

  const handleStartDateSelect = (date?: Date) => {
    if (!date) return;
    setStartDate(date);
    if (endDate && date > endDate) setEndDate(undefined);
    setDepartureOpen(false);
    window.setTimeout(() => setReturnOpen(true), 150);
  };

  const handleEndDateSelect = (date?: Date) => {
    if (!date) return;
    setEndDate(date);
    setReturnOpen(false);
  };

  const handleDates = () => {
    if (!startDate || !endDate) return;
    setData((d) => ({
      ...d,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    }));
    goToStep("travelers");
  };

  const buildTravelerEntry = (input: OnboardingTraveler): OnboardingTraveler | null => {
    if (!input.name.trim()) return null;
    return {
      name: input.name.trim(),
      traveler_type: input.traveler_type,
      ...(input.traveler_type === "pet"
        ? {
            pet_species: input.pet_species ?? "dog",
            pet_size: input.pet_size ?? "medium",
          }
        : {}),
    };
  };

  const addTraveler = () => {
    const entry = buildTravelerEntry(travelerInput);
    if (!entry) return;
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
    let travelers = [...(data.travelers ?? [])];
    const pending = buildTravelerEntry(travelerInput);
    if (pending) {
      travelers.push(pending);
      setTravelerInput({
        name: "",
        traveler_type: "adult",
        pet_species: "dog",
        pet_size: "medium",
      });
    }

    const valid = travelers.filter((t) => t.name.trim());
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
    goToStep("travel_type");
  };

  const handleTravelType = (type: TravelType) => {
    setData((d) => ({ ...d, travel_type: type }));
    goToStep("laundry");
  };

  const handleLaundry = (access: LaundryAccess) => {
    setData((d) => ({ ...d, laundry_access: access }));
    goToStep("style");
  };

  const toggleStyle = (style: StylePreference) => {
    setData((d) => {
      const current = d.style_preferences ?? [d.style_preference ?? "casual"];
      const next = current.includes(style)
        ? current.filter((st) => st !== style)
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
    goToStep("activities");
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

  const handleActivities = () => goToStep("packing_mode");

  const handlePackingMode = (mode: PackingMode) => {
    setData((d) => ({ ...d, packing_mode: mode }));
    goToStep("notes");
  };

  const handleNotesContinue = () => {
    setData((d) => ({ ...d, special_notes: notes }));
    goToStep("review");
  };

  const handleGenerate = () => {
    setGenerationState("generating");
    startTransition(async () => {
      try {
        const tripData = { ...data, special_notes: notes } as TripOnboardingData;
        const trip = await createTrip(tripData);
        if (trip) {
          setGenerationState("complete");
          window.setTimeout(() => router.push(`/trips/${trip.id}`), 2200);
        } else {
          setGenerationState("idle");
        }
      } catch {
        setGenerationState("idle");
      }
    });
  };

  const isGenerating = generationState !== "idle";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {stepIndex + 1} of {STEP_ORDER.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Completed steps */}
      {stepIndex > 0 && (
        <div className="space-y-2">
          {STEP_ORDER.slice(0, stepIndex).map((s) => {
            const summary = getStepSummary(s);
            if (!summary) return null;
            return (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(s)}
                className="flex w-full items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {STEP_SHORT_LABELS[s]}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium">{summary}</span>
                </span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      {/* Current step card */}
      <div
        className={cn(
          "rounded-2xl border bg-card p-6 shadow-travel-sm",
          step === "destination" && "relative z-10 overflow-visible"
        )}
      >
        <div className="mb-5 flex items-start gap-3">
          {stepIndex > 0 && !isGenerating && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={goBack}
              className="mt-0.5 shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-display text-xl font-semibold">{STEP_PROMPTS[step]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{STEP_HINTS[step]}</p>
          </div>
        </div>

        {generationState === "generating" ? (
          <GenerationProgress />
        ) : generationState === "complete" ? (
          <GenerationComplete />
        ) : (
          <>
            {step === "destination" && (
              <div className="flex gap-2">
                <DestinationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onSelect={(place) => void handleDestination(place.shortLabel)}
                  onSubmit={() => void handleDestination()}
                  placeholder="Scottsdale, Arizona"
                />
                <Button
                  onClick={() => void handleDestination()}
                  disabled={!destination.trim() || loadingQuestion}
                >
                  {loadingQuestion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {step === "destination_details" && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium">{data.destination || destination}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Is this a multi-destination trip?</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isMultiDestination === true ? "default" : "outline"}
                      onClick={() => setIsMultiDestination(true)}
                      className="flex-1"
                    >
                      Yes, multiple stops
                    </Button>
                    <Button
                      type="button"
                      variant={isMultiDestination === false ? "default" : "outline"}
                      onClick={() => setIsMultiDestination(false)}
                      className="flex-1"
                    >
                      No, just one place
                    </Button>
                  </div>
                </div>

                {isMultiDestination && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Where else are you going?</p>
                    <Input
                      placeholder="Paris, then Rome, then Florence"
                      value={additionalDestinations}
                      onChange={(e) => setAdditionalDestinations(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      List other cities or regions — we&apos;ll factor in each leg of the trip.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {loadingQuestion ? (
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Tailoring a question for {data.destination || destination}...
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{destinationQuestion}</p>
                      <Textarea
                        placeholder="Optional — e.g. wedding guest, theme park days, business dinners..."
                        value={destinationContext}
                        onChange={(e) => setDestinationContext(e.target.value)}
                        rows={3}
                      />
                      {questionHints.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {questionHints.map((hint) => (
                            <button
                              key={hint}
                              type="button"
                              onClick={() => appendHint(hint)}
                              className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                            >
                              {hint}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {destinationDetailsError && (
                  <p className="text-sm text-destructive">{destinationDetailsError}</p>
                )}

                <Button
                  onClick={handleDestinationDetails}
                  className="w-full"
                  disabled={loadingQuestion}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === "dates" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Departure</p>
                    <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
                      <PopoverTrigger
                        render={
                          <Button variant="outline" className="w-full justify-start" />
                        }
                      >
                        {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateSelect}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Return</p>
                    <Popover open={returnOpen} onOpenChange={setReturnOpen}>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start",
                              startDate && !endDate && "ring-2 ring-primary/30"
                            )}
                          />
                        }
                      >
                        {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={handleEndDateSelect}
                          disabled={(date) =>
                            startDate ? date < startDate : date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {startDate && !endDate && (
                  <p className="text-xs text-primary">Now pick your return date</p>
                )}
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
                  <p className="text-xs text-muted-foreground">
                    Click Add, or hit Continue to include what you&apos;ve typed.
                  </p>
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleNotesContinue} className="w-full">
                  Continue
                </Button>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{data.destination}</p>
                      {data.is_multi_destination && data.additional_destinations && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Also: {data.additional_destinations}
                        </p>
                      )}
                      {data.destination_context?.trim() && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {data.destination_context}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Dates</p>
                      <p className="font-medium">
                        {data.start_date} → {data.end_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Travelers</p>
                      <p className="font-medium">
                        {(data.travelers ?? []).map((t) => t.name).join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Style</p>
                      <p className="font-medium">
                        {(data.style_preferences ?? [])
                          .map((s) => STYLE_LABELS[s])
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Activities</p>
                      <p className="font-medium">
                        {(data.activities ?? []).join(", ") || "General"}
                      </p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleGenerate} className="w-full" size="lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Packing List
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
