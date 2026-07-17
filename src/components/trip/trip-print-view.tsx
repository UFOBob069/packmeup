import { format, parseISO } from "date-fns";
import { normalizeOutfitItems } from "@/lib/outfit-items";
import type { PackingCategory, TripWithDetails } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const CATEGORY_ORDER: PackingCategory[] = [
  "clothing",
  "shoes",
  "toiletries",
  "electronics",
  "travel_documents",
  "medications",
  "activity_gear",
  "pet_supplies",
  "miscellaneous",
];

interface TripPrintViewProps {
  trip: TripWithDetails;
}

export function TripPrintView({ trip }: TripPrintViewProps) {
  const topLevel = trip.packing_items.filter((i) => !i.parent_item_id);
  const childrenByParent = trip.packing_items.reduce(
    (acc, item) => {
      if (item.parent_item_id) {
        if (!acc[item.parent_item_id]) acc[item.parent_item_id] = [];
        acc[item.parent_item_id].push(item);
      }
      return acc;
    },
    {} as Record<string, typeof trip.packing_items>
  );

  const grouped = topLevel.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof topLevel>
  );

  const outfitsByDate = trip.outfits.reduce(
    (acc, o) => {
      if (!acc[o.trip_date]) acc[o.trip_date] = [];
      acc[o.trip_date].push(o);
      return acc;
    },
    {} as Record<string, typeof trip.outfits>
  );

  const calendarByDate = Object.fromEntries(
    trip.calendar_days.map((d) => [d.trip_date, d])
  );

  const dates = Object.keys({ ...outfitsByDate, ...calendarByDate }).sort();
  if (dates.length === 0) {
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);
    let d = start;
    while (d <= end) {
      dates.push(format(d, "yyyy-MM-dd"));
      d = new Date(d.getTime() + 86400000);
    }
  }

  const packed = trip.packing_items.filter((i) => i.packed).length;
  const total = trip.packing_items.length;

  return (
    <div className="print-document mx-auto max-w-3xl bg-white p-8 text-black">
      <header className="border-b border-black/20 pb-4">
        <h1 className="text-2xl font-bold">{trip.destination}</h1>
        <p className="mt-1 text-sm text-black/70">
          {format(parseISO(trip.start_date), "MMMM d")} –{" "}
          {format(parseISO(trip.end_date), "MMMM d, yyyy")}
        </p>
        <p className="mt-2 text-sm">
          {packed} of {total} items packed
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Packing checklist</h2>
        {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((category) => (
          <div key={category} className="mt-4 break-inside-avoid">
            <h3 className="border-b border-black/10 pb-1 text-sm font-semibold uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {grouped[category].map((item) => {
                const kids = childrenByParent[item.id] ?? [];
                const traveler = trip.travelers.find((t) => t.id === item.traveler_id);
                return (
                  <li key={item.id} className="text-sm">
                    <label className="flex items-start gap-2">
                      <span className="mt-0.5 inline-block h-4 w-4 shrink-0 border border-black/40">
                        {item.packed ? "✓" : ""}
                      </span>
                      <span>
                        <span className="font-medium">
                          {item.quantity > 1 ? `${item.quantity}× ` : ""}
                          {item.item_name}
                        </span>
                        {item.shared && (
                          <span className="ml-1 text-xs text-black/60">(shared)</span>
                        )}
                        {traveler && (
                          <span className="ml-1 text-xs text-black/60">({traveler.name})</span>
                        )}
                        {kids.length > 0 && (
                          <ul className="mt-1 ml-4 list-disc text-black/80">
                            {kids.map((child) => (
                              <li key={child.id}>
                                {child.packed ? "☑ " : "☐ "}
                                {child.item_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {dates.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Day by day</h2>
          <div className="mt-4 space-y-4">
            {dates.map((date) => {
              const day = calendarByDate[date];
              const dayOutfits = outfitsByDate[date] ?? [];
              return (
                <div key={date} className="break-inside-avoid border-t border-black/10 pt-3">
                  <h3 className="font-semibold">
                    {format(parseISO(date), "EEEE, MMM d")}
                    {day?.title ? ` — ${day.title}` : ""}
                  </h3>
                  {day?.notes && (
                    <p className="mt-1 text-sm text-black/70">Notes: {day.notes}</p>
                  )}
                  {dayOutfits.map((outfit) => {
                    const items = normalizeOutfitItems(outfit.items);
                    return (
                      <div key={outfit.id} className="mt-2 text-sm">
                        <p className="font-medium">
                          {outfit.title}
                          {outfit.activity_name ? ` (${outfit.activity_name})` : ""}
                        </p>
                        {outfit.description && (
                          <p className="text-black/70">{outfit.description}</p>
                        )}
                        {items.length > 0 && (
                          <p className="mt-0.5">{items.map((i) => i.name).join(" · ")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="mt-8 border-t border-black/10 pt-4 text-xs text-black/50">
        Printed from PackForVacation.com · {format(new Date(), "MMM d, yyyy")}
      </footer>
    </div>
  );
}
