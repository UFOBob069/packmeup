"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Home, Plus, ShoppingCart, Trash2 } from "lucide-react";
import {
  addTripWorkspaceItem,
  deleteTripWorkspaceItem,
  toggleTripWorkspaceItem,
  updateTripWorkspaceItem,
} from "@/actions/trip-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TripWorkspaceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TripPrepWorkspaceProps {
  tripId: string;
  items: TripWorkspaceItem[];
  fallbackArrivalNotes?: string | null;
  readOnly?: boolean;
  view?: "all" | "grocery" | "arrival";
}

interface ItemSectionProps {
  tripId: string;
  kind: TripWorkspaceItem["kind"];
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: TripWorkspaceItem[];
  details?: boolean;
  readOnly?: boolean;
}

function EditableWorkspaceItem({
  tripId,
  item,
  kind,
  readOnly,
  showDetails,
}: {
  tripId: string;
  item: TripWorkspaceItem;
  kind: TripWorkspaceItem["kind"];
  readOnly?: boolean;
  showDetails?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [details, setDetails] = useState(item.details ?? "");
  const [, startTransition] = useTransition();
  const isLegacy = item.id === "legacy-arrival-notes";

  useEffect(() => {
    setTitle(item.title);
    setDetails(item.details ?? "");
  }, [item.title, item.details]);

  const saveTitle = () => {
    const trimmed = title.trim();
    if (readOnly || isLegacy || !trimmed || trimmed === item.title) return;
    startTransition(async () => {
      await updateTripWorkspaceItem(tripId, item.id, { title: trimmed });
      router.refresh();
    });
  };

  const saveDetails = () => {
    const next = details.trim() || null;
    if (readOnly || isLegacy || next === (item.details ?? null)) return;
    startTransition(async () => {
      await updateTripWorkspaceItem(tripId, item.id, { details: next });
      router.refresh();
    });
  };

  return (
    <div className="flex items-start gap-3 px-3 py-3">
      {kind !== "arrival" && (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            if (readOnly) return;
            startTransition(async () => {
              await toggleTripWorkspaceItem(tripId, item.id, !item.completed);
              router.refresh();
            });
          }}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
            item.completed && "border-primary bg-primary text-primary-foreground",
            readOnly && "cursor-default opacity-80"
          )}
          aria-label={
            item.completed ? `Mark ${item.title} incomplete` : `Complete ${item.title}`
          }
        >
          {item.completed && <Check className="h-3 w-3" />}
        </button>
      )}
      <div className="min-w-0 flex-1 space-y-1.5">
        {readOnly || isLegacy ? (
          <p
            className={cn(
              "text-sm font-medium",
              item.completed && "text-muted-foreground line-through"
            )}
          >
            {item.title}
          </p>
        ) : (
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={cn(
              "h-8 border-transparent bg-transparent px-0 text-sm font-medium shadow-none focus-visible:border-border focus-visible:bg-background focus-visible:px-2",
              item.completed && "text-muted-foreground line-through"
            )}
            aria-label={`Edit ${kind} title`}
          />
        )}
        {(showDetails || item.details || (!readOnly && !isLegacy && kind === "arrival")) &&
          (readOnly || isLegacy ? (
            item.details && (
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {item.details}
              </p>
            )
          ) : (
            <Textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              onBlur={saveDetails}
              placeholder={
                kind === "arrival"
                  ? "Door code, check-in time, address, contact…"
                  : "Optional details"
              }
              rows={2}
              className="resize-none text-xs"
            />
          ))}
      </div>
      {!readOnly && !isLegacy && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() =>
            startTransition(async () => {
              await deleteTripWorkspaceItem(tripId, item.id);
              router.refresh();
            })
          }
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function ItemSection({
  tripId,
  kind,
  title,
  description,
  icon: Icon,
  items,
  details,
  readOnly,
}: ItemSectionProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [detailDraft, setDetailDraft] = useState("");
  const [, startTransition] = useTransition();

  const add = () => {
    if (readOnly || !draft.trim()) return;
    startTransition(async () => {
      await addTripWorkspaceItem(tripId, kind, draft, details ? detailDraft : undefined);
      setDraft("");
      setDetailDraft("");
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-display font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {!readOnly && (
        <>
          <div className="mt-4 flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !details) add();
              }}
              placeholder={
                kind === "grocery"
                  ? "Add groceries"
                  : kind === "arrival"
                    ? "Check-in, confirmation, or arrival detail"
                    : "Add a before-you-go reminder"
              }
            />
            {!details && (
              <Button type="button" size="icon" onClick={add} disabled={!draft.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {details && (
            <div className="mt-2 space-y-2">
              <Textarea
                value={detailDraft}
                onChange={(event) => setDetailDraft(event.target.value)}
                placeholder="Door code, check-in time, address, contact, or confirmation number…"
                rows={2}
              />
              <Button type="button" size="sm" onClick={add} disabled={!draft.trim()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add detail
              </Button>
            </div>
          )}
        </>
      )}

      {items.length > 0 ? (
        <div className="mt-4 divide-y rounded-xl border bg-background">
          {items.map((item) => (
            <EditableWorkspaceItem
              key={item.id}
              tripId={tripId}
              item={item}
              kind={kind}
              readOnly={readOnly}
              showDetails={details}
            />
          ))}
        </div>
      ) : (
        readOnly && <p className="mt-4 text-sm text-muted-foreground">Nothing added yet.</p>
      )}
    </section>
  );
}

export function TripPrepWorkspace({
  tripId,
  items,
  fallbackArrivalNotes,
  readOnly = false,
  view = "all",
}: TripPrepWorkspaceProps) {
  const groceries = items.filter((item) => item.kind === "grocery");
  const arrivals = items.filter((item) => item.kind === "arrival");
  const reminders = items.filter((item) => item.kind === "reminder");
  const arrivalItems =
    arrivals.length > 0 || !fallbackArrivalNotes
      ? arrivals
      : [
          {
            id: "legacy-arrival-notes",
            trip_id: tripId,
            kind: "arrival" as const,
            title: "Trip and arrival notes",
            details: fallbackArrivalNotes,
            completed: false,
            sort_order: 0,
            created_at: "",
            updated_at: "",
          },
        ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-muted/20 p-5">
        <p className="text-display text-lg font-semibold">
          {view === "grocery"
            ? "Grocery list"
            : view === "arrival"
              ? "Check-in & arrival"
              : "Everything before departure"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {view === "grocery"
            ? "Build the shared shopping list here. Progress also appears in By Day."
            : view === "arrival"
              ? "Keep confirmations, door codes, arrival details, and before-you-go reminders together."
              : readOnly
                ? "View groceries, arrival information, and reminders for this trip."
                : "Keep groceries, arrival information, and reminders beside your packing list and calendar."}
        </p>
      </div>
      <div
        className={
          view === "arrival"
            ? "grid gap-5 lg:grid-cols-2"
            : view === "all"
              ? "grid gap-5 lg:grid-cols-3"
              : "grid gap-5"
        }
      >
        {(view === "all" || view === "grocery") && (
          <ItemSection
            tripId={tripId}
            kind="grocery"
            title="Grocery list"
            description={`${groceries.filter((item) => item.completed).length} of ${groceries.length} picked up`}
            icon={ShoppingCart}
            items={groceries}
            readOnly={readOnly}
          />
        )}
        {(view === "all" || view === "arrival") && (
          <>
            <ItemSection
              tripId={tripId}
              kind="arrival"
              title="Arrival & check-in"
              description="Confirmations, door codes, addresses, and arrival details"
              icon={Home}
              items={arrivalItems}
              details
              readOnly={readOnly}
            />
            <ItemSection
              tripId={tripId}
              kind="reminder"
              title="Before-you-go reminders"
              description={`${reminders.filter((item) => item.completed).length} of ${reminders.length} complete`}
              icon={Bell}
              items={reminders}
              readOnly={readOnly}
            />
          </>
        )}
      </div>
    </div>
  );
}
